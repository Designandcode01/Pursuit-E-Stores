"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getWishlistItems } from "@/db/queries/wishlist";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult, WishlistSnapshot } from "@/types/commerce";

const productIdSchema = z.object({ productId: z.string().uuid() });

type ToggleResult = { wishlisted: boolean; items: WishlistSnapshot[] };

export async function toggleWishlistAction(input: {
  productId: string;
}): Promise<ActionResult<ToggleResult>> {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid product." };

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to save products to your wishlist." };
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, parsed.data.productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) return { ok: false, message: "This product is no longer available." };

  const [existing] = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(
      and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, product.id)),
    )
    .limit(1);

  let wishlisted: boolean;
  if (existing) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
    wishlisted = false;
  } else {
    await db
      .insert(wishlistItems)
      .values({ userId: user.id, productId: product.id })
      .onConflictDoNothing();
    wishlisted = true;
  }

  revalidatePath("/wishlist");
  revalidatePath("/account");

  return {
    ok: true,
    data: { wishlisted, items: await getWishlistItems(user.id) },
    message: wishlisted ? "Saved to your wishlist." : "Removed from your wishlist.",
  };
}

export async function mergeWishlistAction(
  productIds: string[],
): Promise<ActionResult<WishlistSnapshot[]>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign-in required to save your wishlist." };

  const parsed = z.array(z.string().uuid()).max(100).safeParse(productIds);
  if (!parsed.success || parsed.data.length === 0) {
    return { ok: true, data: await getWishlistItems(user.id) };
  }

  const validProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(and(inArray(products.id, parsed.data), eq(products.isActive, true)));

  if (validProducts.length > 0) {
    await db
      .insert(wishlistItems)
      .values(
        validProducts.map((product) => ({
          userId: user.id,
          productId: product.id,
        })),
      )
      .onConflictDoNothing();
  }

  revalidatePath("/wishlist");

  return { ok: true, data: await getWishlistItems(user.id) };
}
