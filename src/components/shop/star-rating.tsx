import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = 14,
  showValue = false,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5${count !== undefined ? ` from ${count} reviews` : ""}`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            width={size}
            height={size}
            className={
              index < rounded
                ? "fill-amber-400 text-amber-400"
                : "fill-stone-200 text-stone-200"
            }
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-medium text-stone-600">{rating.toFixed(1)}</span>
      ) : null}
      {count !== undefined ? (
        <span className="text-xs text-muted-foreground">({count})</span>
      ) : null}
    </div>
  );
}
