"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { firstZodMessage, zodFieldErrors } from "@/lib/action-utils";
import { rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validations";
import { CATALOG_TAG } from "@/db/queries/catalog";
import type { ActionState } from "@/types/commerce";

export async function submitReviewAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to write a review." };
  }

  // Lightweight in-memory limiter. In production, use a distributed limiter
  // (Upstash Ratelimit) so limits apply across serverless instances.
  const limit = rateLimit(`review:${user.id}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return {
      ok: false,
      message: "You have submitted several reviews recently. Please try again later.",
    };
  }

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const [product] = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(and(eq(products.id, parsed.data.productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) return { ok: false, message: "This product is no longer available." };

  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, user.id), eq(reviews.productId, product.id)))
    .limit(1);

  if (existing) {
    return {
      ok: false,
      message: "You have already reviewed this product. Thank you!",
    };
  }

  try {
    await db.insert(reviews).values({
      productId: product.id,
      userId: user.id,
      rating: parsed.data.rating,
      title: parsed.data.title ?? null,
      body: parsed.data.body,
    });
  } catch (error) {
    console.error("[reviews] Failed to submit review", error);
    return { ok: false, message: "We could not save your review. Please try again." };
  }

  updateTag(CATALOG_TAG);
  revalidatePath(`/products/${product.slug}`);

  return {
    ok: true,
    message: "Thank you! Your review is now live.",
  };
}
