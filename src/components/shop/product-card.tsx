import Image from "next/image";
import Link from "next/link";

import { ColorSwatch } from "@/lib/colors";
import { discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/commerce";

import { Price } from "./price";
import { QuickAddButton } from "./quick-add-button";
import { StarRating } from "./star-rating";
import { WishlistButton } from "./wishlist-button";
import { Badge } from "@/components/ui/badge";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  const percent = discountPercent(product.basePrice, product.compareAtPrice);
  const soldOut = product.totalStock < 1;
  const lowStock = !soldOut && product.totalStock <= 5;

  return (
    <article className={cn("group flex h-full flex-col", className)}>
      <div className="relative overflow-hidden rounded-2xl bg-[#f1eadc]">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[4/5] w-full overflow-hidden"
          aria-label={product.name}
        >
          {product.image ? (
            <Image
              src={product.image.url}
              alt={product.image.alt ?? product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-700 group-hover:scale-[1.03]",
                product.secondaryImage ? "group-hover:opacity-0" : "",
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
          {product.secondaryImage ? (
            <Image
              src={product.secondaryImage.url}
              alt={product.secondaryImage.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          ) : null}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? <Badge variant="dark">Sold out</Badge> : null}
          {percent > 0 && !soldOut ? <Badge variant="terracotta">-{percent}%</Badge> : null}
          {product.isNewArrival && !soldOut ? <Badge variant="default">New in</Badge> : null}
          {product.isFeatured && !product.isNewArrival && !soldOut ? (
            <Badge variant="outline" className="bg-white/90">Bestseller</Badge>
          ) : null}
          {lowStock ? (
            <Badge variant="amber">Only {product.totalStock} left</Badge>
          ) : null}
        </div>

        <div className="absolute right-3 top-3">
          <WishlistButton
            snapshot={{
              productId: product.id,
              productName: product.name,
              productSlug: product.slug,
              imageUrl: product.image?.url ?? null,
              price: product.basePrice,
              compareAtPrice: product.compareAtPrice,
            }}
          />
        </div>

        <div className="absolute inset-x-3 bottom-3 flex justify-end opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          <QuickAddButton product={product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-3.5">
        <Link
          href={`/category/${product.category.slug}`}
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-brand-700"
        >
          {product.category.name}
        </Link>
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-[15px] font-medium leading-snug text-stone-900 transition-colors hover:text-brand-800"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-2">
          <StarRating rating={product.rating || 0} size={12} count={product.reviewCount} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <Price
            price={product.basePrice}
            compareAtPrice={product.compareAtPrice}
            size="sm"
          />
          {product.colors.length > 0 ? (
            <div className="flex items-center gap-1.5 pb-0.5">
              {product.colors.slice(0, 4).map((color) => (
                <ColorSwatch key={color} color={color} />
              ))}
              {product.colors.length > 4 ? (
                <span className="text-[10px] text-muted-foreground">
                  +{product.colors.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="skeleton aspect-[4/5] w-full rounded-2xl" />
      <div className="space-y-2 pt-3.5">
        <div className="skeleton h-2.5 w-20 rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-4 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  className,
}: {
  products: ProductCardData[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
