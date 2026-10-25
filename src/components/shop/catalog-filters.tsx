import Link from "next/link";
import { Check, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { SortOption } from "@/types/commerce";

export type CatalogCurrentFilters = {
  q?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  sale?: boolean;
};

export type CatalogFacets = {
  sizes: string[];
  colors: string[];
  price: { min: number; max: number };
};

type FilterProps = {
  basePath: string;
  current: CatalogCurrentFilters;
  facets: CatalogFacets;
  categories: { name: string; slug: string }[];
  hideCategoryFilter?: boolean;
};

function preserved(current: CatalogCurrentFilters, overrides: Partial<CatalogCurrentFilters>) {
  return {
    q: current.q,
    category: current.category,
    size: current.size,
    color: current.color,
    minPrice: current.minPrice,
    maxPrice: current.maxPrice,
    sort: current.sort,
    sale: current.sale,
    ...overrides,
  };
}

function FilterPanel({
  basePath,
  current,
  facets,
  categories,
  hideCategoryFilter = false,
}: FilterProps) {
  const hasFacets = Boolean(
    current.category ||
      current.size ||
      current.color ||
      current.minPrice !== undefined ||
      current.maxPrice !== undefined ||
      current.sale,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Filter</h2>
        {hasFacets ? (
          <Link
            href={buildHref(basePath, { q: current.q, sort: current.sort })}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-terracotta hover:underline"
          >
            <X className="size-3" aria-hidden="true" /> Clear
          </Link>
        ) : null}
      </div>

      {!hideCategoryFilter ? (
        <fieldset>
          <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Category
          </legend>
          <ul className="space-y-1">
            <li>
              <Link
                href={buildHref(basePath, preserved(current, { category: undefined }))}
                className={cn(
                  "block rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  !current.category
                    ? "bg-brand-50 font-semibold text-brand-800"
                    : "text-stone-600 hover:bg-muted hover:text-stone-900",
                )}
                aria-current={!current.category ? "true" : undefined}
              >
                All products
              </Link>
            </li>
            {categories.map((category) => {
              const active = current.category === category.slug;
              return (
                <li key={category.slug}>
                  <Link
                    href={buildHref(
                      basePath,
                      preserved(current, { category: active ? undefined : category.slug }),
                    )}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-brand-50 font-semibold text-brand-800"
                        : "text-stone-600 hover:bg-muted hover:text-stone-900",
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    <span>{category.name}</span>
                    {active ? <Check className="size-3.5" aria-hidden="true" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <form action={basePath} method="get" className="border-t border-border pt-5">
        {current.q ? <input type="hidden" name="q" value={current.q} /> : null}
        {current.category ? (
          <input type="hidden" name="category" value={current.category} />
        ) : null}
        {current.size ? <input type="hidden" name="size" value={current.size} /> : null}
        {current.color ? <input type="hidden" name="color" value={current.color} /> : null}
        {current.sort ? <input type="hidden" name="sort" value={current.sort} /> : null}
        {current.sale ? <input type="hidden" name="sale" value="1" /> : null}

        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Price (PKR)
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            name="minPrice"
            inputMode="numeric"
            min={0}
            max={facets.price.max || undefined}
            placeholder={String(facets.price.min || 0)}
            defaultValue={current.minPrice}
            aria-label="Minimum price"
            className="h-9 px-2.5 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            name="maxPrice"
            inputMode="numeric"
            min={0}
            max={facets.price.max || undefined}
            placeholder={String(facets.price.max || 0)}
            defaultValue={current.maxPrice}
            aria-label="Maximum price"
            className="h-9 px-2.5 text-xs"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" className="mt-2.5 w-full">
          Apply price
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Catalogue range: ₨ {facets.price.min.toLocaleString("en-PK")} – ₨{" "}
          {facets.price.max.toLocaleString("en-PK")}
        </p>
      </form>

      {facets.sizes.length > 0 ? (
        <fieldset className="border-t border-border pt-5">
          <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Size
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((size) => {
              const active = current.size === size;
              return (
                <Link
                  key={size}
                  href={buildHref(
                    basePath,
                    preserved(current, { size: active ? undefined : size }),
                  )}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex min-w-9 items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-border bg-white text-stone-600 hover:border-brand-600 hover:text-brand-800",
                  )}
                >
                  {size}
                </Link>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {facets.colors.length > 0 ? (
        <fieldset className="border-t border-border pt-5">
          <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Colour
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {facets.colors.map((color) => {
              const active = current.color === color;
              return (
                <Link
                  key={color}
                  href={buildHref(
                    basePath,
                    preserved(current, { color: active ? undefined : color }),
                  )}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-border bg-white text-stone-600 hover:border-brand-600 hover:text-brand-800",
                  )}
                >
                  {color}
                </Link>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="border-t border-border pt-5">
        <Link
          href={buildHref(basePath, preserved(current, { sale: current.sale ? undefined : true }))}
          className={cn(
            "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
            current.sale
              ? "border-terracotta/40 bg-terracotta-soft text-terracotta"
              : "border-border bg-white text-stone-700 hover:border-terracotta/40 hover:text-terracotta",
          )}
          aria-pressed={Boolean(current.sale)}
        >
          On sale only
          <span
            className={cn(
              "grid size-4 place-items-center rounded-full border",
              current.sale ? "border-terracotta bg-terracotta text-white" : "border-stone-300",
            )}
            aria-hidden="true"
          >
            {current.sale ? <Check className="size-2.5" /> : null}
          </span>
        </Link>
      </div>
    </div>
  );
}

export function CatalogFilters(props: FilterProps) {
  const activeCount = [
    props.current.category,
    props.current.size,
    props.current.color,
    props.current.minPrice,
    props.current.maxPrice,
    props.current.sale,
  ].filter(Boolean).length;

  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-28 rounded-2xl border border-border bg-white p-5">
          <FilterPanel {...props} />
        </div>
      </aside>

      <details className="group mb-5 rounded-2xl border border-border bg-white lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-800">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {activeCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            ) : null}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-800 group-open:hidden">
            Show
          </span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-brand-800 group-open:inline">
            Hide
          </span>
        </summary>
        <div className="border-t border-border p-4">
          <FilterPanel {...props} />
        </div>
      </details>
    </>
  );
}

export function ActiveFilterChips({
  basePath,
  current,
  categories,
}: {
  basePath: string;
  current: CatalogCurrentFilters;
  categories: { name: string; slug: string }[];
}) {
  const chips: { label: string; href: string }[] = [];
  const base = { q: current.q, sort: current.sort };

  if (current.category) {
    const category = categories.find((item) => item.slug === current.category);
    chips.push({
      label: category?.name ?? current.category,
      href: buildHref(basePath, { ...base, ...current, category: undefined }),
    });
  }
  if (current.size) {
    chips.push({
      label: `Size ${current.size}`,
      href: buildHref(basePath, { ...base, ...current, size: undefined }),
    });
  }
  if (current.color) {
    chips.push({
      label: current.color,
      href: buildHref(basePath, { ...base, ...current, color: undefined }),
    });
  }
  if (current.minPrice !== undefined || current.maxPrice !== undefined) {
    chips.push({
      label: `₨ ${current.minPrice ?? 0} – ${current.maxPrice ?? "any"}`,
      href: buildHref(basePath, {
        ...base,
        ...current,
        minPrice: undefined,
        maxPrice: undefined,
      }),
    });
  }
  if (current.sale) {
    chips.push({
      label: "On sale",
      href: buildHref(basePath, { ...base, ...current, sale: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.label}>
          <Link
            href={chip.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400"
          >
            {chip.label}
            <X className="size-3 text-stone-400" aria-hidden="true" />
            <span className="sr-only">Remove filter</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
