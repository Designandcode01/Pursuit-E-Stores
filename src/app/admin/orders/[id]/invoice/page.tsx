import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/orders/print-button";
import { getAdminOrder } from "@/db/queries/admin";
import { BANK_DETAILS, PROVINCE_LABELS, STORE } from "@/lib/constants";
import { formatDate, formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);

  if (!order) notFound();

  const address = [
    order.shippingStreet,
    order.shippingLandmark,
    `${order.shippingCity}, ${PROVINCE_LABELS[order.shippingProvince]}`,
    order.shippingPostalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10 print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-stone-200 pb-6">
          <div>
            <p className="font-display text-3xl text-stone-900">
              Hunar <span className="text-brand-700">Bazaar</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Crafted in Pakistan, delivered with care.</p>
            <address className="mt-3 not-italic text-xs leading-relaxed text-stone-600">
              Gulberg III, Lahore, Punjab, Pakistan
              <br />
              {STORE.phone} · {STORE.email}
              <br />
              {STORE.siteUrl.replace(/^https?:\/\//, "")}
            </address>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700">
              Invoice
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-stone-900">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-stone-500">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Bank transfer"} ·{" "}
              {order.paymentStatus.replaceAll("_", " ")}
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Billed to
            </h2>
            <p className="mt-2 text-sm font-semibold text-stone-900">{order.shippingFullName}</p>
            <p className="text-xs text-stone-600">{order.shippingPhone}</p>
            {order.customer ? (
              <p className="text-xs text-stone-600">{order.customer.email}</p>
            ) : (
              <p className="text-xs text-stone-600">Guest checkout</p>
            )}
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ship to
            </h2>
            <p className="mt-2 text-sm font-semibold text-stone-900">{order.shippingFullName}</p>
            <p className="text-xs leading-relaxed text-stone-600">{address}</p>
          </div>
        </section>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <th scope="col" className="py-2 font-semibold">
                Item
              </th>
              <th scope="col" className="py-2 text-center font-semibold">
                Qty
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Unit price
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-stone-100">
                <td className="py-3">
                  <p className="font-medium text-stone-900">{item.productName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.variantLabel} · {item.sku}
                  </p>
                </td>
                <td className="py-3 text-center text-stone-700">{item.quantity}</td>
                <td className="py-3 text-right text-stone-700">{formatPKR(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium text-stone-900">
                  {formatPKR(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="text-stone-900">{formatPKR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Shipping ({order.shippingMethod})
              </dt>
              <dd className="text-stone-900">
                {order.shippingFee === 0 ? "Free" : formatPKR(order.shippingFee)}
              </dd>
            </div>
            {order.discountTotal > 0 ? (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd>− {formatPKR(order.discountTotal)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-stone-200 pt-2">
              <dt className="font-semibold text-stone-900">Total</dt>
              <dd className="font-display text-xl text-stone-900">{formatPKR(order.total)}</dd>
            </div>
          </dl>
        </div>

        {order.paymentStatus === "paid" ? (
          <p className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs text-brand-900">
            Paid in full — no amount is due. Please keep this invoice for your records.
            {order.bankReference ? (
              <>
                {" "}
                Reference: <span className="font-mono">{order.bankReference}</span>.
              </>
            ) : null}
          </p>
        ) : order.paymentMethod === "bank_transfer" ? (
          <section className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
            <p className="font-semibold text-stone-800">Bank transfer details</p>
            <p className="mt-1">
              {BANK_DETAILS.bankName} · {BANK_DETAILS.accountTitle}
              <br />
              Account {BANK_DETAILS.accountNumber} · IBAN {BANK_DETAILS.iban}
            </p>
            {order.bankReference ? (
              <p className="mt-1">
                Reference on file: <span className="font-mono">{order.bankReference}</span>
              </p>
            ) : null}
          </section>
        ) : (
          <p className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
            Payment is due in cash to the courier on delivery. Please keep this invoice for your
            records.
          </p>
        )}

        <footer className="mt-8 border-t border-stone-200 pt-4 text-center text-[11px] text-muted-foreground">
          Thank you for shopping with Hunar Bazaar. Questions? WhatsApp {STORE.phone}.
        </footer>
      </article>
    </div>
  );
}
