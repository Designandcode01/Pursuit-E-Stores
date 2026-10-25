"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/shop/empty-state";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { formatPKR } from "@/lib/format";

export function WishlistView() {
  const { items, isReady, isSignedIn, toggle } = useWishlist();

  if (!isReady) {
    return (
      <div className="container-page py-10 sm:py-14">
        <div className="skeleton h-9 w-52 rounded-full" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Saved for later</p>
        <h1 className="mt-2 font-display text-4xl text-stone-900">Your wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignedIn
            ? "Your wishlist is saved to your account and synced across devices."
            : "Your wishlist is saved on this device. Sign in to keep it across devices."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Heart className="size-6" aria-hidden="true" />}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here for later."
            action={
              <Button asChild>
                <Link href="/products">
                  <ShoppingBag aria-hidden="true" /> Shop all products
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "saved piece" : "saved pieces"}
            </p>
            {!isSignedIn ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in?redirect_url=%2Fwishlist">Sign in to sync</Link>
              </Button>
            ) : null}
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.productId} className="group flex flex-col">
                <div className="relative overflow-hidden rounded-2xl bg-[#f1eadc]">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="relative block aspect-[4/5]"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void toggle(item)}
                    className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full border border-white/70 bg-white/90 text-red-500 shadow-sm backdrop-blur transition-colors hover:bg-white"
                    aria-label={`Remove ${item.productName} from wishlist`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col pt-3">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="line-clamp-2 text-sm font-medium text-stone-900 hover:text-brand-800"
                  >
                    {item.productName}
                  </Link>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {formatPKR(item.price)}
                    </span>
                    {item.compareAtPrice && item.compareAtPrice > item.price ? (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPKR(item.compareAtPrice)}
                      </span>
                    ) : null}
                  </div>
                  <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                    <Link href={`/products/${item.productSlug}`}>Choose options</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
