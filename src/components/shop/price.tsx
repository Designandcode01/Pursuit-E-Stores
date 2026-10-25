import { cn } from "@/lib/utils";
import { discountPercent, formatPKR } from "@/lib/format";

export function Price({
  price,
  compareAtPrice,
  size = "default",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const percent = discountPercent(price, compareAtPrice ?? null);
  const sizes = {
    sm: "text-sm",
    default: "text-base",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-semibold tracking-tight text-stone-900",
          sizes[size],
        )}
      >
        {formatPKR(price)}
      </span>
      {compareAtPrice && compareAtPrice > price ? (
        <>
          <span className="text-xs text-muted-foreground line-through sm:text-sm">
            {formatPKR(compareAtPrice)}
          </span>
          <span className="text-[11px] font-semibold text-terracotta">
            {percent}% off
          </span>
        </>
      ) : null}
    </div>
  );
}
