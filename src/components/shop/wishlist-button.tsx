"use client";

import { Heart } from "lucide-react";
import { useTransition } from "react";

import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { cn } from "@/lib/utils";
import type { WishlistSnapshot } from "@/types/commerce";

export function WishlistButton({
  snapshot,
  className,
  showLabel = false,
  size = "sm",
}: {
  snapshot: WishlistSnapshot;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "lg";
}) {
  const { isWishlisted, toggle, isReady } = useWishlist();
  const [isPending, startTransition] = useTransition();
  const active = isWishlisted(snapshot.productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${snapshot.productName} from wishlist` : `Save ${snapshot.productName} to wishlist`}
      disabled={isPending || !isReady}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startTransition(() => {
          void toggle(snapshot);
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-all hover:bg-white hover:text-brand-700 disabled:opacity-60",
        size === "sm" ? "size-9" : "h-11 px-5 text-sm font-semibold",
        className,
      )}
    >
      <Heart
        className={cn(
          size === "sm" ? "size-4" : "size-4",
          active ? "fill-red-500 text-red-500" : "",
        )}
        aria-hidden="true"
      />
      {showLabel ? <span>{active ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
