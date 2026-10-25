import "server-only";

import { unstable_cache } from "next/cache";
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  not,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  inventory,
  productImages,
  productVariants,
  products,
  reviews,
  users,
} from "@/db/schema";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import type {
  ProductCardData,
  ProductDetailData,
  ProductImage,
  ProductVariantView,
  SortOption,
} from "@/types/commerce";

export type ProductFilters = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  q?: string;
  sort?: SortOption;
  page?: number;
  perPage?: number;
  featuredOnly?: boolean;
  newArrivalsOnly?: boolean;
  onSaleOnly?: boolean;
};

export type ReviewWithAuthor = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  authorName: string;
  authorImage: string | null;
};

export const CATALOG_TAG = "catalog";

/* -------------------------------------------------------------------------- */
/*                                 Categories                                 */
/* -------------------------------------------------------------------------- */

export const getCategories = unstable_cache(
  async () => {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return rows;
  },
  ["categories"],
  { revalidate: 600, tags: [CATALOG_TAG] },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
      .limit(1);
    return category ?? null;
  },
  ["category-by-slug"],
  { revalidate: 600, tags: [CATALOG_TAG] },
);

/* -------------------------------------------------------------------------- */
/*                               Product listings                             */
/* -------------------------------------------------------------------------- */

function toImage(row: {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}): ProductImage {
  return { id: row.id, url: row.url, alt: row.alt, isPrimary: row.isPrimary };
}

function toVariantView(
  row: {
    id: string;
    sku: string;
    size: string;
    color: string;
    price: number | null;
    isActive: boolean;
    sortOrder: number;
  },
  basePrice: number,
  stock: number,
  lowStockThreshold: number,
): ProductVariantView {
  return {
    id: row.id,
    sku: row.sku,
    size: row.size,
    color: row.color,
    price: row.price ?? basePrice,
    stock,
    lowStockThreshold,
    isActive: row.isActive,
  };
}

export const getProductCards = unstable_cache(
  async (filters: ProductFilters = {}): Promise<{
    items: ProductCardData[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> => {
    const page = Math.max(filters.page ?? 1, 1);
    const perPage = filters.perPage ?? PRODUCTS_PER_PAGE;
    const conditions = [eq(products.isActive, true)];

    if (filters.category) conditions.push(eq(categories.slug, filters.category));
    if (filters.minPrice !== undefined) conditions.push(gte(products.basePrice, filters.minPrice));
    if (filters.maxPrice !== undefined) conditions.push(lte(products.basePrice, filters.maxPrice));
    if (filters.featuredOnly) conditions.push(eq(products.isFeatured, true));
    if (filters.newArrivalsOnly) conditions.push(eq(products.isNewArrival, true));
    if (filters.onSaleOnly) {
      conditions.push(
        isNotNull(products.compareAtPrice),
        sql`${products.compareAtPrice} > ${products.basePrice}`,
      );
    }

    if (filters.q) {
      const term = `%${filters.q}%`;
      conditions.push(
        or(
          ilike(products.name, term),
          ilike(products.shortDescription, term),
          ilike(products.description, term),
        )!,
      );
    }

    if (filters.size) {
      conditions.push(
        exists(
          db
            .select({ one: sql`1` })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.productId, products.id),
                eq(productVariants.size, filters.size),
                eq(productVariants.isActive, true),
              ),
            ),
        ),
      );
    }

    if (filters.color) {
      conditions.push(
        exists(
          db
            .select({ one: sql`1` })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.productId, products.id),
                eq(productVariants.color, filters.color),
                eq(productVariants.isActive, true),
              ),
            ),
        ),
      );
    }

    const where = and(...conditions);
    const reviewCountSql = sql<number>`(
      select count(*)::int from ${reviews}
      where ${reviews.productId} = ${products.id} and ${reviews.isApproved} = true
    )`;
    const ratingAvgSql = sql<number>`(
      select coalesce(avg(${reviews.rating}), 0)::float from ${reviews}
      where ${reviews.productId} = ${products.id} and ${reviews.isApproved} = true
    )`;

    const orderBy = (() => {
      switch (filters.sort) {
        case "price-asc":
          return [asc(products.basePrice), desc(products.createdAt)];
        case "price-desc":
          return [desc(products.basePrice), desc(products.createdAt)];
        case "popular":
          return [desc(reviewCountSql), desc(products.isFeatured), desc(products.createdAt)];
        case "rating":
          return [desc(ratingAvgSql), desc(reviewCountSql), desc(products.createdAt)];
        case "newest":
        default:
          return [desc(products.createdAt)];
      }
    })();

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          basePrice: products.basePrice,
          compareAtPrice: products.compareAtPrice,
          shortDescription: products.shortDescription,
          isNewArrival: products.isNewArrival,
          isFeatured: products.isFeatured,
          categoryName: categories.name,
          categorySlug: categories.slug,
          rating: ratingAvgSql,
          reviewCount: reviewCountSql,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ total: count() })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(where),
    ]);

    const total = Number(totalRows[0]?.total ?? 0);
    const ids = rows.map((row) => row.id);

    if (ids.length === 0) {
      return { items: [], total, page, perPage, totalPages: Math.ceil(total / perPage) };
    }

    const [imageRows, variantRows] = await Promise.all([
      db
        .select({
          id: productImages.id,
          productId: productImages.productId,
          url: productImages.url,
          alt: productImages.alt,
          isPrimary: productImages.isPrimary,
          sortOrder: productImages.sortOrder,
        })
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(asc(productImages.sortOrder)),
      db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          sku: productVariants.sku,
          size: productVariants.size,
          color: productVariants.color,
          price: productVariants.price,
          isActive: productVariants.isActive,
          sortOrder: productVariants.sortOrder,
          stock: inventory.quantity,
          lowStockThreshold: inventory.lowStockThreshold,
        })
        .from(productVariants)
        .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
        .where(inArray(productVariants.productId, ids))
        .orderBy(asc(productVariants.sortOrder), asc(productVariants.size)),
    ]);

    const imagesByProduct = new Map<string, typeof imageRows>();
    for (const image of imageRows) {
      const list = imagesByProduct.get(image.productId) ?? [];
      list.push(image);
      imagesByProduct.set(image.productId, list);
    }

    const variantsByProduct = new Map<string, typeof variantRows>();
    for (const variant of variantRows) {
      const list = variantsByProduct.get(variant.productId) ?? [];
      list.push(variant);
      variantsByProduct.set(variant.productId, list);
    }

    const items: ProductCardData[] = rows.map((row) => {
      const productImagesForRow = (imagesByProduct.get(row.id) ?? []).sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
      );
      const variants = (variantsByProduct.get(row.id) ?? []).filter(
        (variant) => variant.isActive,
      );
      const variantViews = variants.map((variant) =>
        toVariantView(variant, row.basePrice, variant.stock ?? 0, variant.lowStockThreshold ?? 5),
      );
      const inStock = variantViews.filter((variant) => variant.stock > 0);

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        basePrice: row.basePrice,
        compareAtPrice: row.compareAtPrice,
        shortDescription: row.shortDescription,
        category: { name: row.categoryName, slug: row.categorySlug },
        image: productImagesForRow[0] ? toImage(productImagesForRow[0]) : null,
        secondaryImage: productImagesForRow[1] ? toImage(productImagesForRow[1]) : null,
        rating: Number(row.rating ?? 0),
        reviewCount: Number(row.reviewCount ?? 0),
        totalStock: variantViews.reduce((sum, variant) => sum + variant.stock, 0),
        isNewArrival: row.isNewArrival,
        isFeatured: row.isFeatured,
        defaultVariant: inStock[0] ?? variantViews[0] ?? null,
        colors: Array.from(new Set(variants.map((variant) => variant.color))),
        sizes: Array.from(new Set(variants.map((variant) => variant.size))),
      };
    });

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.max(Math.ceil(total / perPage), 1),
    };
  },
  ["product-cards"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

/* -------------------------------------------------------------------------- */
/*                                Product detail                              */
/* -------------------------------------------------------------------------- */

export const getProductDetail = unstable_cache(
  async (
    slug: string,
  ): Promise<{ product: ProductDetailData; reviews: ReviewWithAuthor[] } | null> => {
    const [row] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        sku: products.sku,
        fabric: products.fabric,
        careInstructions: products.careInstructions,
        isNewArrival: products.isNewArrival,
        isFeatured: products.isFeatured,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (!row) return null;

    const [imageRows, variantRows, reviewRows, aggregateRows] = await Promise.all([
      db
        .select({
          id: productImages.id,
          url: productImages.url,
          alt: productImages.alt,
          isPrimary: productImages.isPrimary,
          sortOrder: productImages.sortOrder,
        })
        .from(productImages)
        .where(eq(productImages.productId, row.id))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder)),
      db
        .select({
          id: productVariants.id,
          sku: productVariants.sku,
          size: productVariants.size,
          color: productVariants.color,
          price: productVariants.price,
          isActive: productVariants.isActive,
          sortOrder: productVariants.sortOrder,
          stock: inventory.quantity,
          lowStockThreshold: inventory.lowStockThreshold,
        })
        .from(productVariants)
        .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
        .where(and(eq(productVariants.productId, row.id), eq(productVariants.isActive, true)))
        .orderBy(asc(productVariants.sortOrder), asc(productVariants.size)),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          body: reviews.body,
          createdAt: reviews.createdAt,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(and(eq(reviews.productId, row.id), eq(reviews.isApproved, true)))
        .orderBy(desc(reviews.createdAt))
        .limit(30),
      db
        .select({ average: avg(reviews.rating), total: count() })
        .from(reviews)
        .where(and(eq(reviews.productId, row.id), eq(reviews.isApproved, true))),
    ]);

    const images = imageRows.map(toImage);
    const variants = variantRows.map((variant) =>
      toVariantView(variant, row.basePrice, variant.stock ?? 0, variant.lowStockThreshold ?? 5),
    );
    const inStock = variants.filter((variant) => variant.stock > 0);
    const rating = Number(aggregateRows[0]?.average ?? 0);
    const reviewCount = Number(aggregateRows[0]?.total ?? 0);

    const product: ProductDetailData = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      shortDescription: row.shortDescription,
      basePrice: row.basePrice,
      compareAtPrice: row.compareAtPrice,
      sku: row.sku,
      fabric: row.fabric,
      careInstructions: row.careInstructions,
      category: { name: row.categoryName, slug: row.categorySlug },
      image: images[0] ?? null,
      secondaryImage: images[1] ?? null,
      images,
      rating,
      reviewCount,
      totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
      isNewArrival: row.isNewArrival,
      isFeatured: row.isFeatured,
      defaultVariant: inStock[0] ?? variants[0] ?? null,
      colors: Array.from(new Set(variants.map((variant) => variant.color))),
      sizes: Array.from(new Set(variants.map((variant) => variant.size))),
      variants,
    };

    const reviewList: ReviewWithAuthor[] = reviewRows.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      authorName:
        [review.firstName, review.lastName].filter(Boolean).join(" ") || "Hunar customer",
      authorImage: review.imageUrl,
    }));

    return { product, reviews: reviewList };
  },
  ["product-detail"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

export const getRelatedProducts = unstable_cache(
  async (categorySlug: string, excludeProductId: string, limit = 4) => {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        shortDescription: products.shortDescription,
        isNewArrival: products.isNewArrival,
        isFeatured: products.isFeatured,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(categories.slug, categorySlug),
          not(eq(products.id, excludeProductId)),
        ),
      )
      .orderBy(desc(products.isFeatured), desc(products.createdAt))
      .limit(limit);

    if (result.length === 0) return [];

    const ids = result.map((item) => item.id);
    const [imageRows, variantRows, reviewRows] = await Promise.all([
      db
        .select({
          id: productImages.id,
          productId: productImages.productId,
          url: productImages.url,
          alt: productImages.alt,
          isPrimary: productImages.isPrimary,
          sortOrder: productImages.sortOrder,
        })
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder)),
      db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          sku: productVariants.sku,
          size: productVariants.size,
          color: productVariants.color,
          price: productVariants.price,
          isActive: productVariants.isActive,
          sortOrder: productVariants.sortOrder,
          stock: inventory.quantity,
          lowStockThreshold: inventory.lowStockThreshold,
        })
        .from(productVariants)
        .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
        .where(inArray(productVariants.productId, ids))
        .orderBy(asc(productVariants.sortOrder)),
      db
        .select({
          productId: reviews.productId,
          average: avg(reviews.rating),
          total: count(),
        })
        .from(reviews)
        .where(and(inArray(reviews.productId, ids), eq(reviews.isApproved, true)))
        .groupBy(reviews.productId),
    ]);

    const stats = new Map(reviewRows.map((item) => [item.productId, item]));

    return result.map((item): ProductCardData => {
      const images = imageRows.filter((image) => image.productId === item.id);
      const variants = variantRows.filter((variant) => variant.productId === item.id);
      const variantViews = variants
        .filter((variant) => variant.isActive)
        .map((variant) =>
          toVariantView(
            variant,
            item.basePrice,
            variant.stock ?? 0,
            variant.lowStockThreshold ?? 5,
          ),
        );
      const inStock = variantViews.filter((variant) => variant.stock > 0);
      const stat = stats.get(item.id);

      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        basePrice: item.basePrice,
        compareAtPrice: item.compareAtPrice,
        shortDescription: item.shortDescription,
        category: { name: item.categoryName, slug: item.categorySlug },
        image: images[0] ? toImage(images[0]) : null,
        secondaryImage: images[1] ? toImage(images[1]) : null,
        rating: Number(stat?.average ?? 0),
        reviewCount: Number(stat?.total ?? 0),
        totalStock: variantViews.reduce((sum, variant) => sum + variant.stock, 0),
        isNewArrival: item.isNewArrival,
        isFeatured: item.isFeatured,
        defaultVariant: inStock[0] ?? variantViews[0] ?? null,
        colors: Array.from(new Set(variants.map((variant) => variant.color))),
        sizes: Array.from(new Set(variants.map((variant) => variant.size))),
      };
    });
  },
  ["related-products"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

/* -------------------------------------------------------------------------- */
/*                                Search & facets                             */
/* -------------------------------------------------------------------------- */

export const getFilterFacets = unstable_cache(
  async () => {
    const [sizeRows, colorRows, priceRows] = await Promise.all([
      db
        .selectDistinct({ value: productVariants.size })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(and(eq(productVariants.isActive, true), eq(products.isActive, true)))
        .orderBy(asc(productVariants.size)),
      db
        .selectDistinct({ value: productVariants.color })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(and(eq(productVariants.isActive, true), eq(products.isActive, true)))
        .orderBy(asc(productVariants.color)),
      db
        .select({
          min: sql<number>`coalesce(min(${products.basePrice}), 0)::int`,
          max: sql<number>`coalesce(max(${products.basePrice}), 0)::int`,
        })
        .from(products)
        .where(eq(products.isActive, true)),
    ]);

    return {
      sizes: sizeRows.map((row) => row.value),
      colors: colorRows.map((row) => row.value),
      price: {
        min: Number(priceRows[0]?.min ?? 0),
        max: Number(priceRows[0]?.max ?? 0),
      },
    };
  },
  ["filter-facets"],
  { revalidate: 600, tags: [CATALOG_TAG] },
);

export const quickSearchProducts = unstable_cache(
  async (query: string, limit = 6) => {
    const term = `%${query}%`;
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        categoryName: categories.name,
        imageUrl: productImages.url,
        imageAlt: productImages.alt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)),
      )
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, term),
            ilike(products.shortDescription, term),
            ilike(categories.name, term),
          ),
        ),
      )
      .orderBy(desc(products.isFeatured), desc(products.createdAt))
      .limit(limit);

    return rows;
  },
  ["quick-search"],
  { revalidate: 60, tags: [CATALOG_TAG] },
);

/* -------------------------------------------------------------------------- */
/*                          Wishlist / catalog lookups                        */
/* -------------------------------------------------------------------------- */

export async function getProductSnapshotsByIds(productIds: string[]) {
  if (productIds.length === 0) return [];

  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      price: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      imageUrl: productImages.url,
      imageAlt: productImages.alt,
    })
    .from(products)
    .leftJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)),
    )
    .where(and(inArray(products.id, productIds), eq(products.isActive, true)));

  return rows;
}

export async function getAllCategorySlugs() {
  const rows = await db
    .select({ slug: categories.slug, updatedAt: categories.updatedAt })
    .from(categories)
    .where(eq(categories.isActive, true));
  return rows;
}

export async function getAllProductSlugs() {
  const rows = await db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.isActive, true));
  return rows;
}

/* -------------------------------------------------------------------------- */
/*                                Testimonials                                */
/* -------------------------------------------------------------------------- */

export type StoreTestimonial = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  productName: string;
  productSlug: string;
  createdAt: string;
};

export const getStoreTestimonials = unstable_cache(
  async (limit = 6): Promise<StoreTestimonial[]> => {
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        createdAt: reviews.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        productName: products.name,
        productSlug: products.slug,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(products, eq(reviews.productId, products.id))
      .where(and(eq(reviews.isApproved, true), eq(products.isActive, true)))
      .orderBy(desc(reviews.rating), desc(reviews.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      title: row.title,
      body: row.body,
      authorName:
        [row.firstName, row.lastName].filter(Boolean).join(" ") || "Hunar customer",
      productName: row.productName,
      productSlug: row.productSlug,
      createdAt: row.createdAt.toISOString(),
    }));
  },
  ["store-testimonials"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);
