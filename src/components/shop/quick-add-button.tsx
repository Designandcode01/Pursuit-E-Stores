"use client";

import { Plus, ShoppingBag } from "lucide-react";
import { useTransition } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { variantLabel } from "@/lib/cart";
import type { ProductCardData } from "@/types/commerce";

export function QuickAddButton({ product }: { product: ProductCardData }) {
  const { addItem, isReady } = useCart();
  const [isPending, startTransition] = useTransition();
  const variant = product.defaultVariant;
  const soldOut = !variant || product.totalStock < 1;

  if (soldOut) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-stone-100 px-3 text-xs font-semibold text-stone-500">
        Sold out
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="bg-white/95 shadow-sm backdrop-blur hover:bg-brand-700 hover:text-white"
      disabled={isPending || !isReady}
      onClick={() => {
        startTransition(async () => {
          await addItem(
            {
              variantId: variant.id,
              productId: product.id,
              productName: product.name,
              productSlug: product.slug,
              variantLabel: variantLabel(variant.color, variant.size),
              sku: variant.sku,
              imageUrl: product.image?.url ?? null,
              unitPrice: variant.price,
              quantity: 1,
              availableStock: variant.stock,
            },
            1,
          );
        });
      }}
    >
      {isPending ? (
        <ShoppingBag className="size-3.5 animate-pulse" />
      ) : (
        <Plus className="size-3.5" />
      )}
      Quick add
    </Button>
  );
}
