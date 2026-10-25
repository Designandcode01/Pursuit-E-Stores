"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/commerce";

export function ProductGallery({
  images,
  name,
  compareAtPrice,
  basePrice,
}: {
  images: ProductImage[];
  name: string;
  compareAtPrice: number | null;
  basePrice: number;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  const percent = discountPercent(basePrice, compareAtPrice);

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-3xl bg-[#f1eadc] text-sm text-muted-foreground">
        No image available
      </div>
    );
  }

  const go = (direction: -1 | 1) => {
    setActive((index) => (index + direction + images.length) % images.length);
  };

  return (
    <div>
      <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#f1eadc]">
        <Image
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        {percent > 0 ? (
          <div className="absolute left-4 top-4">
            <Badge variant="terracotta">-{percent}% off</Badge>
          </div>
        ) : null}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : null}

        <span className="absolute bottom-4 right-4 rounded-full bg-stone-950/55 px-2.5 py-1 text-[10px] font-medium text-white">
          {active + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-xl border-2 bg-[#f1eadc] transition-colors",
                index === active ? "border-brand-700" : "border-transparent hover:border-stone-300",
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
