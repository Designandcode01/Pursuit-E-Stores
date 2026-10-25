import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  inverted = false,
  compact = false,
}: {
  className?: string;
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Pursuit E-Store"
    >
      <span
        className={cn(
          "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border",
          inverted
            ? "border-white/25 bg-white/10 text-[#f5ecd9]"
            : "border-brand-800/15 bg-brand-800 text-[#f5ecd9]",
        )}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="relative z-10"
        >
          <path
            d="M5 20V11.5C5 7.91 8.13 5 12 5s7 2.91 7 6.5V20"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M9 20v-6.2c0-1.77 1.34-3.2 3-3.2s3 1.43 3 3.2V20"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity=".75"
          />
          <path d="M3 20h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-[#d97706]/25" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[21px] font-semibold tracking-tight",
              inverted ? "text-[#fdf8ee]" : "text-stone-900",
            )}
          >
            Pursuit <span className={inverted ? "text-[#bbf7d0]" : "text-brand-700"}>E-Store</span>
          </span>
          <span
            className={cn(
              "mt-1 text-[9px] font-semibold uppercase tracking-[0.26em]",
              inverted ? "text-white/55" : "text-stone-500",
            )}
          >
            Crafted in Pakistan
          </span>
        </span>
      ) : null}
    </Link>
  );
}
