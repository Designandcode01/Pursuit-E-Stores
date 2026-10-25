import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  icon: LucideIcon;
}) {
  const hasDelta = typeof delta === "number";
  const positive = hasDelta && delta > 0;
  const negative = hasDelta && delta < 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <span className="grid size-8 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl leading-none text-stone-900">{value}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {hasDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
              positive && "bg-emerald-50 text-emerald-700",
              negative && "bg-red-50 text-red-700",
              !positive && !negative && "bg-stone-100 text-stone-600",
            )}
          >
            {positive ? (
              <ArrowUpRight aria-hidden="true" className="size-3" />
            ) : negative ? (
              <ArrowDownRight aria-hidden="true" className="size-3" />
            ) : (
              <Minus aria-hidden="true" className="size-3" />
            )}
            {positive ? "+" : ""}
            {delta}%
          </span>
        ) : null}
        <span className="text-muted-foreground">{hint ?? (hasDelta ? "vs previous 30 days" : "")}</span>
      </div>
    </div>
  );
}
