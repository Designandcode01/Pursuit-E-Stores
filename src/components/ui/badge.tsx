import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-100 text-brand-800",
        secondary: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        amber: "border-amber-200 bg-amber-50 text-amber-800",
        blue: "border-sky-200 bg-sky-50 text-sky-800",
        violet: "border-violet-200 bg-violet-50 text-violet-800",
        green: "border-emerald-200 bg-emerald-50 text-emerald-800",
        red: "border-red-200 bg-red-50 text-red-700",
        dark: "border-transparent bg-stone-900 text-white",
        terracotta: "border-orange-200 bg-orange-50 text-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
