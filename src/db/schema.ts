import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

export const provinceEnum = pgEnum("province", [
  "punjab",
  "sindh",
  "khyber_pakhtunkhwa",
  "balochistan",
  "gilgit_baltistan",
  "azad_jammu_kashmir",
  "islamabad_capital_territory",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cod",
  "bank_transfer",
  "card",
  "jazzcash",
  "easypaisa",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "pending_verification",
  "paid",
  "refunded",
  "failed",
]);

export const couponTypeEnum = pgEnum("coupon_type", ["percentage", "fixed"]);

/* -------------------------------------------------------------------------- */
/*                                   Users                                    */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: varchar("clerk_id", { length: 191 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    firstName: varchar("first_name", { length: 120 }),
    lastName: varchar("last_name", { length: 120 }),
    phone: varchar("phone", { length: 20 }),
    imageUrl: text("image_url"),
    role: userRoleEnum("role").notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 60 }).notNull().default("Home"),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    province: provinceEnum("province").notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    postalCode: varchar("postal_code", { length: 10 }),
    street: text("street").notNull(),
    landmark: varchar("landmark", { length: 200 }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("addresses_user_id_idx").on(table.userId)],
);

/* -------------------------------------------------------------------------- */
/*                                  Catalog                                   */
/* -------------------------------------------------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description").notNull(),
    shortDescription: varchar("short_description", { length: 300 }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    basePrice: integer("base_price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    sku: varchar("sku", { length: 80 }).notNull(),
    fabric: varchar("fabric", { length: 160 }),
    careInstructions: text("care_instructions"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNewArrival: boolean("is_new_arrival").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    uniqueIndex("products_sku_idx").on(table.sku),
    index("products_category_idx").on(table.categoryId),
    index("products_active_idx").on(table.isActive),
    index("products_featured_idx").on(table.isFeatured),
    index("products_new_arrival_idx").on(table.isNewArrival),
    index("products_price_idx").on(table.basePrice),
    check("products_price_positive", sql`${table.basePrice} >= 0`),
    check(
      "products_compare_at_price_valid",
      sql`${table.compareAtPrice} is null or ${table.compareAtPrice} >= ${table.basePrice}`,
    ),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull(),
    size: varchar("size", { length: 40 }).notNull(),
    color: varchar("color", { length: 60 }).notNull(),
    /** Optional variant-level price override. Falls back to products.basePrice. */
    price: integer("price"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("variants_sku_idx").on(table.sku),
    index("variants_product_idx").on(table.productId),
    index("variants_size_idx").on(table.size),
    index("variants_color_idx").on(table.color),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 250 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("product_images_product_idx").on(table.productId, table.sortOrder)],
);

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_variant_idx").on(table.variantId),
    index("inventory_quantity_idx").on(table.quantity),
    check("inventory_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);

/* -------------------------------------------------------------------------- */
/*                               Cart & Wishlist                              */
/* -------------------------------------------------------------------------- */

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cart_items_user_variant_idx").on(table.userId, table.variantId),
    index("cart_items_user_idx").on(table.userId),
    check("cart_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wishlist_user_product_idx").on(table.userId, table.productId),
    index("wishlist_user_idx").on(table.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                              Reviews & Coupons                             */
/* -------------------------------------------------------------------------- */

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 140 }),
    body: text("body").notNull(),
    isApproved: boolean("is_approved").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reviews_user_product_idx").on(table.userId, table.productId),
    index("reviews_product_idx").on(table.productId, table.isApproved),
    check("reviews_rating_range", sql`${table.rating} between 1 and 5`),
  ],
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 40 }).notNull(),
    description: varchar("description", { length: 240 }),
    type: couponTypeEnum("type").notNull(),
    /** Percentage (1–100) or a fixed amount in PKR, depending on `type`. */
    value: integer("value").notNull(),
    minSubtotal: integer("min_subtotal").notNull().default(0),
    maxDiscount: integer("max_discount"),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("coupons_code_idx").on(table.code),
    index("coupons_active_idx").on(table.isActive),
    check("coupons_value_positive", sql`${table.value} > 0`),
    check(
      "coupons_percentage_range",
      sql`${table.type} <> 'percentage' or ${table.value} <= 100`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                  Orders                                    */
/* -------------------------------------------------------------------------- */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 32 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),

    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull().default(0),
    discountTotal: integer("discount_total").notNull().default(0),
    total: integer("total").notNull(),

    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    couponCode: varchar("coupon_code", { length: 40 }),

    shippingMethod: varchar("shipping_method", { length: 30 }).notNull().default("standard"),
    shippingFullName: varchar("shipping_full_name", { length: 160 }).notNull(),
    shippingPhone: varchar("shipping_phone", { length: 20 }).notNull(),
    shippingProvince: provinceEnum("shipping_province").notNull(),
    shippingCity: varchar("shipping_city", { length: 120 }).notNull(),
    shippingPostalCode: varchar("shipping_postal_code", { length: 10 }),
    shippingStreet: text("shipping_street").notNull(),
    shippingLandmark: varchar("shipping_landmark", { length: 200 }),

    notes: text("notes"),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    bankReference: varchar("bank_reference", { length: 100 }),
    adminNote: text("admin_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_number_idx").on(table.orderNumber),
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_created_at_idx").on(table.createdAt),
    check("orders_totals_non_negative", sql`${table.total} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 200 }).notNull(),
    productSlug: varchar("product_slug", { length: 220 }).notNull(),
    variantLabel: varchar("variant_label", { length: 120 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    imageUrl: text("image_url"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    note: varchar("note", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("order_status_history_order_idx").on(table.orderId, table.createdAt)],
);

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("coupon_redemptions_order_idx").on(table.orderId),
    index("coupon_redemptions_coupon_idx").on(table.couponId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                              Inferred types                                */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
