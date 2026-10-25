"use client";

import {
  ChevronDown,
  Globe2,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { AccountMenu, type HeaderUser } from "@/components/layout/account-menu";
import { BrandMark } from "@/components/layout/brand-mark";
import { SearchDialog } from "@/components/layout/search-dialog";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { STORE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CategoryLink = { name: string; slug: string };

const mainNav = [
  { href: "/products", label: "Shop all" },
  { href: "/products?sort=newest", label: "New in" },
  { href: "/products?sale=1", label: "Sale" },
];

export function SiteHeader({
  user,
  categories,
}: {
  user: HeaderUser | null;
  categories: CategoryLink[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <>
      <div className="bg-brand-900 text-[#f7f0df]">
        <div className="container-page flex h-9 items-center justify-center gap-3 text-[11px] font-medium tracking-wide sm:justify-between">
          <p className="truncate">
            Free standard delivery on orders over <span className="font-semibold">₨ 5,000</span>
          </p>
          <p className="hidden items-center gap-2 sm:flex">
            <span className="inline-block size-1.5 rounded-full bg-[#86efac]" aria-hidden="true" />
            Cash on Delivery available nationwide
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-muted lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-background px-0 py-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="px-5">
                <BrandMark />
              </div>
              <nav className="mt-7 flex flex-col px-2" aria-label="Mobile navigation">
                {mainNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3 text-[15px] font-medium text-stone-800 hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Collections
                </p>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm text-stone-700 hover:bg-muted"
                  >
                    {category.name}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-stone-800 hover:bg-muted"
                >
                  <UserRound className="size-4" aria-hidden="true" /> My account
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-stone-800 hover:bg-muted"
                >
                  <Heart className="size-4" aria-hidden="true" /> Wishlist
                </Link>
                <a
                  href={`https://wa.me/${STORE.whatsapp}`}
                  className="mt-2 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp support · {STORE.phone}
                </a>
              </nav>
            </SheetContent>
          </Sheet>

          <BrandMark className="shrink-0" />

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-muted hover:text-stone-900"
                >
                  Collections
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Shop by collection</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuItem key={category.slug} asChild>
                    <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/categories" className="font-semibold text-brand-800">
                    View all categories
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {mainNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href.split("?")[0] ?? ""));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-stone-900",
                    active ? "text-brand-800" : "text-stone-700",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-stone-700 transition-colors hover:bg-muted lg:px-3"
              aria-label="Search products"
            >
              <Search className="size-5" aria-hidden="true" />
              <span className="hidden text-muted-foreground lg:inline">Search</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden h-10 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-muted sm:inline-flex"
                  aria-label="Language and currency"
                >
                  <Globe2 className="size-4" aria-hidden="true" />
                  EN · PKR
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuItem disabled>English (selected)</DropdownMenuItem>
                <DropdownMenuItem disabled>
                  اردو <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Currency</DropdownMenuLabel>
                <DropdownMenuItem disabled>Pakistani Rupee (₨)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/wishlist"
              className="relative hidden size-10 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-muted sm:inline-flex"
              aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}
            >
              <Heart className="size-5" aria-hidden="true" />
              {wishlistCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold leading-4 text-white">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              ) : null}
            </Link>

            <AccountMenu user={user} />

            <Link
              href="/cart"
              className="relative inline-flex size-10 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-muted"
              aria-label={`Shopping bag${count ? `, ${count} items` : ""}`}
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              {count > 0 ? (
                <span className="absolute right-0 top-0 grid min-w-[18px] place-items-center rounded-full bg-brand-700 px-1 text-[9px] font-bold leading-[18px] text-white">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        categories={categories}
      />
    </>
  );
}
