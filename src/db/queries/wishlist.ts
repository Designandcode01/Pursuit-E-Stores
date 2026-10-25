import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { productImages, products, wishlistItems } from "@/db/schema";
import type { WishlistSnapshot } from "@/types/commerce";

export async function getWishlistItems(userId: string): Promise<WishlistSnapshot[]> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      price: products.basePrice,
      compareAtPrice: products.compareAtPrice,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(and(eq(wishlistItems.userId, userId), eq(products.isActive, true)))
    .orderBy(desc(wishlistItems.createdAt));

  if (rows.length === 0) return [];

  const images = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      isPrimary: productImages.isPrimary,
      sortOrder: productImages.sortOrder,
    })
    .from(productImages)
    .where(
      inArray(
        productImages.productId,
        rows.map((row) => row.productId),
      ),
    )
    .orderBy(desc(productImages.isPrimary), productImages.sortOrder);

  const imageByProduct = new Map<string, string>();
  for (const image of images) {
    if (!imageByProduct.has(image.productId)) imageByProduct.set(image.productId, image.url);
  }

  return rows.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    imageUrl: imageByProduct.get(row.productId) ?? null,
  }));
}

export async function getWishlistCount(userId: string) {
  const rows = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(and(eq(wishlistItems.userId, userId), eq(products.isActive, true)));
  return rows.length;
}
