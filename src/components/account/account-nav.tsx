"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Profile", icon: UserRound, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package, exact: false },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, exact: false },
  { href: "/wishlist", label: "Wishlist", icon: Heart, exact: false },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28">
      <ul className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-1.5 no-scrollbar lg:flex-col">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-900"
                    : "text-stone-600 hover:bg-muted hover:text-stone-900",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
