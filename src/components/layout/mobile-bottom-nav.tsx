"use client";

import { Home, LayoutGrid, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
  {
    href: "/categories",
    label: "Categories",
    icon: LayoutGrid,
    match: (path: string) =>
      path.startsWith("/categories") || path.startsWith("/category") || path.startsWith("/products"),
  },
  { href: "/cart", label: "Bag", icon: ShoppingBag, match: (path: string) => path === "/cart" },
  {
    href: "/account",
    label: "Account",
    icon: UserRound,
    match: (path: string) => path.startsWith("/account") || path.startsWith("/sign-in"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  if (pathname.startsWith("/checkout") || pathname.startsWith("/orders/")) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-brand-800" : "text-stone-500 hover:text-stone-800",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  <Icon className={cn("size-5", active ? "stroke-[2.2]" : "")} aria-hidden="true" />
                  {item.href === "/cart" && count > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-brand-700 px-1 text-[9px] font-bold leading-4 text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                {item.label}
                {active ? (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-700" aria-hidden="true" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
