import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  cartItems,
  inventory,
  productImages,
  productVariants,
  products,
} from "@/db/schema";
import { variantLabel } from "@/lib/cart";
import type { CartLine } from "@/types/commerce";

/** Load a signed-in customer's cart with live prices and stock. */
export async function getCartLines(userId: string): Promise<CartLine[]> {
  const rows = await db
    .select({
      cartItemId: cartItems.id,
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      sku: productVariants.sku,
      color: productVariants.color,
      size: productVariants.size,
      price: productVariants.price,
      basePrice: products.basePrice,
      quantity: cartItems.quantity,
      stock: inventory.quantity,
      lowStockThreshold: inventory.lowStockThreshold,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.createdAt));

  if (rows.length === 0) return [];

  const productIds = Array.from(new Set(rows.map((row) => row.productId)));
  const images = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      isPrimary: productImages.isPrimary,
      sortOrder: productImages.sortOrder,
    })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));

  const imageByProduct = new Map<string, string>();
  for (const image of images) {
    if (!imageByProduct.has(image.productId)) {
      imageByProduct.set(image.productId, image.url);
    }
  }

  return rows.map((row) => ({
    id: row.cartItemId,
    variantId: row.variantId,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
    variantLabel: variantLabel(row.color, row.size),
    sku: row.sku,
    imageUrl: imageByProduct.get(row.productId) ?? null,
    unitPrice: row.price ?? row.basePrice,
    quantity: row.quantity,
    availableStock: row.stock ?? 0,
  }));
}

export async function getCartCount(userId: string) {
  const rows = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.userId, userId));
  return rows.reduce((sum, row) => sum + row.quantity, 0);
}

export async function getCartVariant(variantId: string) {
  const [row] = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      color: productVariants.color,
      size: productVariants.size,
      price: productVariants.price,
      basePrice: products.basePrice,
      variantActive: productVariants.isActive,
      productActive: products.isActive,
      stock: inventory.quantity,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(productVariants.id, variantId))
    .limit(1);

  return row ?? null;
}

export async function getCartStockMap(userId: string) {
  const rows = await db
    .select({
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      stock: inventory.quantity,
    })
    .from(cartItems)
    .leftJoin(inventory, eq(inventory.variantId, cartItems.variantId))
    .where(eq(cartItems.userId, userId));
  return rows;
}

export async function variantExists(variantId: string) {
  const [row] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.id, variantId),
        eq(productVariants.isActive, true),
      ),
    )
    .limit(1);
  return Boolean(row);
}
