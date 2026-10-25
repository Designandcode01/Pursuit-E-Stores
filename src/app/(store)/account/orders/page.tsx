import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { EmptyState } from "@/components/shop/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrdersForUser } from "@/db/queries/account";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/constants";
import { formatDate, formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">My account</p>
        <h1 className="mt-2 font-display text-3xl text-stone-900 sm:text-4xl">My orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track delivery, review past purchases and download invoices.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" aria-hidden="true" />}
          title="No orders yet"
          description="When you place an order it will appear here with live status updates."
          action={
            <Button asChild>
              <Link href="/products">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const status = ORDER_STATUS_META[order.status];
            const payment = PAYMENT_STATUS_META[order.paymentStatus];
            return (
              <li
                key={order.id}
                className="rounded-2xl border border-border bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/orders/${order.orderNumber}`}
                      className="text-sm font-semibold text-stone-900 hover:text-brand-800"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Placed {formatDate(order.createdAt)} · {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status.tone}>{status.label}</Badge>
                    <Badge variant={payment.tone}>{payment.label}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Total
                    </p>
                    <p className="text-lg font-semibold text-stone-900">
                      {formatPKR(order.total)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/orders/${order.orderNumber}`}>
                      View details <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
