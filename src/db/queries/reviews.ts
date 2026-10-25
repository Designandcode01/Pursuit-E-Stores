import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { reviews } from "@/db/schema";

export async function getUserReviewForProduct(userId: string, productId: string) {
  const [review] = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  return review ?? null;
}
