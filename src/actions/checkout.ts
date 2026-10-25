"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  addresses,
  cartItems,
  couponRedemptions,
  coupons,
  inventory,
  orderItems,
  orderStatusHistory,
  orders,
} from "@/db/schema";
import { getCartLines } from "@/db/queries/cart";
import { CATALOG_TAG } from "@/db/queries/catalog";
import { getCurrentUser } from "@/lib/auth";
import { firstZodMessage, zodFieldErrors } from "@/lib/action-utils";
import { PAYMENT_METHODS, shippingFeeFor } from "@/lib/constants";
import { validateCoupon } from "@/lib/coupons";
import { formatPKR } from "@/lib/format";
import { buildOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations";
import type { ActionState, CouponResult } from "@/types/commerce";

class StockError extends Error {}

/**
 * Server-side coupon check. The client never sends a discount amount; only a
 * code, and the subtotal is recomputed from the live cart.
 */
export async function applyCouponAction(code: string): Promise<CouponResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to use a coupon." };

  const cart = await getCartLines(user.id);
  if (cart.length === 0) return { ok: false, message: "Your cart is empty." };

  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const result = await validateCoupon(code, subtotal);

  if (!result.ok) return { ok: false, message: result.message };

  return {
    ok: true,
    message: result.message,
    code: result.coupon.code,
    discount: result.discount,
    couponId: result.coupon.id,
  };
}

export async function placeOrderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in again to place your order." };
  }

  const parsed = checkoutSchema.safeParse({
    label: formData.get("label") || "Home",
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    province: formData.get("province"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
    street: formData.get("street"),
    landmark: formData.get("landmark"),
    isDefault: formData.get("isDefault") === "on",
    shippingMethod: formData.get("shippingMethod"),
    paymentMethod: formData.get("paymentMethod"),
    couponCode: formData.get("couponCode"),
    notes: formData.get("notes"),
    saveAddress: formData.get("saveAddress") === "on",
    terms: formData.get("terms") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  if (!PAYMENT_METHODS[input.paymentMethod].available) {
    return {
      ok: false,
      message: "That payment method is not available yet. Please choose COD or bank transfer.",
    };
  }

  // TODO(payments): Safepay / JazzCash / Easypaisa are intentionally stubbed.
  // When enabling one of them, create the hosted-checkout session *after* the
  // order row exists, redirect the shopper to the gateway, and only flip
  // `paymentStatus` to "paid" from a signature-verified server callback.
  // Never trust the browser redirect on its own. Checklist: src/lib/payments/README.md

  const cart = await getCartLines(user.id);
  if (cart.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  for (const line of cart) {
    if (line.availableStock < line.quantity) {
      return {
        ok: false,
        message: `${line.productName} only has ${line.availableStock} left. Please update your cart.`,
      };
    }
  }

  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shippingFee = shippingFeeFor(input.shippingMethod, subtotal);

  let discountTotal = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;

  if (input.couponCode) {
    const couponResult = await validateCoupon(input.couponCode, subtotal);
    if (!couponResult.ok) {
      return { ok: false, message: couponResult.message, fieldErrors: { couponCode: [couponResult.message] } };
    }
    discountTotal = couponResult.discount;
    couponId = couponResult.coupon.id;
    couponCode = couponResult.coupon.code;
  }

  const total = Math.max(subtotal + shippingFee - discountTotal, 0);
  const orderNumber = buildOrderNumber();
  // TODO(payments): card/wallet orders stay "unpaid" until the gateway webhook
  // confirms settlement; bank transfers await manual admin verification.
  const paymentStatus = input.paymentMethod === "bank_transfer" ? "pending_verification" : "unpaid";

  try {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: user.id,
          status: "pending",
          paymentMethod: input.paymentMethod,
          paymentStatus,
          subtotal,
          shippingFee,
          discountTotal,
          total,
          couponId,
          couponCode,
          shippingMethod: input.shippingMethod,
          shippingFullName: input.fullName,
          shippingPhone: input.phone,
          shippingProvince: input.province,
          shippingCity: input.city,
          shippingPostalCode: input.postalCode ?? null,
          shippingStreet: input.street,
          shippingLandmark: input.landmark ?? null,
          notes: input.notes ?? null,
        })
        .returning({ id: orders.id });

      if (!order) throw new Error("Order insert failed");

      await tx.insert(orderItems).values(
        cart.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          productSlug: line.productSlug,
          variantLabel: line.variantLabel,
          sku: line.sku,
          imageUrl: line.imageUrl,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.unitPrice * line.quantity,
        })),
      );

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "pending",
        note:
          input.paymentMethod === "bank_transfer"
            ? "Order placed. Awaiting bank transfer verification."
            : "Order placed with cash on delivery.",
      });

      // Conditional decrements ensure we never oversell even if two shoppers
      // check out the same last item at once. The transaction rolls back if
      // any line no longer has enough stock.
      for (const line of cart) {
        const updated = await tx
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} - ${line.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventory.variantId, line.variantId),
              gte(inventory.quantity, line.quantity),
            ),
          )
          .returning({ quantity: inventory.quantity });

        if (updated.length === 0) {
          throw new StockError(
            `${line.productName} (${line.variantLabel}) just sold out. Please review your cart.`,
          );
        }
      }

      if (couponId) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
          .where(eq(coupons.id, couponId));

        await tx.insert(couponRedemptions).values({
          couponId,
          userId: user.id,
          orderId: order.id,
          amount: discountTotal,
        });
      }

      if (input.saveAddress) {
        const existing = await tx
          .select({ id: addresses.id })
          .from(addresses)
          .where(eq(addresses.userId, user.id))
          .limit(1);

        await tx.insert(addresses).values({
          userId: user.id,
          label: input.label,
          fullName: input.fullName,
          phone: input.phone,
          province: input.province,
          city: input.city,
          postalCode: input.postalCode ?? null,
          street: input.street,
          landmark: input.landmark ?? null,
          isDefault: existing.length === 0,
        });
      }

      await tx.delete(cartItems).where(eq(cartItems.userId, user.id));
    });
  } catch (error) {
    if (error instanceof StockError) {
      return { ok: false, message: error.message };
    }
    console.error("[checkout] Failed to place order", error);
    return {
      ok: false,
      message: `We could not place your order (${formatPKR(total)}). Please try again or contact us on WhatsApp.`,
    };
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/account/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  // Stock changed, so expire cached product cards and detail pages.
  updateTag(CATALOG_TAG);

  redirect(`/orders/${orderNumber}?placed=1`);
}
