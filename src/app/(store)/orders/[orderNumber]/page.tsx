import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  Package,
  Phone,
  Truck,
} from "lucide-react";

import { ClearCartOnMount } from "@/components/orders/clear-cart-on-mount";
import { PrintButton } from "@/components/orders/print-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrderForUser } from "@/db/queries/account";
import { getCurrentUser } from "@/lib/auth";
import {
  BANK_DETAILS,
  ORDER_STATUS_META,
  PAYMENT_METHODS,
  PAYMENT_STATUS_META,
  PROVINCE_LABELS,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { cn, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

type Params = Promise<{ orderNumber: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const flow = ["pending", "confirmed", "shipped", "delivered"] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ orderNumber }, sp] = await Promise.all([params, searchParams]);
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/orders/${orderNumber}`)}`);

  const data = await getOrderForUser(user.id, orderNumber);
  if (!data) notFound();

  const { order, items, history } = data;
  const placed = sp.placed === "1";
  const statusMeta = ORDER_STATUS_META[order.status];
  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus];
  const paymentMethod = PAYMENT_METHODS[order.paymentMethod];
  const currentIndex = flow.indexOf(order.status as (typeof flow)[number]);
  const historyByStatus = new Map(history.map((entry) => [entry.status, entry]));

  return (
    <div className="container-page py-8 sm:py-12">
      {placed ? <ClearCartOnMount /> : null}

      {placed ? (
        <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-brand-700" aria-hidden="true" />
            <div>
              <p className="font-display text-xl text-brand-900">Thank you — your order is in!</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-800">
                Your order is saved to your account. Our team will confirm it on WhatsApp or by
                phone within one working day — keep your order number handy.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/products">
              Continue shopping <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="mt-1 font-display text-3xl text-stone-900 sm:text-4xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Placed on {formatDateTime(order.createdAt)} · {items.length}{" "}
            {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
          <Badge variant={paymentMeta.tone}>{paymentMeta.label}</Badge>
          <PrintButton />
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="space-y-6">
          {/* Status */}
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-stone-900">Order status</h2>
              <span className="text-[11px] text-muted-foreground">
                Last updated {formatDate(order.updatedAt)}
              </span>
            </div>

            {order.status === "cancelled" ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">This order was cancelled.</p>
                <p className="mt-1 text-xs leading-relaxed">
                  If this was unexpected, message us on WhatsApp and we will help you reorder.
                </p>
              </div>
            ) : (
              <ol className="mt-5 grid gap-0 sm:grid-cols-4">
                {flow.map((status, index) => {
                  const meta = ORDER_STATUS_META[status];
                  const complete = index <= currentIndex;
                  const active = index === currentIndex;
                  const entry = historyByStatus.get(status);
                  return (
                    <li key={status} className="relative flex gap-3 pb-5 last:pb-0 sm:block sm:pb-0">
                      {index < flow.length - 1 ? (
                        <span
                          className={cn(
                            "absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5 sm:left-[calc(50%+14px)] sm:top-3.5 sm:h-0.5 sm:w-[calc(100%-28px)]",
                            index < currentIndex ? "bg-brand-600" : "bg-border",
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span
                        className={cn(
                          "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
                          complete
                            ? "border-brand-700 bg-brand-700 text-white"
                            : "border-border bg-white text-stone-300",
                        )}
                      >
                        {complete ? (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : (
                          <Circle className="size-3" aria-hidden="true" />
                        )}
                      </span>
                      <div className="sm:mt-2 sm:pr-2">
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            active ? "text-brand-800" : complete ? "text-stone-900" : "text-stone-400",
                          )}
                        >
                          {meta.label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                          {entry ? formatDate(entry.createdAt) : meta.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {order.trackingNumber ? (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 text-xs text-brand-900">
                <Truck className="size-4" aria-hidden="true" />
                Tracking number: <strong>{order.trackingNumber}</strong>
              </p>
            ) : null}

            {order.status === "pending" ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-900">
                <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                We confirm every COD order by phone or WhatsApp before dispatch. Please keep your
                number reachable.
              </p>
            ) : null}
          </section>

          {/* Items */}
          <section className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <h2 className="font-display text-xl text-stone-900">Items</h2>
              <span className="text-[11px] text-muted-foreground">{items.length} lines</span>
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-4 sm:px-6">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f1eadc]"
                  >
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="line-clamp-2 text-sm font-medium text-stone-900 hover:text-brand-800"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.variantLabel} · Qty {item.quantity}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-stone-400">
                      {item.sku}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    {formatPKR(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-border bg-[#fcfaf5] px-5 py-4 text-sm sm:px-6">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPKR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{order.shippingFee === 0 ? "Free" : formatPKR(order.shippingFee)}</dd>
              </div>
              {order.discountTotal > 0 ? (
                <div className="flex justify-between text-brand-800">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd>−{formatPKR(order.discountTotal)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>
          </section>

          {order.notes ? (
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <h2 className="font-display text-lg text-stone-900">Your note</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-stone-600">{order.notes}</p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-display text-lg text-stone-900">Delivery address</h2>
            <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-stone-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <p className="font-semibold text-stone-900">{order.shippingFullName}</p>
                <p className="mt-0.5">{order.shippingStreet}</p>
                {order.shippingLandmark ? <p>{order.shippingLandmark}</p> : null}
                <p>
                  {order.shippingCity}, {PROVINCE_LABELS[order.shippingProvince]}
                  {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5">
                  <Phone className="size-3.5" aria-hidden="true" /> {order.shippingPhone}
                </p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <Package className="size-3.5" aria-hidden="true" />
              {order.shippingMethod === "express" ? "Express delivery" : "Standard delivery"}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-display text-lg text-stone-900">Payment</h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={paymentMeta.tone}>{paymentMeta.label}</Badge>
              <span className="text-xs text-stone-600">{paymentMethod.label}</span>
            </div>

            {order.paymentMethod === "cod" ? (
              <p className="mt-3 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-brand-900">
                <Banknote className="mr-1 inline size-3.5" aria-hidden="true" />
                Please keep {formatPKR(order.total)} ready for the courier. COD orders are
                confirmed by phone before dispatch.
              </p>
            ) : null}

            {order.paymentMethod === "bank_transfer" ? (
              <div className="mt-3 space-y-2 text-[11px] leading-relaxed">
                <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-amber-900">
                  Transfer <strong>{formatPKR(order.total)}</strong> using your order number{" "}
                  <strong>{order.orderNumber}</strong> as the reference. We verify transfers within
                  one working day.
                </p>
                <dl className="grid gap-1 rounded-xl border border-border p-3.5 text-stone-600">
                  <div className="flex justify-between gap-2">
                    <dt>Bank</dt>
                    <dd className="font-medium text-stone-900">{BANK_DETAILS.bankName}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Title</dt>
                    <dd className="font-medium text-stone-900">{BANK_DETAILS.accountTitle}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Account</dt>
                    <dd className="font-medium text-stone-900">{BANK_DETAILS.accountNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>IBAN</dt>
                    <dd className="font-medium text-stone-900">{BANK_DETAILS.iban}</dd>
                  </div>
                </dl>
                {order.bankReference ? (
                  <p className="text-[11px] text-muted-foreground">
                    Reference on file: <strong>{order.bankReference}</strong>
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-display text-lg text-stone-900">Need help?</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Quote order <strong>{order.orderNumber}</strong> when you contact us.
            </p>
            <div className="mt-3 grid gap-2">
              <Button asChild size="sm" variant="outline">
                <a
                  href={whatsappLink(
                    `Assalam-o-Alaikum! I need help with order ${order.orderNumber}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Message on WhatsApp
                </a>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/account/orders">All my orders</Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
