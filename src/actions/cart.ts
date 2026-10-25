"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { cartItems, inventory, productVariants, products } from "@/db/schema";
import { getCartLines, getCartVariant } from "@/db/queries/cart";
import { getCurrentUser } from "@/lib/auth";
import { firstZodMessage } from "@/lib/action-utils";
import { MAX_CART_QUANTITY } from "@/lib/cart";
import type { ActionResult, CartLine } from "@/types/commerce";

const addSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(MAX_CART_QUANTITY).default(1),
});

const updateSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(MAX_CART_QUANTITY),
});

const mergeSchema = z.array(
  z.object({
    variantId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(MAX_CART_QUANTITY),
  }),
);

async function cartResult(userId: string, message: string): Promise<ActionResult<CartLine[]>> {
  return { ok: true, data: await getCartLines(userId), message };
}

/** Rate limiting note: cart mutations are cheap but should still be limited
 * (e.g. 60 requests/minute per IP/user) behind a WAF or Upstash Ratelimit in
 * production. See src/lib/rate-limit.ts. */
export async function addToCartAction(input: {
  variantId: string;
  quantity?: number;
}): Promise<ActionResult<CartLine[]>> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstZodMessage(parsed.error) };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to add items to your cart." };
  }

  const variant = await getCartVariant(parsed.data.variantId);
  if (!variant || !variant.variantActive || !variant.productActive) {
    return { ok: false, message: "This option is no longer available." };
  }

  const stock = variant.stock ?? 0;
  if (stock < 1) {
    return { ok: false, message: "This option is sold out." };
  }

  const [existing] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.userId, user.id), eq(cartItems.variantId, variant.variantId)))
    .limit(1);

  const desired = Math.min(
    (existing?.quantity ?? 0) + parsed.data.quantity,
    stock,
    MAX_CART_QUANTITY,
  );

  await db
    .insert(cartItems)
    .values({
      userId: user.id,
      variantId: variant.variantId,
      quantity: desired,
    })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.variantId],
      set: { quantity: desired, updatedAt: new Date() },
    });

  revalidatePath("/cart");
  revalidatePath("/checkout");

  const message =
    desired === (existing?.quantity ?? 0)
      ? "You already have the maximum available quantity in your cart."
      : existing
        ? "Cart updated."
        : "Added to your cart.";

  return cartResult(user.id, message);
}

export async function updateCartQuantityAction(input: {
  variantId: string;
  quantity: number;
}): Promise<ActionResult<CartLine[]>> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstZodMessage(parsed.error) };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to update your cart." };

  if (parsed.data.quantity === 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, user.id), eq(cartItems.variantId, parsed.data.variantId)));
    revalidatePath("/checkout");
    return cartResult(user.id, "Item removed.");
  }

  const variant = await getCartVariant(parsed.data.variantId);
  if (!variant) return { ok: false, message: "This option is no longer available." };

  const stock = variant.stock ?? 0;
  const quantity = Math.min(parsed.data.quantity, stock, MAX_CART_QUANTITY);

  if (quantity < 1) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, user.id), eq(cartItems.variantId, variant.variantId)));
    return cartResult(user.id, "This item is sold out and was removed.");
  }

  await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.userId, user.id), eq(cartItems.variantId, variant.variantId)));

  revalidatePath("/checkout");

  return cartResult(
    user.id,
    quantity < parsed.data.quantity ? "Quantity adjusted to available stock." : "Cart updated.",
  );
}

export async function removeCartItemAction(input: {
  variantId: string;
}): Promise<ActionResult<CartLine[]>> {
  const parsed = z.object({ variantId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid cart item." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to update your cart." };

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, user.id), eq(cartItems.variantId, parsed.data.variantId)));

  revalidatePath("/cart");
  revalidatePath("/checkout");

  return cartResult(user.id, "Item removed from your cart.");
}

export async function clearCartAction(): Promise<ActionResult<CartLine[]>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to update your cart." };

  await db.delete(cartItems).where(eq(cartItems.userId, user.id));
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { ok: true, data: [], message: "Cart cleared." };
}

/**
 * Called once after sign-in. Guest cart items (variant ids + quantities only)
 * are merged into the database, capped by live inventory.
 */
export async function mergeCartAction(
  items: { variantId: string; quantity: number }[],
): Promise<ActionResult<CartLine[]>> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign-in required to save your cart." };
  }

  const parsed = mergeSchema.safeParse(items);
  if (!parsed.success || parsed.data.length === 0) {
    return { ok: true, data: await getCartLines(user.id), message: "Cart saved." };
  }

  const variantIds = Array.from(new Set(parsed.data.map((item) => item.variantId)));
  const variantRows = await db
    .select({
      id: productVariants.id,
      variantActive: productVariants.isActive,
      productActive: products.isActive,
      stock: inventory.quantity,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(inArray(productVariants.id, variantIds));
  const variantMap = new Map(variantRows.map((variant) => [variant.id, variant]));

  const existing = await db
    .select({ variantId: cartItems.variantId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.userId, user.id));
  const existingMap = new Map(existing.map((item) => [item.variantId, item.quantity]));

  await db.transaction(async (tx) => {
    for (const item of parsed.data) {
      const variant = variantMap.get(item.variantId);
      if (!variant || !variant.variantActive || !variant.productActive) continue;
      const stock = variant.stock ?? 0;
      if (stock < 1) continue;

      const quantity = Math.min(
        (existingMap.get(item.variantId) ?? 0) + item.quantity,
        stock,
        MAX_CART_QUANTITY,
      );

      await tx
        .insert(cartItems)
        .values({ userId: user.id, variantId: item.variantId, quantity })
        .onConflictDoUpdate({
          target: [cartItems.userId, cartItems.variantId],
          set: { quantity, updatedAt: new Date() },
        });
    }
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");

  return {
    ok: true,
    data: await getCartLines(user.id),
    message: "Your guest cart has been saved to your account.",
  };
}
