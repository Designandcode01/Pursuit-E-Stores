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

import {
  addToCartAction,
  clearCartAction,
  mergeCartAction,
  removeCartItemAction,
  updateCartQuantityAction,
} from "@/actions/cart";
import { CART_STORAGE_KEY, MAX_CART_QUANTITY } from "@/lib/cart";
import { safeJsonParse } from "@/lib/utils";
import type { CartLine, CartSnapshot } from "@/types/commerce";

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  isSignedIn: boolean;
  isReady: boolean;
  isMutating: boolean;
  addItem: (snapshot: CartSnapshot, quantity?: number) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Clear the client-side cart after a successful checkout redirect. */
  resetLocal: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readGuestCart(): CartSnapshot[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<CartSnapshot[]>(window.localStorage.getItem(CART_STORAGE_KEY), []);
}

function writeGuestCart(items: CartSnapshot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

/**
 * StrictMode mounts effects twice in development, and a shopper can reload the
 * page mid-merge. Both runs would read the same guest cart, and the additive
 * merge would then double every quantity. Sharing one in-flight promise makes
 * the merge idempotent for the browser session.
 */
let inFlightMerge: ReturnType<typeof mergeCartAction> | null = null;

function snapshotToLine(snapshot: CartSnapshot): CartLine {
  return {
    ...snapshot,
    id: `guest:${snapshot.variantId}`,
    quantity: Math.min(snapshot.quantity, snapshot.availableStock, MAX_CART_QUANTITY),
  };
}

export function CartProvider({
  children,
  initialItems,
  isSignedIn,
}: {
  children: React.ReactNode;
  initialItems: CartLine[];
  isSignedIn: boolean;
}) {
  const [items, setItems] = useState<CartLine[]>(initialItems);
  const [isReady, setIsReady] = useState(isSignedIn);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       Guest carts live in localStorage, which is only readable after mount.
       Reading it during render would produce a server/client hydration mismatch. */
    if (!isSignedIn) {
      const guest = readGuestCart();
      setItems(guest.map(snapshotToLine));
      setIsReady(true);
      return;
    }

    const guest = readGuestCart();
    if (guest.length === 0) {
      setIsReady(true);
      return;
    }

    let active = true;
    setIsMutating(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    const merge =
      inFlightMerge ??
      mergeCartAction(
        guest.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      );
    inFlightMerge = merge;

    merge
      .then((result) => {
        // Clear the guest cart even if this effect was cleaned up: otherwise a
        // remount would merge the same items again.
        if (result.ok) writeGuestCart([]);
        if (!active) return;
        if (result.ok) {
          setItems(result.data);
          toast.success("Your guest cart has been saved to your account.");
        } else {
          toast.error(result.message);
        }
      })
      .catch(() => {
        if (active) toast.error("We could not merge your guest cart. Please try again.");
      })
      .finally(() => {
        if (inFlightMerge === merge) inFlightMerge = null;
        if (!active) return;
        setIsMutating(false);
        setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [isSignedIn]);

  const addItem = useCallback(
    async (snapshot: CartSnapshot, quantity = 1) => {
      if (!isReady) {
        toast.error("Your cart is still loading. Please try again in a moment.");
        return false;
      }

      if (!isSignedIn) {
        const current = readGuestCart();
        const existing = current.find((item) => item.variantId === snapshot.variantId);
        const nextQuantity = Math.min(
          (existing?.quantity ?? 0) + quantity,
          snapshot.availableStock,
          MAX_CART_QUANTITY,
        );

        if (nextQuantity < 1) {
          toast.error("This option is sold out.");
          return false;
        }

        const next = existing
          ? current.map((item) =>
              item.variantId === snapshot.variantId
                ? { ...item, quantity: nextQuantity, availableStock: snapshot.availableStock }
                : item,
            )
          : [...current, { ...snapshot, quantity: nextQuantity }];

        writeGuestCart(next);
        setItems(next.map(snapshotToLine));
        toast.success(
          nextQuantity === existing?.quantity
            ? "Maximum available quantity reached."
            : "Added to your bag.",
        );
        return true;
      }

      setIsMutating(true);
      try {
        const result = await addToCartAction({
          variantId: snapshot.variantId,
          quantity,
        });
        if (!result.ok) {
          toast.error(result.message);
          return false;
        }
        setItems(result.data);
        toast.success(result.message ?? "Added to your bag.");
        return true;
      } catch {
        toast.error("Could not add this item. Please try again.");
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [isReady, isSignedIn],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      const safeQuantity = Math.max(0, Math.min(quantity, MAX_CART_QUANTITY));

      if (!isSignedIn) {
        const current = readGuestCart();
        const next = current
          .map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.min(safeQuantity, item.availableStock, MAX_CART_QUANTITY),
                }
              : item,
          )
          .filter((item) => item.quantity > 0);
        writeGuestCart(next);
        setItems(next.map(snapshotToLine));
        return;
      }

      setIsMutating(true);
      try {
        const result = await updateCartQuantityAction({ variantId, quantity: safeQuantity });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setItems(result.data);
      } catch {
        toast.error("Could not update your cart.");
      } finally {
        setIsMutating(false);
      }
    },
    [isSignedIn],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (!isSignedIn) {
        const next = readGuestCart().filter((item) => item.variantId !== variantId);
        writeGuestCart(next);
        setItems(next.map(snapshotToLine));
        toast.success("Item removed.");
        return;
      }

      setIsMutating(true);
      try {
        const result = await removeCartItemAction({ variantId });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setItems(result.data);
        toast.success(result.message ?? "Item removed.");
      } finally {
        setIsMutating(false);
      }
    },
    [isSignedIn],
  );

  const clear = useCallback(async () => {    if (!isSignedIn) {
      writeGuestCart([]);
      setItems([]);
      return;
    }
    setIsMutating(true);
    try {
      const result = await clearCartAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setItems([]);
      toast.success("Cart cleared.");
    } finally {
      setIsMutating(false);
    }
  }, [isSignedIn]);

  const resetLocal = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return {
      items,
      count,
      subtotal,
      isSignedIn,
      isReady,
      isMutating,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      resetLocal,
    };
  }, [items, isSignedIn, isReady, isMutating, addItem, updateQuantity, removeItem, clear, resetLocal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
