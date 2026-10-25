"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { Button } from "@/components/ui/button";
import { ColorSwatch } from "@/lib/colors";
import { MAX_CART_QUANTITY, variantLabel } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPKR } from "@/lib/format";
import { cn, whatsappLink } from "@/lib/utils";
import type { ProductDetailData } from "@/types/commerce";

export function ProductPurchase({ product }: { product: ProductDetailData }) {
  const { addItem, isReady, isMutating } = useCart();
  const [isPending, startTransition] = useTransition();
  const initial = product.defaultVariant;

  const [color, setColor] = useState(initial?.color ?? product.colors[0] ?? "");
  const [size, setSize] = useState(initial?.size ?? product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);

  const variant = useMemo(
    () =>
      product.variants.find((item) => item.color === color && item.size === size) ?? null,
    [product.variants, color, size],
  );

  const availableSizes = useMemo(
    () => new Set(product.variants.filter((item) => item.color === color).map((item) => item.size)),
    [product.variants, color],
  );

  const stock = variant?.stock ?? 0;
  const soldOut = !variant || stock < 1;
  const maxQuantity = Math.min(stock, MAX_CART_QUANTITY);
  const price = variant?.price ?? product.basePrice;
  const compareAtPrice =
    product.compareAtPrice && product.compareAtPrice > price ? product.compareAtPrice : null;

  const handleColor = (nextColor: string) => {
    setColor(nextColor);
    setQuantity(1);
    if (!product.variants.some((item) => item.color === nextColor && item.size === size)) {
      const fallback = product.variants.find((item) => item.color === nextColor);
      if (fallback) setSize(fallback.size);
    }
  };

  const add = () => {
    if (!variant) return;
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
          quantity,
          availableStock: variant.stock,
        },
        quantity,
      );
    });
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tracking-tight text-stone-900">
          {formatPKR(price)}
        </span>
        {compareAtPrice ? (
          <>
            <span className="text-sm text-muted-foreground line-through">
              {formatPKR(compareAtPrice)}
            </span>
            <span className="rounded-full bg-terracotta-soft px-2 py-0.5 text-[11px] font-semibold text-terracotta">
              Save {formatPKR(compareAtPrice - price)}
            </span>
          </>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Inclusive of all taxes · Prices in PKR
      </p>

      {product.colors.length > 0 ? (
        <fieldset className="mt-6">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Colour: <span className="normal-case tracking-normal text-stone-900">{color}</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.colors.map((item) => {
              const active = color === item;
              const hasStock = product.variants.some(
                (variantItem) => variantItem.color === item && variantItem.stock > 0,
              );
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleColor(item)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                    active
                      ? "border-brand-700 bg-brand-50 text-brand-900"
                      : "border-border bg-white text-stone-700 hover:border-stone-400",
                    !hasStock && "opacity-60",
                  )}
                >
                  <ColorSwatch color={item} size="sm" selected={active} />
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {product.sizes.length > 0 ? (
        <fieldset className="mt-5">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Size: <span className="normal-case tracking-normal text-stone-900">{size}</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.sizes.map((item) => {
              const active = size === item;
              const available = availableSizes.has(item);
              const variantStock = product.variants.find(
                (variantItem) => variantItem.color === color && variantItem.size === item,
              )?.stock;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSize(item);
                    setQuantity(1);
                  }}
                  aria-pressed={active}
                  disabled={!available}
                  className={cn(
                    "min-w-11 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-border bg-white text-stone-700 hover:border-stone-500",
                    (!available || variantStock === 0) &&
                      "cursor-not-allowed border-dashed text-stone-300 line-through hover:border-border",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <Link
            href="/pages/size-guide"
            className="mt-2 inline-block text-[11px] font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900"
          >
            View size guide
          </Link>
        </fieldset>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex h-11 items-center rounded-full border border-border bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1 || soldOut}
            className="grid size-10 place-items-center rounded-l-full text-stone-600 transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span className="w-9 text-center text-sm font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            disabled={quantity >= maxQuantity || soldOut}
            className="grid size-10 place-items-center rounded-r-full text-stone-600 transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {soldOut
            ? "This option is sold out"
            : stock <= (variant?.lowStockThreshold ?? 5)
              ? `Only ${stock} left — order soon`
              : "In stock, ready to dispatch"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Button
          type="button"
          size="lg"
          onClick={add}
          disabled={soldOut || isPending || isMutating || !isReady}
          className="flex-1"
        >
          <ShoppingBag aria-hidden="true" />
          {soldOut
            ? "Sold out"
            : isPending || isMutating
              ? "Adding…"
              : `Add to bag · ${formatPKR(price * quantity)}`}
        </Button>
        <WishlistButton
          snapshot={{
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            imageUrl: product.image?.url ?? null,
            price: product.basePrice,
            compareAtPrice: product.compareAtPrice,
          }}
          size="lg"
          showLabel
          className="h-12 justify-center border-border px-5"
        />
      </div>

      <a
        href={whatsappLink(
          `Assalam-o-Alaikum! I have a question about "${product.name}"${variant ? ` (${variantLabel(variant.color, variant.size)})` : ""}.`,
        )}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-2 rounded-full border border-[#25d366]/40 bg-[#25d366]/10 px-4 py-2.5 text-xs font-semibold text-[#0f766e] transition-colors hover:bg-[#25d366]/15"
      >
        Ask about this piece on WhatsApp
      </a>

      <div className="mt-5 grid gap-2 rounded-2xl border border-border bg-white p-4 text-xs text-stone-600">
        <p className="flex items-start gap-2">
          <Truck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
          <span>
            Standard delivery in 3–5 working days. Free over {formatPKR(FREE_SHIPPING_THRESHOLD)}.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <ShoppingBag className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
          <span>Cash on delivery available nationwide. Bank transfer also accepted.</span>
        </p>
      </div>
    </div>
  );
}
