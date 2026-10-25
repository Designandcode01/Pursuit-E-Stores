import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Package,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { SalesChart } from "@/components/admin/sales-chart";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDashboardStats,
  getInventoryOverview,
  getLowStockVariants,
  getOrderStatusCounts,
  getRecentOrders,
  getSalesTrend,
  getTopProducts,
} from "@/db/queries/admin";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/constants";
import { formatDate, formatDateTime, formatNumber, formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminDashboardPage() {
  const [stats, trend, statusCounts, topProducts, recentOrders, lowStock, inventory] =
    await Promise.all([
      getDashboardStats(),
      getSalesTrend(14),
      getOrderStatusCounts(),
      getTopProducts(5),
      getRecentOrders(6),
      getLowStockVariants(6),
      getInventoryOverview(),
    ]);

  const totalOrders = ORDER_STATUSES.reduce((sum, status) => sum + statusCounts[status], 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={`${formatDate(new Date())} · Everything happening at Hunar Bazaar today.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">
                <ShoppingBag aria-hidden="true" />
                All orders
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/products/new">
                <Plus aria-hidden="true" />
                New product
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPKR(stats.revenue)}
          delta={stats.revenueDelta}
          icon={Banknote}
        />
        <StatCard
          label="Orders"
          value={formatNumber(stats.orders)}
          delta={stats.ordersDelta}
          icon={ShoppingBag}
        />
        <StatCard
          label="Customers"
          value={formatNumber(stats.customers)}
          delta={stats.customersDelta}
          icon={Users}
        />
        <StatCard
          label="Avg. order value"
          value={formatPKR(stats.avgOrderValue)}
          hint={`${stats.pendingOrders} pending order${stats.pendingOrders === 1 ? "" : "s"}`}
          icon={Package}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-2">
          <SalesChart data={trend} />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg text-stone-900">Order pipeline</h2>
          <p className="text-xs text-muted-foreground">{formatNumber(totalOrders)} orders all time</p>
          <ul className="mt-4 space-y-3">
            {ORDER_STATUSES.map((status) => {
              const count = statusCounts[status];
              const share = totalOrders === 0 ? 0 : Math.round((count / totalOrders) * 100);
              return (
                <li key={status}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-stone-700">{ORDER_STATUS_META[status].label}</span>
                    <span className="text-xs text-muted-foreground">
                      {count} · {share}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 text-xs">
            <div>
              <p className="text-muted-foreground">Units in stock</p>
              <p className="mt-0.5 text-base font-semibold text-stone-900">
                {formatNumber(inventory.totalUnits)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Low / sold out</p>
              <p className="mt-0.5 text-base font-semibold text-stone-900">
                {inventory.lowStock + inventory.outOfStock}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="font-display text-lg text-stone-900">Recent orders</h2>
              <p className="text-xs text-muted-foreground">The latest activity across the store.</p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              View all <ArrowRight aria-hidden="true" className="size-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Order
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Customer
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/70">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-stone-900 hover:text-brand-700"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-stone-800">{order.customerName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {order.customerEmail ?? "Guest checkout"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1">
                          <OrderStatusBadge status={order.status} />
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-stone-900">
                        {formatPKR(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg text-stone-900">Best sellers</h2>
          <p className="text-xs text-muted-foreground">By revenue, excluding cancellations.</p>

          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {topProducts.map((product, index) => (
                <li key={`${product.productId}-${index}`} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-800">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800">
                      {product.productSlug ? (
                        <Link
                          href={`/products/${product.productSlug}`}
                          className="hover:text-brand-700"
                        >
                          {product.productName}
                        </Link>
                      ) : (
                        product.productName
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {product.quantity} sold · {formatPKR(product.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-amber-50 text-amber-700">
              <AlertTriangle aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-lg text-stone-900">Stock alerts</h2>
              <p className="text-xs text-muted-foreground">
                {stats.lowStockCount} variant{stats.lowStockCount === 1 ? "" : "s"} at or below the
                low-stock threshold.
              </p>
            </div>
          </div>
          <Badge variant="amber">{inventory.outOfStock} sold out</Badge>
        </div>

        {lowStock.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Everything is comfortably in stock.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {lowStock.map((variant) => (
              <li
                key={variant.variantId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${variant.productId}/edit`}
                    className="text-sm font-semibold text-stone-900 hover:text-brand-700"
                  >
                    {variant.productName}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {variant.color} / {variant.size} · {variant.sku}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    threshold {variant.threshold}
                  </span>
                  <Badge variant={variant.stock === 0 ? "red" : "amber"}>
                    {variant.stock === 0 ? "Sold out" : `${variant.stock} left`}
                  </Badge>
                  <Link
                    href={`/admin/products/${variant.productId}/edit`}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Restock
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
