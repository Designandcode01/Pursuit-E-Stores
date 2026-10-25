"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { EmptyState } from "@/components/shop/empty-state";
import { Button } from "@/components/ui/button";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartView() {
  const { items, count, subtotal, isReady, isMutating, isSignedIn, updateQuantity, removeItem, clear } =
    useCart();

  if (!isReady) {
    return (
      <div className="container-page py-10 sm:py-14">
        <div className="skeleton h-9 w-48 rounded-full" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-10 sm:py-14">
        <p className="eyebrow">Your bag</p>
        <h1 className="mt-2 font-display text-4xl text-stone-900">Your bag is empty</h1>
        <div className="mt-8">
          <EmptyState
            icon={<ShoppingBag className="size-6" aria-hidden="true" />}
            title="Nothing in the bag yet"
            description="Browse the new arrivals or pick a collection to get started. Your guest bag will be saved when you sign in."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href="/products">Shop all products</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/categories">Browse collections</Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1 className="mt-2 font-display text-4xl text-stone-900">
            {count} {count === 1 ? "piece" : "pieces"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void clear()}
          disabled={isMutating}
          className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-destructive disabled:opacity-50"
        >
          Clear bag
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <ul className="space-y-3">
          {items.map((item) => {
            const lineTotal = item.unitPrice * item.quantity;
            const maxQuantity = Math.min(item.availableStock, 20);
            return (
              <li
                key={item.variantId}
                className="flex gap-3 rounded-2xl border border-border bg-white p-3 sm:gap-4 sm:p-4"
              >
                <Link
                  href={`/products/${item.productSlug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-[#f1eadc] sm:size-28"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="line-clamp-2 text-sm font-medium text-stone-900 hover:text-brand-800"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{item.variantLabel}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-stone-400">
                        {item.sku}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeItem(item.variantId)}
                      disabled={isMutating}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-stone-400 transition-colors hover:bg-red-50 hover:text-destructive disabled:opacity-50"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                    <div className="inline-flex h-9 items-center rounded-full border border-border">
                      <button
                        type="button"
                        onClick={() => void updateQuantity(item.variantId, item.quantity - 1)}
                        disabled={isMutating || item.quantity <= 1}
                        className="grid size-8 place-items-center rounded-l-full text-stone-600 hover:bg-muted disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3" aria-hidden="true" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => void updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={isMutating || item.quantity >= maxQuantity}
                        className="grid size-8 place-items-center rounded-r-full text-stone-600 hover:bg-muted disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-900">{formatPKR(lineTotal)}</p>
                      {item.quantity > 1 ? (
                        <p className="text-[10px] text-muted-foreground">
                          {formatPKR(item.unitPrice)} each
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {item.availableStock <= 5 ? (
                    <p className="mt-2 text-[10px] font-medium text-terracotta">
                      Only {item.availableStock} left in stock
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-28">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl text-stone-900">Order summary</h2>

            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-stone-900">{formatPKR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-stone-700">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? "Free" : "From ₨ 250"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Shipping and any coupon are calculated at checkout.
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-brand-50 p-3.5">
              {remaining > 0 ? (
                <>
                  <p className="text-[11px] font-medium text-brand-900">
                    Add {formatPKR(remaining)} more for free standard delivery
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 text-[11px] font-semibold text-brand-900">
                  <Truck className="size-3.5" aria-hidden="true" />
                  You have earned free standard delivery
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold text-stone-900">Estimated total</span>
              <span className="text-lg font-semibold text-stone-900">{formatPKR(subtotal)}</span>
            </div>

            {isSignedIn ? (
              <Button asChild size="lg" className="mt-4 w-full">
                <Link href="/checkout">
                  Proceed to checkout
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="mt-4 w-full">
                  <Link href="/sign-in?redirect_url=%2Fcheckout">
                    Sign in to checkout
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Your bag will be saved to your account automatically.
                </p>
              </>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-brand-700" aria-hidden="true" />
              Secure checkout · COD & bank transfer
            </div>

            <Link
              href="/products"
              className={cn(
                "mt-3 block text-center text-xs font-medium text-brand-800 underline underline-offset-2 hover:text-brand-900",
              )}
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
