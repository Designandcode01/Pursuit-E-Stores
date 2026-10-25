"use client";

import {
  ChartNoAxesCombined,
  FolderTree,
  LayoutDashboard,
  MessageSquareText,
  Package,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
];

export function AdminNav({ pendingReviews = 0 }: { pendingReviews?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-700 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            <span className="flex-1">{link.label}</span>
            {link.href === "/admin/reviews" && pendingReviews > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-terracotta/10 text-terracotta",
                )}
              >
                {pendingReviews}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
              active
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-stone-200 bg-white text-stone-600",
            )}
          >
            <Icon aria-hidden="true" className="size-3.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminBreadcrumb({ current }: { current: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Link href="/admin" className="hover:text-stone-900">
        Admin
      </Link>
      <ChartNoAxesCombined aria-hidden="true" className="size-3" />
      <span className="font-medium text-stone-700">{current}</span>
    </div>
  );
}
