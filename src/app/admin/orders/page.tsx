import { ArrowRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminFlash } from "@/components/admin/admin-flash";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Pagination } from "@/components/shop/pagination";
import { getAdminOrders } from "@/db/queries/admin";
import { ORDER_STATUSES, ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/constants";
import { formatDateTime, formatNumber, formatPKR } from "@/lib/format";
import { firstParam } from "@/lib/search-params";
import type { OrderStatus, PaymentStatus } from "@/types/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const statusParam = firstParam(params.status) ?? "all";
  const paymentParam = firstParam(params.paymentStatus) ?? "all";
  const page = Math.max(Number(firstParam(params.page) ?? 1) || 1, 1);

  const status = (ORDER_STATUSES as readonly string[]).includes(statusParam)
    ? (statusParam as OrderStatus)
    : "all";
  const paymentStatus = Object.keys(PAYMENT_STATUS_META).includes(paymentParam)
    ? (paymentParam as PaymentStatus)
    : "all";

  const result = await getAdminOrders({ q, status, paymentStatus, page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Confirm, pack, ship and track every order. COD and bank transfers are verified manually."
      />

      <AdminFlash params={params} />

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <div>
          <label htmlFor="order-search" className="text-xs font-semibold text-stone-700">
            Search
          </label>
          <div className="relative mt-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="order-search"
              name="q"
              defaultValue={q}
              placeholder="Order number, name, phone or email"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label htmlFor="order-status" className="text-xs font-semibold text-stone-700">
            Status
          </label>
          <NativeSelect id="order-status" name="status" defaultValue={status} className="mt-1">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {ORDER_STATUS_META[option].label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div>
          <label htmlFor="order-payment" className="text-xs font-semibold text-stone-700">
            Payment
          </label>
          <NativeSelect
            id="order-payment"
            name="paymentStatus"
            defaultValue={paymentStatus}
            className="mt-1"
          >
            <option value="all">All payments</option>
            {Object.entries(PAYMENT_STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Filter
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">Reset</Link>
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        {formatNumber(result.total)} order{result.total === 1 ? "" : "s"} found
        {q ? ` for “${q}”` : ""}.
      </p>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {result.items.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            No orders match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Ship to
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">
                    Items
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {result.items.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60">
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800">{order.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {order.customerEmail ?? "Guest"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {order.shippingCity}
                      <p className="text-[11px] capitalize text-muted-foreground">
                        {order.shippingProvince.replaceAll("_", " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center text-stone-600">{order.itemCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">
                      {formatPKR(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Open <ArrowRight aria-hidden="true" className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        basePath="/admin/orders"
        params={{
          q,
          status: status === "all" ? undefined : status,
          paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
        }}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
