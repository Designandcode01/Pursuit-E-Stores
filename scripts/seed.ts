/**
 * Seed the Hunar Bazaar catalog.
 *
 * Usage: npm run db:seed
 *
 * Reads scripts/catalog.json (categories, products, reviews) and writes a
 * complete, idempotent demo dataset: categories, products, variants, stock,
 * images, review authors + reviews, coupons and a handful of demo orders so the
 * admin dashboard has something to chart.
 *
 * The script talks to Postgres directly (not through src/db) because
 * src/db/index.ts is marked `server-only` for the Next.js runtime.
 */
import { config } from "dotenv";
import { inArray, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

import {
  categories,
  couponRedemptions,
  coupons,
  inventory,
  orderItems,
  orderStatusHistory,
  orders,
  productImages,
  productVariants,
  products,
  reviews,
  users,
  wishlistItems,
  cartItems,
} from "../src/db/schema";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local first.");
}

type Palette = { bg: string; ink: string; accent: string; soft: string };

type CatalogCategory = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  palette: Palette;
  art: string;
};

type CatalogProduct = {
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  compareAtPrice?: number | null;
  sku: string;
  fabric?: string;
  careInstructions?: string;
  shortDescription?: string;
  description: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  colors: string[];
  sizes: string[];
  art: string;
  palette: Palette;
};

type CatalogReview = {
  productSlug: string;
  rating: number;
  title?: string;
  body: string;
  author: number;
};

type Catalog = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  reviews: CatalogReview[];
  reviewAuthors: { firstName: string; lastName: string }[];
};

const catalog = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/catalog.json"), "utf8"),
) as Catalog;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});
const db = drizzle(pool);

const SEED_PREFIX = "seed_";

/** Deterministic, believable stock levels (a few options sold out). */
function stockFor(sku: string) {
  let hash = 0;
  for (const char of sku) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  if (hash % 11 === 0) return 0;
  return 4 + (hash % 37);
}

function colorCode(color: string) {
  return color
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function resetCatalog() {
  // Order matters: children before parents.
  await db.delete(couponRedemptions);
  await db.delete(orderStatusHistory);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(coupons);
  await db.delete(reviews);
  await db.delete(wishlistItems);
  await db.delete(cartItems);
  await db.delete(inventory);
  await db.delete(productImages);
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(categories);

  // Remove only demo customers created by this script.
  await db.delete(users).where(like(users.clerkId, `${SEED_PREFIX}%`));
}

async function seedCategories() {
  const rows = await db
    .insert(categories)
    .values(
      catalog.categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: `/categories/${category.slug}.webp`,
        sortOrder: category.sortOrder,
        isActive: true,
      })),
    )
    .returning({ id: categories.id, slug: categories.slug });

  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function seedProducts(categoryIds: Map<string, string>) {
  const productRows = await db
    .insert(products)
    .values(
      catalog.products.map((product) => {
        const categoryId = categoryIds.get(product.category);
        if (!categoryId) {
          throw new Error(`Unknown category "${product.category}" on ${product.slug}`);
        }

        return {
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription ?? null,
          categoryId,
          basePrice: product.basePrice,
          // `0` in the catalog means "not on sale"; the DB check constraint
          // requires compare-at to be greater than or equal to the price.
          compareAtPrice:
            product.compareAtPrice && product.compareAtPrice > product.basePrice
              ? product.compareAtPrice
              : null,
          sku: product.sku,
          fabric: product.fabric ?? null,
          careInstructions: product.careInstructions ?? null,
          isFeatured: product.isFeatured ?? false,
          isNewArrival: product.isNewArrival ?? false,
          isActive: true,
        };
      }),
    )
    .returning({ id: products.id, slug: products.slug });

  const productIds = new Map(productRows.map((row) => [row.slug, row.id]));

  const variantValues: (typeof productVariants.$inferInsert)[] = [];
  const imageValues: (typeof productImages.$inferInsert)[] = [];

  for (const product of catalog.products) {
    const productId = productIds.get(product.slug);
    if (!productId) continue;

    let sortOrder = 0;
    for (const color of product.colors) {
      for (const size of product.sizes) {
        variantValues.push({
          productId,
          sku: `${product.sku}-${colorCode(color)}-${size}`,
          size,
          color,
          price: null,
          isActive: true,
          sortOrder: sortOrder++,
        });
      }
    }

    imageValues.push(
      {
        productId,
        url: `/products/${product.slug}-1.webp`,
        alt: `${product.name} — main view`,
        sortOrder: 0,
        isPrimary: true,
      },
      {
        productId,
        url: `/products/${product.slug}-2.webp`,
        alt: `${product.name} — detail view`,
        sortOrder: 1,
        isPrimary: false,
      },
    );
  }

  const variantRows = await db
    .insert(productVariants)
    .values(variantValues)
    .returning({ id: productVariants.id, sku: productVariants.sku });

  await db.insert(inventory).values(
    variantRows.map((variant) => ({
      variantId: variant.id,
      quantity: stockFor(variant.sku),
      lowStockThreshold: 5,
    })),
  );

  await db.insert(productImages).values(imageValues);

  return { productIds, variantRows };
}

async function seedReviewAuthors() {
  const rows = await db
    .insert(users)
    .values(
      catalog.reviewAuthors.map((author, index) => ({
        clerkId: `${SEED_PREFIX}author_${index + 1}`,
        email: `${author.firstName.toLowerCase()}.${author.lastName.toLowerCase()}@hunarbazaar.example`,
        firstName: author.firstName,
        lastName: author.lastName,
        role: "customer" as const,
      })),
    )
    .returning({ id: users.id });

  return rows.map((row) => row.id);
}

async function seedReviews(productIds: Map<string, string>, authorIds: string[]) {
  const values = catalog.reviews
    .map((review, index) => {
      const productId = productIds.get(review.productSlug);
      const userId = authorIds[review.author - 1];
      if (!productId || !userId) return null;

      return {
        productId,
        userId,
        rating: review.rating,
        title: review.title ?? null,
        body: review.body,
        isApproved: true,
        createdAt: daysAgo(60 - index * 4),
        updatedAt: daysAgo(60 - index * 4),
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  await db.insert(reviews).values(values);
}

async function seedCoupons() {
  await db.insert(coupons).values([
    {
      code: "HUNAR10",
      description: "10% off your first order (max Rs. 1,000)",
      type: "percentage",
      value: 10,
      minSubtotal: 3_000,
      maxDiscount: 1_000,
      usageLimit: 500,
      isActive: true,
    },
    {
      code: "EID500",
      description: "Rs. 500 off orders over Rs. 5,000",
      type: "fixed",
      value: 500,
      minSubtotal: 5_000,
      isActive: true,
    },
    {
      code: "LAWN15",
      description: "15% off lawn orders over Rs. 4,000",
      type: "percentage",
      value: 15,
      minSubtotal: 4_000,
      maxDiscount: 1_500,
      usageLimit: 200,
      isActive: true,
    },
  ]);
}

type DemoOrder = {
  customer: { firstName: string; lastName: string; email: string; city: string; province: "punjab" | "sindh" | "islamabad_capital_territory" };
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cod" | "bank_transfer";
  paymentStatus: "unpaid" | "pending_verification" | "paid";
  daysAgo: number;
  lines: { slug: string; size: string; color: string; quantity: number }[];
};

const demoOrders: DemoOrder[] = [
  {
    customer: { firstName: "Ayesha", lastName: "Khan", email: "ayesha.khan@example.com", city: "Lahore", province: "punjab" },
    status: "delivered",
    paymentMethod: "cod",
    paymentStatus: "paid",
    daysAgo: 34,
    lines: [
      { slug: "gulnar-embroidered-lawn-suit", size: "M", color: "Emerald", quantity: 1 },
      { slug: "jhumka-silver-earrings", size: "One Size", color: "Silver", quantity: 2 },
    ],
  },
  {
    customer: { firstName: "Hassan", lastName: "Raza", email: "hassan.raza@example.com", city: "Karachi", province: "sindh" },
    status: "delivered",
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    daysAgo: 22,
    lines: [
      { slug: "rafiq-wash-wear-kurta", size: "L", color: "White", quantity: 2 },
      { slug: "multani-khussa", size: "41", color: "Gold", quantity: 1 },
    ],
  },
  {
    customer: { firstName: "Fatima", lastName: "Noor", email: "fatima.noor@example.com", city: "Islamabad", province: "islamabad_capital_territory" },
    status: "shipped",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    daysAgo: 5,
    lines: [{ slug: "pashm-pashmina-shawl", size: "One Size", color: "Ivory", quantity: 1 }],
  },
  {
    customer: { firstName: "Bilal", lastName: "Ahmed", email: "bilal.ahmed@example.com", city: "Rawalpindi", province: "punjab" },
    status: "confirmed",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    daysAgo: 2,
    lines: [
      { slug: "truck-art-cushion-set", size: "One Size", color: "Multi", quantity: 2 },
      { slug: "sindhi-ralli-quilt", size: "One Size", color: "Indigo", quantity: 1 },
    ],
  },
  {
    customer: { firstName: "Zara", lastName: "Siddiqui", email: "zara.siddiqui@example.com", city: "Lahore", province: "punjab" },
    status: "pending",
    paymentMethod: "bank_transfer",
    paymentStatus: "pending_verification",
    daysAgo: 1,
    lines: [{ slug: "noor-formal-chiffon-suit", size: "S", color: "Maroon", quantity: 1 }],
  },
  {
    customer: { firstName: "Ayesha", lastName: "Khan", email: "ayesha.khan@example.com", city: "Lahore", province: "punjab" },
    status: "cancelled",
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    daysAgo: 12,
    lines: [{ slug: "travel-prayer-rug", size: "One Size", color: "Teal", quantity: 1 }],
  },
];

async function seedDemoOrders(
  productIds: Map<string, string>,
  variantRows: { id: string; sku: string }[],
) {
  const variantBySku = new Map(variantRows.map((row) => [row.sku, row.id]));
  const productBySlug = new Map(
    catalog.products.map((product) => [product.slug, product]),
  );

  for (const [index, demo] of demoOrders.entries()) {
    const customerKey = demo.customer.email.split("@")[0].replace(/[^a-z0-9]+/gi, "_");
    const [customer] = await db
      .insert(users)
      .values({
        clerkId: `${SEED_PREFIX}customer_${customerKey}`,
        email: demo.customer.email,
        firstName: demo.customer.firstName,
        lastName: demo.customer.lastName,
        phone: "+923001234567",
        role: "customer",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: { firstName: demo.customer.firstName, lastName: demo.customer.lastName },
      })
      .returning({ id: users.id });

    const createdAt = daysAgo(demo.daysAgo);
    const lines = demo.lines.flatMap((line) => {
      const product = productBySlug.get(line.slug);
      const productId = productIds.get(line.slug);
      if (!product || !productId) return [];
      const variantId =
        variantBySku.get(`${product.sku}-${colorCode(line.color)}-${line.size}`) ?? null;

      return [
        {
          productId,
          variantId,
          productName: product.name,
          productSlug: product.slug,
          variantLabel: `${line.color} / ${line.size}`,
          sku: variantId ? `${product.sku}-${colorCode(line.color)}-${line.size}` : product.sku,
          imageUrl: `/products/${product.slug}-1.webp`,
          unitPrice: product.basePrice,
          quantity: line.quantity,
          lineTotal: product.basePrice * line.quantity,
        },
      ];
    });

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingFee = subtotal >= 5_000 ? 0 : 250;
    const total = subtotal + shippingFee;
    const orderNumber = `HB-${createdAt.toISOString().slice(0, 10).replaceAll("-", "")}-${String(
      1001 + index,
    )}`;

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: customer.id,
        status: demo.status,
        paymentMethod: demo.paymentMethod,
        paymentStatus: demo.paymentStatus,
        subtotal,
        shippingFee,
        discountTotal: 0,
        total,
        shippingMethod: "standard",
        shippingFullName: `${demo.customer.firstName} ${demo.customer.lastName}`,
        shippingPhone: "+923001234567",
        shippingProvince: demo.customer.province,
        shippingCity: demo.customer.city,
        shippingStreet: "House 12, Street 5, Gulberg III",
        notes: null,
        trackingNumber: demo.status === "shipped" || demo.status === "delivered" ? `TCS-${100000 + index}` : null,
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: orders.id });

    await db.insert(orderItems).values(lines.map((line) => ({ ...line, orderId: order.id })));

    const timeline: DemoOrder["status"][] =
      demo.status === "cancelled"
        ? ["pending", "cancelled"]
        : demo.status === "delivered"
          ? ["pending", "confirmed", "shipped", "delivered"]
          : demo.status === "shipped"
            ? ["pending", "confirmed", "shipped"]
            : demo.status === "confirmed"
              ? ["pending", "confirmed"]
              : ["pending"];

    await db.insert(orderStatusHistory).values(
      timeline.map((status, step) => ({
        orderId: order.id,
        status,
        note:
          status === "pending"
            ? "Order placed online."
            : status === "cancelled"
              ? "Cancelled at the customer's request."
              : null,
        createdAt: new Date(createdAt.getTime() + step * 6 * 60 * 60 * 1000),
      })),
    );
  }
}

async function main() {
  console.log("→ Resetting catalog…");
  await resetCatalog();

  console.log(`→ Inserting ${catalog.categories.length} categories…`);
  const categoryIds = await seedCategories();

  console.log(`→ Inserting ${catalog.products.length} products and their variants…`);
  const { productIds, variantRows } = await seedProducts(categoryIds);

  console.log(`→ Inserting ${catalog.reviews.length} reviews…`);
  const authorIds = await seedReviewAuthors();
  await seedReviews(productIds, authorIds);

  console.log("→ Inserting coupons…");
  await seedCoupons();

  console.log(`→ Inserting ${demoOrders.length} demo orders…`);
  await seedDemoOrders(productIds, variantRows);

  const counts = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.slug, catalog.products.map((product) => product.slug)));

  console.log("");
  console.log(`✓ Seed complete: ${counts.length} products, ${variantRows.length} variants.`);
  console.log("  Coupons: HUNAR10, EID500, LAWN15");
  console.log("  Demo orders use HB-YYYYMMDD-100x order numbers.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
