import { ArrowLeft, FileText, MapPin, Phone, User } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderNoteForm, OrderStatusForm, PaymentStatusForm } from "@/components/admin/order-forms";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { PrintButton } from "@/components/orders/print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminOrder } from "@/db/queries/admin";
import {
  BANK_DETAILS,
  ORDER_STATUS_META,
  PAYMENT_METHODS,
  PROVINCE_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order details" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);

  if (!order) notFound();

  const paymentMeta = PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to orders
      </Link>

      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · ${order.items.length} line item${
          order.items.length === 1 ? "" : "s"
        }`}
        actions={
          <>
            <PrintButton label="Print invoice" />
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders/${order.id}/invoice`}>
                <FileText aria-hidden="true" />
                Invoice
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
        <Badge variant="outline">
          {paymentMeta?.label ?? order.paymentMethod.replaceAll("_", " ")}
        </Badge>
        <Badge variant="secondary">{order.shippingMethod} delivery</Badge>
        {order.trackingNumber ? <Badge variant="violet">{order.trackingNumber}</Badge> : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="font-display text-lg text-stone-900">Items</h2>
              <p className="text-xs text-muted-foreground">
                Prices shown are the amounts captured when the order was placed.
              </p>
            </div>

            <ul className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="font-semibold text-stone-900 hover:text-brand-700"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.variantLabel} · SKU {item.sku}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {formatPKR(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-stone-900">{formatPKR(item.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-stone-100 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-stone-900">{formatPKR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium text-stone-900">
                  {order.shippingFee === 0 ? "Free" : formatPKR(order.shippingFee)}
                </dd>
              </div>
              {order.discountTotal > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                  <dd className="font-medium">− {formatPKR(order.discountTotal)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-stone-200 pt-2 text-base">
                <dt className="font-semibold text-stone-900">Total</dt>
                <dd className="font-display text-xl text-stone-900">{formatPKR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {order.history.length === 0 ? (
                <li className="text-sm text-muted-foreground">No status history recorded.</li>
              ) : (
                order.history.map((entry, index) => (
                  <li key={entry.id} className="relative flex gap-3">
                    <span className="mt-1 flex flex-col items-center">
                      <span className="size-2.5 rounded-full bg-brand-600" />
                      {index < order.history.length - 1 ? (
                        <span className="mt-1 h-full w-px flex-1 bg-stone-200" />
                      ) : null}
                    </span>
                    <div className="pb-2">
                      <p className="text-sm font-semibold text-stone-900">
                        {ORDER_STATUS_META[entry.status].label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                      {entry.note ? (
                        <p className="mt-1 text-xs text-stone-600">{entry.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ol>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Customer notes</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-stone-700">
              {order.notes?.trim() || "No notes left at checkout."}
            </p>
            {order.bankReference ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Bank reference: <span className="font-mono text-stone-800">{order.bankReference}</span>
              </p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Ship to</h2>
            <div className="mt-3 space-y-2 text-sm text-stone-700">
              <p className="flex items-start gap-2">
                <User aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-stone-900">{order.shippingFullName}</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <a href={`tel:${order.shippingPhone}`} className="hover:text-brand-700">
                  {order.shippingPhone}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {order.shippingStreet}
                  {order.shippingLandmark ? `, ${order.shippingLandmark}` : ""}
                  <br />
                  {order.shippingCity}, {PROVINCE_LABELS[order.shippingProvince]}
                  {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
                </span>
              </p>
            </div>

            {order.customer ? (
              <div className="mt-4 border-t border-stone-100 pt-3 text-xs">
                <p className="text-muted-foreground">Account</p>
                <Link
                  href={`/admin/customers/${order.customer.id}`}
                  className="font-semibold text-brand-700 hover:text-brand-800"
                >
                  {[order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ") ||
                    order.customer.email}
                </Link>
                <p className="text-muted-foreground">{order.customer.email}</p>
              </div>
            ) : (
              <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-muted-foreground">
                Guest checkout (no account).
              </p>
            )}
          </section>

          {order.paymentMethod === "bank_transfer" ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <h2 className="font-display text-lg">Bank transfer</h2>
              <p className="mt-1 text-xs">
                Verify the transfer before marking this order as paid.
              </p>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <dt>Bank</dt>
                  <dd className="font-medium">{BANK_DETAILS.bankName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Title</dt>
                  <dd className="font-medium">{BANK_DETAILS.accountTitle}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Account</dt>
                  <dd className="font-mono">{BANK_DETAILS.accountNumber}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>IBAN</dt>
                  <dd className="font-mono break-all text-right">{BANK_DETAILS.iban}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Update status</h2>
            <div className="mt-3">
              <OrderStatusForm
                orderId={order.id}
                status={order.status}
                trackingNumber={order.trackingNumber}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Payment</h2>
            <div className="mt-3">
              <PaymentStatusForm
                orderId={order.id}
                paymentStatus={order.paymentStatus}
                bankReference={order.bankReference}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Internal notes</h2>
            <div className="mt-3">
              <OrderNoteForm orderId={order.id} adminNote={order.adminNote} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
