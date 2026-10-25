import { formatPKR } from "@/lib/format";
import type { SalesPoint } from "@/db/queries/admin";

/**
 * Dependency-free bar chart. Bars are plain divs so the chart stays crisp at
 * every breakpoint and needs no client JavaScript.
 */
export function SalesChart({ data }: { data: SalesPoint[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No sales yet.</p>;
  }

  const max = Math.max(...data.map((point) => point.revenue), 1);
  const total = data.reduce((sum, point) => sum + point.revenue, 0);
  const orders = data.reduce((sum, point) => sum + point.orders, 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-display text-2xl text-stone-900">{formatPKR(total)}</p>
          <p className="text-xs text-muted-foreground">
            {orders} order{orders === 1 ? "" : "s"} in the last {data.length} days
          </p>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Daily revenue
        </p>
      </div>

      <div
        className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2"
        role="img"
        aria-label={`Revenue for the last ${data.length} days. Total ${formatPKR(total)} across ${orders} orders.`}
      >
        {data.map((point) => {
          const height = Math.max(Math.round((point.revenue / max) * 100), point.revenue > 0 ? 4 : 1);
          return (
            <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-md bg-brand-600/85 transition-colors group-hover:bg-brand-700"
                style={{ height: `${height}%` }}
              />
              <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                {formatPKR(point.revenue)} · {point.orders} order{point.orders === 1 ? "" : "s"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between gap-1 text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span className="hidden sm:inline">{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
