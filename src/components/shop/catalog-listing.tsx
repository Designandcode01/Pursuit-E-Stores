import type { ReactNode } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";

import {
  ActiveFilterChips,
  CatalogFilters,
  type CatalogCurrentFilters,
  type CatalogFacets,
} from "@/components/shop/catalog-filters";
import { EmptyState } from "@/components/shop/empty-state";
import { Pagination } from "@/components/shop/pagination";
import { ProductGrid } from "@/components/shop/product-card";
import { SortSelect } from "@/components/shop/sort-select";
import { Button } from "@/components/ui/button";
import type { ProductCardData } from "@/types/commerce";

type ListingResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export function CatalogListing({
  basePath,
  current,
  facets,
  categories,
  result,
  title,
  description,
  eyebrow,
  header,
  hideCategoryFilter = false,
  hideHeading = false,
}: {
  basePath: string;
  current: CatalogCurrentFilters;
  facets: CatalogFacets;
  categories: { name: string; slug: string }[];
  result: ListingResult;
  title: string;
  description?: string;
  eyebrow?: string;
  header?: ReactNode;
  hideCategoryFilter?: boolean;
  hideHeading?: boolean;
}) {
  const params = {
    q: current.q,
    category: current.category,
    size: current.size,
    color: current.color,
    minPrice: current.minPrice,
    maxPrice: current.maxPrice,
    sort: current.sort,
    sale: current.sale,
  };

  const start = result.total === 0 ? 0 : (result.page - 1) * result.perPage + 1;
  const end = Math.min(result.page * result.perPage, result.total);

  return (
    <>
      {header}
      <div className="container-page py-10 sm:py-14">
        {!hideHeading ? (
          <div className="max-w-2xl">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1 className="mt-2 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <CatalogFilters
            basePath={basePath}
            current={current}
            facets={facets}
            categories={hideCategoryFilter ? [] : categories}
            hideCategoryFilter={hideCategoryFilter}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {result.total === 0
                  ? "No products found"
                  : `Showing ${start}–${end} of ${result.total} products`}
              </p>
              <SortSelect value={current.sort ?? "newest"} />
            </div>

            <ActiveFilterChips basePath={basePath} current={current} categories={categories} />

            {result.items.length > 0 ? (
              <>
                <ProductGrid products={result.items} className="mt-4" />
                <Pagination
                  basePath={basePath}
                  params={params}
                  page={result.page}
                  totalPages={result.totalPages}
                />
              </>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={<PackageSearch className="size-6" aria-hidden="true" />}
                  title={current.q ? `No matches for “${current.q}”` : "Nothing here yet"}
                  description={
                    current.q
                      ? "Try a broader search term, or remove a filter. Our team can also help you find a piece on WhatsApp."
                      : "Try removing a filter or explore the full catalogue."
                  }
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button asChild>
                        <Link href="/products">Shop all products</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/categories">Browse collections</Link>
                      </Button>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
