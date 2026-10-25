import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { coupons, type Coupon } from "@/db/schema";
import { formatPKR } from "@/lib/format";

export type CouponValidation =
  | { ok: true; coupon: Coupon; discount: number; message: string }
  | { ok: false; message: string };

export async function validateCoupon(
  code: string | undefined,
  subtotal: number,
): Promise<CouponValidation> {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return { ok: false, message: "Enter a coupon code." };

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalized))
    .limit(1);

  if (!coupon) return { ok: false, message: "That coupon code is not valid." };
  if (!coupon.isActive) return { ok: false, message: "That coupon is no longer active." };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, message: "That coupon is not active yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, message: "That coupon has expired." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "That coupon has reached its usage limit." };
  }
  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      message: `Add ${formatPKR(coupon.minSubtotal - subtotal)} more to use ${coupon.code}.`,
    };
  }

  let discount =
    coupon.type === "percentage"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal);

  if (discount <= 0) {
    return { ok: false, message: "That coupon does not apply to this order." };
  }

  // Usage limits are also re-checked inside the checkout transaction. A
  // distributed lock/atomic increment can be added if very high traffic
  // coupon drops are expected.
  return {
    ok: true,
    coupon,
    discount,
    message: `${coupon.code} applied — you saved ${formatPKR(discount)}.`,
  };
}
