import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { getAdminCustomer } from "@/db/queries/admin";
import { PROVINCE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, formatNumber, formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminCustomer(id);

  if (!data) notFound();

  const name =
    [data.user.firstName, data.user.lastName].filter(Boolean).join(" ") ||
    data.user.email.split("@")[0];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to customers
      </Link>

      <PageHeader
        title={name}
        description={`Customer since ${formatDate(data.user.createdAt)}`}
        actions={
          <a
            href={`mailto:${data.user.email}`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-stone-300 px-4 text-xs font-semibold text-stone-700 hover:border-brand-600 hover:text-brand-800"
          >
            <Mail aria-hidden="true" className="size-3.5" />
            Email customer
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Orders
          </p>
          <p className="mt-2 font-display text-3xl text-stone-900">
            {formatNumber(data.stats.orderCount)}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Lifetime value
          </p>
          <p className="mt-2 font-display text-3xl text-stone-900">
            {formatPKR(data.stats.totalSpent)}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Average order
          </p>
          <p className="mt-2 font-display text-3xl text-stone-900">
            {data.stats.orderCount === 0
              ? formatPKR(0)
              : formatPKR(Math.round(data.stats.totalSpent / data.stats.orderCount))}
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Contact</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-stone-700">
              <li className="flex items-start gap-2">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <a href={`mailto:${data.user.email}`} className="break-all hover:text-brand-700">
                  {data.user.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {data.user.phone ? (
                  <a href={`tel:${data.user.phone}`} className="hover:text-brand-700">
                    {data.user.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">No phone on file</span>
                )}
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Addresses</h2>
            {data.addresses.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No saved addresses.</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {data.addresses.map((address) => (
                  <li key={address.id} className="rounded-xl border border-stone-200 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-stone-900">{address.label}</span>
                      {address.isDefault ? <Badge variant="green">Default</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-stone-600">{address.fullName}</p>
                    <p className="flex items-start gap-1 text-xs text-stone-600">
                      <MapPin aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                      <span>
                        {address.street}
                        <br />
                        {address.city}, {PROVINCE_LABELS[address.province]}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="font-display text-lg text-stone-900">Order history</h2>
            <p className="text-xs text-muted-foreground">
              Every order placed with this account, newest first.
            </p>
          </div>

          {data.orders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              This customer has not ordered yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Order
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Date
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
                  {data.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-stone-900 hover:text-brand-700"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs text-stone-600">
                        {formatDateTime(order.createdAt)}
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
      </div>
    </div>
  );
}
