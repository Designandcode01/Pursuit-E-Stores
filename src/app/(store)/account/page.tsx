import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";

import { ProfileForm } from "@/components/account/profile-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAddresses, getOrdersForUser } from "@/db/queries/account";
import { getWishlistCount } from "@/db/queries/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUS_META } from "@/lib/constants";
import { formatDate, formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [orders, addresses, wishlistCount] = await Promise.all([
    getOrdersForUser(user.id),
    getAddresses(user.id),
    getWishlistCount(user.id),
  ]);

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "there";
  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">My account</p>
        <h1 className="mt-2 font-display text-3xl text-stone-900 sm:text-4xl">
          Assalam-o-Alaikum, {name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Member since {formatDate(user.createdAt)} · {user.email}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/account/orders", label: "Orders", value: orders.length, icon: Package },
          { href: "/account/addresses", label: "Saved addresses", value: addresses.length, icon: MapPin },
          { href: "/wishlist", label: "Wishlist", value: wishlistCount, icon: Heart },
        ].map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-600"
          >
            <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand-700">
              <stat.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-semibold text-stone-900">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <ProfileForm
        firstName={user.firstName ?? ""}
        lastName={user.lastName ?? ""}
        phone={user.phone ?? ""}
        email={user.email}
      />

      <section className="rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-display text-xl text-stone-900">Recent orders</h2>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
          >
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              You have not placed an order yet. Your first order will appear here.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/products">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((order) => {
              const meta = ORDER_STATUS_META[order.status];
              return (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{order.orderNumber}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(order.createdAt)} · {order.itemCount}{" "}
                        {order.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                      <span className="text-sm font-semibold text-stone-900">
                        {formatPKR(order.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
