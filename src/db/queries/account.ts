import "server-only";

import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  addresses,
  orderItems,
  orderStatusHistory,
  orders,
  type Address,
} from "@/db/schema";

export async function getAddresses(userId: string): Promise<Address[]> {
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
}

export async function getAddress(userId: string, addressId: string) {
  const [address] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .limit(1);
  return address ?? null;
}

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: (typeof orders.$inferSelect)["status"];
  paymentMethod: (typeof orders.$inferSelect)["paymentMethod"];
  paymentStatus: (typeof orders.$inferSelect)["paymentStatus"];
  total: number;
  createdAt: string;
  itemCount: number;
};

export async function getOrdersForUser(userId: string): Promise<OrderSummary[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  if (rows.length === 0) return [];

  const counts = await db
    .select({ orderId: orderItems.orderId, total: count() })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((row) => row.id),
      ),
    )
    .groupBy(orderItems.orderId);

  const countMap = new Map(counts.map((row) => [row.orderId, Number(row.total)]));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    itemCount: countMap.get(row.id) ?? 0,
  }));
}

export async function getOrderForUser(userId: string, orderNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)))
    .limit(1);

  if (!order) return null;

  const [items, history] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.id)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(asc(orderStatusHistory.createdAt)),
  ]);

  return { order, items, history };
}
