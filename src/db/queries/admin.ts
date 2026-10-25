import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  addresses,
  categories,
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
} from "@/db/schema";
import type { OrderStatus, PaymentStatus, Province } from "@/types/commerce";

export const ADMIN_ORDERS_PER_PAGE = 20;
export const ADMIN_PRODUCTS_PER_PAGE = 20;

/* -------------------------------------------------------------------------- */
/*                                 Dashboard                                  */
/* -------------------------------------------------------------------------- */

export type DashboardStats = {
  revenue: number;
  revenueDelta: number;
  orders: number;
  ordersDelta: number;
  customers: number;
  customersDelta: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockCount: number;
  activeProducts: number;
  totalProducts: number;
};

function percentDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startCurrent = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startPrevious = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const notCancelled = sql`${orders.status} <> 'cancelled'`;

  const [
    lifetime,
    current,
    previous,
    customerRows,
    currentCustomers,
    previousCustomers,
    pendingRows,
    lowStockRows,
    productRows,
  ] = await Promise.all([
    db
      .select({
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
        orders: count(orders.id),
      })
      .from(orders)
      .where(notCancelled),
    db
      .select({
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
        orders: count(orders.id),
      })
      .from(orders)
      .where(and(notCancelled, gte(orders.createdAt, startCurrent))),
    db
      .select({
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
        orders: count(orders.id),
      })
      .from(orders)
      .where(
        and(notCancelled, gte(orders.createdAt, startPrevious), lt(orders.createdAt, startCurrent)),
      ),
    db.select({ total: count(users.id) }).from(users).where(eq(users.role, "customer")),
    db
      .select({ total: count(users.id) })
      .from(users)
      .where(and(eq(users.role, "customer"), gte(users.createdAt, startCurrent))),
    db
      .select({ total: count(users.id) })
      .from(users)
      .where(
        and(
          eq(users.role, "customer"),
          gte(users.createdAt, startPrevious),
          lt(users.createdAt, startCurrent),
        ),
      ),
    db.select({ total: count(orders.id) }).from(orders).where(eq(orders.status, "pending")),
    db
      .select({ total: count(inventory.id) })
      .from(inventory)
      .innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(productVariants.isActive, true),
          sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`,
        ),
      ),
    db
      .select({
        total: count(products.id),
        active: sql<number>`count(*) filter (where ${products.isActive} = true)::int`,
      })
      .from(products),
  ]);

  const revenue = Number(lifetime[0]?.revenue ?? 0);
  const orderCount = Number(lifetime[0]?.orders ?? 0);

  return {
    revenue,
    revenueDelta: percentDelta(
      Number(current[0]?.revenue ?? 0),
      Number(previous[0]?.revenue ?? 0),
    ),
    orders: orderCount,
    ordersDelta: percentDelta(
      Number(current[0]?.orders ?? 0),
      Number(previous[0]?.orders ?? 0),
    ),
    customers: Number(customerRows[0]?.total ?? 0),
    customersDelta: percentDelta(
      Number(currentCustomers[0]?.total ?? 0),
      Number(previousCustomers[0]?.total ?? 0),
    ),
    avgOrderValue: orderCount === 0 ? 0 : Math.round(revenue / orderCount),
    pendingOrders: Number(pendingRows[0]?.total ?? 0),
    lowStockCount: Number(lowStockRows[0]?.total ?? 0),
    activeProducts: Number(productRows[0]?.active ?? 0),
    totalProducts: Number(productRows[0]?.total ?? 0),
  };
}

export type SalesPoint = { date: string; label: string; revenue: number; orders: number };

export async function getSalesTrend(days = 14): Promise<SalesPoint[]> {
  const safeDays = Math.min(Math.max(days, 7), 90);
  const rows = await db.execute<{ day: string; revenue: number; orders: number }>(sql`
    select
      to_char(d.day, 'YYYY-MM-DD') as day,
      coalesce(sum(o.total), 0)::int as revenue,
      count(o.id)::int as orders
    from generate_series(
      (current_date - (${safeDays - 1} || ' days')::interval),
      current_date,
      interval '1 day'
    ) as d(day)
    left join ${orders} o
      on ((o.created_at at time zone 'Asia/Karachi')::date = d.day::date)
      and o.status <> 'cancelled'
    group by d.day
    order by d.day
  `);

  const formatter = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short" });

  return rows.rows.map((row) => ({
    date: row.day,
    label: formatter.format(new Date(`${row.day}T00:00:00+05:00`)),
    revenue: Number(row.revenue),
    orders: Number(row.orders),
  }));
}

export async function getTopProducts(limit = 5) {
  const rows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      productSlug: orderItems.productSlug,
      quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      revenue: sql<number>`coalesce(sum(${orderItems.lineTotal}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orders.status} <> 'cancelled'`)
    .groupBy(orderItems.productId, orderItems.productName, orderItems.productSlug)
    .orderBy(desc(sql`sum(${orderItems.lineTotal})`))
    .limit(limit);

  return rows;
}

export async function getOrderStatusCounts(): Promise<Record<OrderStatus, number>> {
  const rows = await db
    .select({ status: orders.status, total: count(orders.id) })
    .from(orders)
    .groupBy(orders.status);

  const counts: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const row of rows) counts[row.status] = Number(row.total);
  return counts;
}

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export async function getRecentOrders(limit = 6): Promise<RecentOrder[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      guestName: orders.shippingFullName,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customerName:
      [row.firstName, row.lastName].filter(Boolean).join(" ") || row.guestName || "Guest",
    customerEmail: row.email,
    total: row.total,
    status: row.status,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getLowStockVariants(limit = 8) {
  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.color,
      stock: inventory.quantity,
      threshold: inventory.lowStockThreshold,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        eq(products.isActive, true),
        eq(productVariants.isActive, true),
        sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`,
      ),
    )
    .orderBy(asc(inventory.quantity), asc(products.name))
    .limit(limit);

  return rows;
}

export async function getPendingReviewsCount() {
  const [row] = await db
    .select({ total: count(reviews.id) })
    .from(reviews)
    .where(eq(reviews.isApproved, false));
  return Number(row?.total ?? 0);
}

export async function getAdminReviews(limit = 100) {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      isApproved: reviews.isApproved,
      createdAt: reviews.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(asc(reviews.isApproved), desc(reviews.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    authorName:
      [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email.split("@")[0],
    createdAt: row.createdAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*                                  Products                                  */
/* -------------------------------------------------------------------------- */

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryName: string;
  basePrice: number;
  compareAtPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  imageUrl: string | null;
  variantCount: number;
  totalStock: number;
  updatedAt: string;
};

export async function getAdminProducts(filters: {
  q?: string;
  category?: string;
  status?: "all" | "active" | "inactive";
  page?: number;
  perPage?: number;
}) {
  const page = Math.max(filters.page ?? 1, 1);
  const perPage = filters.perPage ?? ADMIN_PRODUCTS_PER_PAGE;
  const conditions = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.sku, term))!);
  }
  if (filters.category) conditions.push(eq(categories.slug, filters.category));
  if (filters.status === "active") conditions.push(eq(products.isActive, true));
  if (filters.status === "inactive") conditions.push(eq(products.isActive, false));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const stockSql = sql<number>`(
    select coalesce(sum(i.quantity), 0)::int
    from ${inventory} i
    join ${productVariants} pv on pv.id = i.variant_id
    where pv.product_id = ${products.id}
  )`;
  const variantCountSql = sql<number>`(
    select count(*)::int from ${productVariants} pv where pv.product_id = ${products.id}
  )`;
  const imageSql = sql<string | null>`(
    select pi.url from ${productImages} pi
    where pi.product_id = ${products.id}
    order by pi.is_primary desc, pi.sort_order asc
    limit 1
  )`;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        categoryName: categories.name,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        isNewArrival: products.isNewArrival,
        imageUrl: imageSql,
        variantCount: variantCountSql,
        totalStock: stockSql,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(desc(products.updatedAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ total: count(products.id) })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: rows.map(
      (row): AdminProductRow => ({
        ...row,
        imageUrl: row.imageUrl ?? null,
        variantCount: Number(row.variantCount),
        totalStock: Number(row.totalStock),
        updatedAt: row.updatedAt.toISOString(),
      }),
    ),
    total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
  };
}

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  categoryId: string;
  basePrice: number;
  compareAtPrice: number | null;
  sku: string;
  fabric: string | null;
  careInstructions: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  variants: {
    id: string;
    sku: string;
    size: string;
    color: string;
    price: number | null;
    isActive: boolean;
    stock: number;
    lowStockThreshold: number;
  }[];
  images: { id: string; url: string; alt: string | null; isPrimary: boolean; sortOrder: number }[];
};

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return null;

  const [variantRows, imageRows] = await Promise.all([
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
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.sortOrder)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder)),
  ]);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.shortDescription,
    categoryId: row.categoryId,
    basePrice: row.basePrice,
    compareAtPrice: row.compareAtPrice,
    sku: row.sku,
    fabric: row.fabric,
    careInstructions: row.careInstructions,
    isFeatured: row.isFeatured,
    isNewArrival: row.isNewArrival,
    isActive: row.isActive,
    variants: variantRows.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      price: variant.price,
      isActive: variant.isActive,
      stock: variant.stock ?? 0,
      lowStockThreshold: variant.lowStockThreshold ?? 5,
    })),
    images: imageRows.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
  };
}

export async function getAdminCategories() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      imageUrl: categories.imageUrl,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      productCount: sql<number>`(
        select count(*)::int from ${products} p where p.category_id = ${categories.id}
      )`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
}

/* -------------------------------------------------------------------------- */
/*                                   Orders                                   */
/* -------------------------------------------------------------------------- */

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  shippingCity: string;
  shippingProvince: Province;
  total: number;
  itemCount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export async function getAdminOrders(filters: {
  q?: string;
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  page?: number;
  perPage?: number;
}) {
  const page = Math.max(filters.page ?? 1, 1);
  const perPage = filters.perPage ?? ADMIN_ORDERS_PER_PAGE;
  const conditions = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, term),
        ilike(orders.shippingFullName, term),
        ilike(orders.shippingPhone, term),
        ilike(users.email, term),
      )!,
    );
  }
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(orders.status, filters.status));
  }
  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const itemCountSql = sql<number>`(
    select coalesce(sum(oi.quantity), 0)::int from ${orderItems} oi where oi.order_id = ${orders.id}
  )`;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        guestName: orders.shippingFullName,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        shippingCity: orders.shippingCity,
        shippingProvince: orders.shippingProvince,
        total: orders.total,
        itemCount: itemCountSql,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ total: count(orders.id) })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(where),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: rows.map(
      (row): AdminOrderRow => ({
        id: row.id,
        orderNumber: row.orderNumber,
        customerName:
          [row.firstName, row.lastName].filter(Boolean).join(" ") || row.guestName || "Guest",
        customerEmail: row.email,
        shippingCity: row.shippingCity,
        shippingProvince: row.shippingProvince,
        total: row.total,
        itemCount: Number(row.itemCount),
        status: row.status,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt.toISOString(),
      }),
    ),
    total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
  };
}

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  couponCode: string | null;
  shippingMethod: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingProvince: Province;
  shippingCity: string;
  shippingPostalCode: string | null;
  shippingStreet: string;
  shippingLandmark: string | null;
  notes: string | null;
  adminNote: string | null;
  trackingNumber: string | null;
  bankReference: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  items: {
    id: string;
    productName: string;
    productSlug: string;
    variantLabel: string;
    sku: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  history: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
};

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const [row] = await db
    .select({
      order: orders,
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) return null;

  const [itemRows, historyRows] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(asc(orderStatusHistory.createdAt)),
  ]);

  const order = row.order;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discountTotal: order.discountTotal,
    total: order.total,
    couponCode: order.couponCode,
    shippingMethod: order.shippingMethod,
    shippingFullName: order.shippingFullName,
    shippingPhone: order.shippingPhone,
    shippingProvince: order.shippingProvince,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    shippingStreet: order.shippingStreet,
    shippingLandmark: order.shippingLandmark,
    notes: order.notes,
    adminNote: order.adminNote,
    trackingNumber: order.trackingNumber,
    bankReference: order.bankReference,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: row.userId
      ? {
          id: row.userId,
          email: row.email ?? "",
          firstName: row.firstName,
          lastName: row.lastName,
        }
      : null,
    items: itemRows.map((item) => ({
      id: item.id,
      productName: item.productName,
      productSlug: item.productSlug,
      variantLabel: item.variantLabel,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    history: historyRows.map((entry) => ({
      id: entry.id,
      status: entry.status,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Customers                                 */
/* -------------------------------------------------------------------------- */

export async function getAdminCustomers(filters: { q?: string; page?: number }) {
  const page = Math.max(filters.page ?? 1, 1);
  const perPage = 20;
  const conditions = [eq(users.role, "customer")];

  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(users.email, term),
        ilike(users.phone, term),
      )!,
    );
  }

  const where = and(...conditions);
  const orderCountSql = sql<number>`(
    select count(*)::int from ${orders} o where o.user_id = ${users.id} and o.status <> 'cancelled'
  )`;
  const spentSql = sql<number>`(
    select coalesce(sum(o.total), 0)::int from ${orders} o
    where o.user_id = ${users.id} and o.status <> 'cancelled'
  )`;
  const lastOrderSql = sql<string | null>`(
    select max(o.created_at)::text from ${orders} o where o.user_id = ${users.id}
  )`;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        imageUrl: users.imageUrl,
        createdAt: users.createdAt,
        orderCount: orderCountSql,
        totalSpent: spentSql,
        lastOrderAt: lastOrderSql,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: count(users.id) }).from(users).where(where),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: rows.map((row) => ({
      ...row,
      orderCount: Number(row.orderCount),
      totalSpent: Number(row.totalSpent),
      lastOrderAt: row.lastOrderAt ? new Date(row.lastOrderAt).toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
  };
}

export async function getAdminCustomer(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return null;

  const [addressRows, orderRows, stats] = await Promise.all([
    db.select().from(addresses).where(eq(addresses.userId, id)).orderBy(desc(addresses.isDefault)),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.createdAt)),
    db
      .select({
        orderCount: count(orders.id),
        totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      })
      .from(orders)
      .where(and(eq(orders.userId, id), sql`${orders.status} <> 'cancelled'`)),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt.toISOString(),
    },
    addresses: addressRows.map((address) => ({
      ...address,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    })),
    orders: orderRows.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
    })),
    stats: {
      orderCount: Number(stats[0]?.orderCount ?? 0),
      totalSpent: Number(stats[0]?.totalSpent ?? 0),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Coupons                                  */
/* -------------------------------------------------------------------------- */

export async function getAdminCoupons() {
  const now = Date.now();
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return rows.map((coupon) => ({
    ...coupon,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
    // Derived once here so the page never calls an impure clock during render.
    isExpired: coupon.expiresAt !== null && coupon.expiresAt.getTime() < now,
    isExhausted: coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit,
  }));
}

export async function getAdminCoupon(id: string) {
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!row) return null;
  return {
    ...row,
    startsAt: row.startsAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Categories                                 */
/* -------------------------------------------------------------------------- */

export async function getCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

/* -------------------------------------------------------------------------- */
/*                              Dashboard helpers                             */
/* -------------------------------------------------------------------------- */

export async function getInventoryOverview() {
  const [row] = await db
    .select({
      variants: count(inventory.id),
      totalUnits: sql<number>`coalesce(sum(${inventory.quantity}), 0)::int`,
      outOfStock: sql<number>`count(*) filter (where ${inventory.quantity} = 0)::int`,
      lowStock: sql<number>`count(*) filter (where ${inventory.quantity} > 0 and ${inventory.quantity} <= ${inventory.lowStockThreshold})::int`,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(products.isActive, true), eq(productVariants.isActive, true)));

  return {
    variants: Number(row?.variants ?? 0),
    totalUnits: Number(row?.totalUnits ?? 0),
    outOfStock: Number(row?.outOfStock ?? 0),
    lowStock: Number(row?.lowStock ?? 0),
  };
}

/** Used by the invoice page to batch-load products referenced by an order. */
export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .where(inArray(products.id, ids));
}
