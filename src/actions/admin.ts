"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  categories,
  coupons,
  inventory,
  orderStatusHistory,
  orders,
  productImages,
  productVariants,
  products,
  reviews,
} from "@/db/schema";
import { CATALOG_TAG } from "@/db/queries/catalog";
import { firstZodMessage, zodFieldErrors } from "@/lib/action-utils";
import { getAdminUser } from "@/lib/auth";
import {
  categorySchema,
  couponSchema,
  orderStatusSchema,
  paymentStatusSchema,
  productSchema,
} from "@/lib/validations";
import type { ActionState } from "@/types/commerce";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) {
    return { admin: null, error: { ok: false as const, message: "Admin access required." } };
  }
  return { admin, error: null };
}

function refreshCatalog() {
  updateTag(CATALOG_TAG);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/categories");
}

function refreshAdmin(section: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/${section}`);
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function parseJsonArray(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Products                                  */
/* -------------------------------------------------------------------------- */

export async function saveProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await requireAdmin();
  if (error) return error;

  const productId = String(formData.get("productId") ?? "").trim() || null;

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription"),
    categoryId: formData.get("categoryId"),
    basePrice: formData.get("basePrice"),
    compareAtPrice: formData.get("compareAtPrice"),
    sku: formData.get("sku"),
    fabric: formData.get("fabric"),
    careInstructions: formData.get("careInstructions"),
    isFeatured: formData.get("isFeatured"),
    isNewArrival: formData.get("isNewArrival"),
    isActive: formData.get("isActive"),
    variants: parseJsonArray(formData.get("variantsJson")),
    images: parseJsonArray(formData.get("imagesJson")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const values = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription ?? null,
        categoryId: data.categoryId,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice ?? null,
        sku: data.sku,
        fabric: data.fabric ?? null,
        careInstructions: data.careInstructions ?? null,
        isFeatured: data.isFeatured,
        isNewArrival: data.isNewArrival,
        isActive: data.isActive,
        updatedAt: new Date(),
      };

      const [saved] = productId
        ? await tx
            .update(products)
            .set(values)
            .where(eq(products.id, productId))
            .returning({ id: products.id })
        : await tx.insert(products).values(values).returning({ id: products.id });

      if (!saved) throw new Error("Product could not be saved.");

      const existingVariants = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, saved.id));
      const existingVariantIds = new Set(existingVariants.map((row) => row.id));
      const keptVariantIds: string[] = [];

      for (const [index, variant] of data.variants.entries()) {
        const variantValues = {
          productId: saved.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          price: variant.price ?? null,
          isActive: true,
          sortOrder: index,
        };

        let variantId: string;
        if (variant.id && existingVariantIds.has(variant.id)) {
          const [updated] = await tx
            .update(productVariants)
            .set(variantValues)
            .where(eq(productVariants.id, variant.id))
            .returning({ id: productVariants.id });
          variantId = updated.id;
        } else {
          const [created] = await tx
            .insert(productVariants)
            .values(variantValues)
            .returning({ id: productVariants.id });
          variantId = created.id;
        }

        keptVariantIds.push(variantId);

        await tx
          .insert(inventory)
          .values({
            variantId,
            quantity: variant.stock,
            lowStockThreshold: variant.lowStockThreshold,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: inventory.variantId,
            set: {
              quantity: variant.stock,
              lowStockThreshold: variant.lowStockThreshold,
              updatedAt: new Date(),
            },
          });
      }

      const removedVariantIds = existingVariants
        .map((row) => row.id)
        .filter((id) => !keptVariantIds.includes(id));

      if (removedVariantIds.length > 0) {
        await tx.delete(productVariants).where(inArray(productVariants.id, removedVariantIds));
      }

      const existingImages = await tx
        .select({ id: productImages.id })
        .from(productImages)
        .where(eq(productImages.productId, saved.id));
      const existingImageIds = new Set(existingImages.map((row) => row.id));
      const keptImageIds: string[] = [];
      const primaryIndex = data.images.findIndex((image) => image.isPrimary);

      for (const [index, image] of data.images.entries()) {
        const imageValues = {
          productId: saved.id,
          url: image.url,
          alt: image.alt ?? null,
          sortOrder: index,
          isPrimary: primaryIndex === -1 ? index === 0 : index === primaryIndex,
        };

        if (image.id && existingImageIds.has(image.id)) {
          const [updated] = await tx
            .update(productImages)
            .set(imageValues)
            .where(eq(productImages.id, image.id))
            .returning({ id: productImages.id });
          keptImageIds.push(updated.id);
        } else {
          const [created] = await tx
            .insert(productImages)
            .values(imageValues)
            .returning({ id: productImages.id });
          keptImageIds.push(created.id);
        }
      }

      const removedImageIds = existingImages
        .map((row) => row.id)
        .filter((id) => !keptImageIds.includes(id));

      if (removedImageIds.length > 0) {
        await tx.delete(productImages).where(inArray(productImages.id, removedImageIds));
      }

      if (productId && productId !== saved.id) {
        throw new Error("Product id mismatch.");
      }
    });
  } catch (error) {
    console.error("[admin] saveProductAction failed", error);
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: "That slug or SKU is already in use. Choose a different one.",
      };
    }
    return { ok: false, message: "Could not save the product. Please try again." };
  }

  refreshCatalog();
  refreshAdmin("products");
  revalidatePath("/admin/products");
  redirect(`/admin/products?saved=1`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const { admin } = await requireAdmin();
  if (!admin) redirect("/");

  const productId = String(formData.get("productId") ?? "");
  if (!productId) redirect("/admin/products?error=missing");

  await db.delete(products).where(eq(products.id, productId));

  refreshCatalog();
  refreshAdmin("products");
  redirect("/admin/products?deleted=1");
}

export async function setProductFlagAction(formData: FormData): Promise<void> {
  const { admin } = await requireAdmin();
  if (!admin) redirect("/");

  const productId = String(formData.get("productId") ?? "");
  const flag = String(formData.get("flag") ?? "");
  const value = String(formData.get("value") ?? "") === "true";

  if (!productId || !["isActive", "isFeatured", "isNewArrival"].includes(flag)) {
    redirect("/admin/products?error=invalid");
  }

  const values =
    flag === "isActive"
      ? { isActive: value, updatedAt: new Date() }
      : flag === "isFeatured"
        ? { isFeatured: value, updatedAt: new Date() }
        : { isNewArrival: value, updatedAt: new Date() };

  await db.update(products).set(values).where(eq(products.id, productId));

  refreshCatalog();
  refreshAdmin("products");
  redirect(`/admin/products?updated=1`);
}

export async function updateStockAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await requireAdmin();
  if (error) return error;

  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity"));
  const threshold = Number(formData.get("lowStockThreshold") ?? 5);

  if (!variantId) return { ok: false, message: "Missing variant." };
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { ok: false, message: "Enter a whole number of units (0 or more)." };
  }
  if (!Number.isInteger(threshold) || threshold < 0) {
    return { ok: false, message: "Enter a valid low-stock threshold." };
  }

  await db
    .insert(inventory)
    .values({ variantId, quantity, lowStockThreshold: threshold, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: inventory.variantId,
      set: { quantity, lowStockThreshold: threshold, updatedAt: new Date() },
    });

  refreshCatalog();
  refreshAdmin("products");
  return { ok: true, message: "Stock updated." };
}

/* -------------------------------------------------------------------------- */
/*                                 Categories                                 */
/* -------------------------------------------------------------------------- */

export async function saveCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = categorySchema.safeParse({
    id: formData.get("categoryId") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const values = {
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    imageUrl: data.imageUrl ?? null,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    updatedAt: new Date(),
  };

  try {
    if (data.id) {
      await db.update(categories).set(values).where(eq(categories.id, data.id));
    } else {
      await db.insert(categories).values(values);
    }
  } catch (error) {
    console.error("[admin] saveCategoryAction failed", error);
    if (isUniqueViolation(error)) {
      return { ok: false, message: "That category slug is already in use." };
    }
    return { ok: false, message: "Could not save the category." };
  }

  refreshCatalog();
  refreshAdmin("categories");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { admin } = await requireAdmin();
  if (!admin) redirect("/");

  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) redirect("/admin/categories?error=missing");

  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.categoryId, categoryId));

  if (Number(row?.total ?? 0) > 0) {
    redirect("/admin/categories?error=in-use");
  }

  await db.delete(categories).where(eq(categories.id, categoryId));
  refreshCatalog();
  refreshAdmin("categories");
  redirect("/admin/categories?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*                                   Orders                                   */
/* -------------------------------------------------------------------------- */

export async function updateOrderStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note"),
    trackingNumber: formData.get("trackingNumber"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { orderId, status, note, trackingNumber } = parsed.data;

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status,
        trackingNumber: trackingNumber ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderStatusHistory).values({ orderId, status, note: note ?? null });
  });

  refreshAdmin("orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath("/admin");
  return { ok: true, message: "Order status updated." };
}

export async function updatePaymentStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = paymentStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    paymentStatus: formData.get("paymentStatus"),
    bankReference: formData.get("bankReference"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { orderId, paymentStatus, bankReference } = parsed.data;

  await db
    .update(orders)
    .set({
      paymentStatus,
      bankReference: bankReference ?? null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  refreshAdmin("orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  return { ok: true, message: "Payment status updated." };
}

export async function updateOrderNoteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await requireAdmin();
  if (error) return error;

  const orderId = String(formData.get("orderId") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!orderId) return { ok: false, message: "Missing order." };
  if (adminNote.length > 2000) return { ok: false, message: "Note is too long (max 2000)." };

  await db
    .update(orders)
    .set({ adminNote: adminNote || null, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Internal note saved." };
}

/* -------------------------------------------------------------------------- */
/*                                   Reviews                                  */
/* -------------------------------------------------------------------------- */

export async function moderateReviewAction(formData: FormData): Promise<void> {
  const { admin } = await requireAdmin();
  if (!admin) redirect("/");

  const reviewId = String(formData.get("reviewId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!reviewId) redirect("/admin/reviews?error=missing");

  if (action === "approve") {
    await db
      .update(reviews)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId));
  } else if (action === "hide") {
    await db
      .update(reviews)
      .set({ isApproved: false, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId));
  } else if (action === "delete") {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
  } else {
    redirect("/admin/reviews?error=invalid");
  }

  updateTag(CATALOG_TAG);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  redirect("/admin/reviews?updated=1");
}

/* -------------------------------------------------------------------------- */
/*                                   Coupons                                  */
/* -------------------------------------------------------------------------- */

export async function saveCouponAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = couponSchema.safeParse({
    id: formData.get("couponId") || undefined,
    code: formData.get("code"),
    description: formData.get("description"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSubtotal: formData.get("minSubtotal") || 0,
    maxDiscount: formData.get("maxDiscount"),
    usageLimit: formData.get("usageLimit"),
    startsAt: formData.get("startsAt"),
    expiresAt: formData.get("expiresAt"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodMessage(parsed.error),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const values = {
    code: data.code,
    description: data.description ?? null,
    type: data.type,
    value: data.value,
    minSubtotal: data.minSubtotal,
    maxDiscount: data.maxDiscount ?? null,
    usageLimit: data.usageLimit ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive,
    updatedAt: new Date(),
  };

  try {
    if (data.id) {
      await db.update(coupons).set(values).where(eq(coupons.id, data.id));
    } else {
      await db.insert(coupons).values(values);
    }
  } catch (error) {
    console.error("[admin] saveCouponAction failed", error);
    if (isUniqueViolation(error)) {
      return { ok: false, message: "That coupon code already exists." };
    }
    return { ok: false, message: "Could not save the coupon." };
  }

  refreshAdmin("coupons");
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?saved=1");
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const { admin } = await requireAdmin();
  if (!admin) redirect("/");

  const couponId = String(formData.get("couponId") ?? "");
  if (!couponId) redirect("/admin/coupons?error=missing");

  await db.delete(coupons).where(eq(coupons.id, couponId));
  refreshAdmin("coupons");
  redirect("/admin/coupons?deleted=1");
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  const { admin } = await requireAdmin();
  if (!admin) redirect("/");

  const couponId = String(formData.get("couponId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!couponId) redirect("/admin/coupons?error=missing");

  await db
    .update(coupons)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(coupons.id, couponId));

  refreshAdmin("coupons");
  redirect("/admin/coupons?updated=1");
}
