"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { mergeWishlistAction, toggleWishlistAction } from "@/actions/wishlist";
import { WISHLIST_STORAGE_KEY } from "@/lib/cart";
import { safeJsonParse } from "@/lib/utils";
import type { WishlistSnapshot } from "@/types/commerce";

type WishlistContextValue = {
  items: WishlistSnapshot[];
  count: number;
  isSignedIn: boolean;
  isReady: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (snapshot: WishlistSnapshot) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readGuestWishlist(): WishlistSnapshot[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<WishlistSnapshot[]>(
    window.localStorage.getItem(WISHLIST_STORAGE_KEY),
    [],
  );
}

function writeGuestWishlist(items: WishlistSnapshot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

export function WishlistProvider({
  children,
  initialItems,
  isSignedIn,
}: {
  children: React.ReactNode;
  initialItems: WishlistSnapshot[];
  isSignedIn: boolean;
}) {
  const [items, setItems] = useState<WishlistSnapshot[]>(initialItems);
  const [isReady, setIsReady] = useState(isSignedIn);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       Guest wishlists live in localStorage, which is only readable after mount.
       Reading it during render would produce a server/client hydration mismatch. */
    if (!isSignedIn) {
      setItems(readGuestWishlist());
      setIsReady(true);
      return;
    }

    const guest = readGuestWishlist();
    if (guest.length === 0) {
      setIsReady(true);
      return;
    }

    let active = true;
    /* eslint-enable react-hooks/set-state-in-effect */
    mergeWishlistAction(guest.map((item) => item.productId))
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setItems(result.data);
          writeGuestWishlist([]);
        }
      })
      .catch(() => {
        if (active) toast.error("We could not merge your wishlist. Please try again.");
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [isSignedIn]);

  const toggle = useCallback(
    async (snapshot: WishlistSnapshot) => {
      const exists = items.some((item) => item.productId === snapshot.productId);

      if (!isSignedIn) {
        const next = exists
          ? items.filter((item) => item.productId !== snapshot.productId)
          : [...items, snapshot];
        setItems(next);
        writeGuestWishlist(next);
        toast.success(exists ? "Removed from your wishlist." : "Saved to your wishlist.");
        return;
      }

      try {
        const result = await toggleWishlistAction({ productId: snapshot.productId });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setItems(result.data.items);
        toast.success(result.message ?? "Wishlist updated.");
      } catch {
        toast.error("Could not update your wishlist.");
      }
    },
    [items, isSignedIn],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      isSignedIn,
      isReady,
      isWishlisted: (productId: string) =>
        items.some((item) => item.productId === productId),
      toggle,
    }),
    [items, isSignedIn, isReady, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
