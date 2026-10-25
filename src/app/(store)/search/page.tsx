import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { CatalogListing } from "@/components/shop/catalog-listing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCategories,
  getFilterFacets,
  getProductCards,
  quickSearchProducts,
} from "@/db/queries/catalog";
import { PRODUCTS_PER_PAGE, SORT_OPTIONS } from "@/lib/constants";
import { firstParam } from "@/lib/search-params";
import { parseInteger } from "@/lib/utils";
import type { SortOption } from "@/types/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Hunar Bazaar for lawn suits, kurtas, shawls, khussa and handmade craft.",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseSort(value: string | undefined): SortOption {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SortOption)
    : "newest";
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim() || undefined;
  const size = firstParam(sp.size) || undefined;
  const color = firstParam(sp.color) || undefined;
  const minPrice = parseInteger(firstParam(sp.minPrice));
  const maxPrice = parseInteger(firstParam(sp.maxPrice));
  const sort = parseSort(firstParam(sp.sort));
  const sale = firstParam(sp.sale) === "1";
  const page = Math.max(parseInteger(firstParam(sp.page), 1) ?? 1, 1);

  const [categories, facets, popular] = await Promise.all([
    getCategories(),
    getFilterFacets(),
    q ? Promise.resolve([]) : quickSearchProducts("", 6),
  ]);

  const result = q
    ? await getProductCards({
        q,
        size,
        color,
        minPrice,
        maxPrice,
        sort,
        onSaleOnly: sale,
        page,
        perPage: PRODUCTS_PER_PAGE,
      })
    : { items: [], total: 0, page: 1, perPage: PRODUCTS_PER_PAGE, totalPages: 1 };

  const searchForm = (
    <form action="/search" method="get" role="search" className="mt-6 flex max-w-xl gap-2">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden="true"
        />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search lawn, khussa, prayer rug…"
          aria-label="Search products"
          className="pl-10"
          autoComplete="off"
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  );

  if (!q) {
    return (
      <div className="container-page py-10 sm:py-14">
        <p className="eyebrow">Search</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-stone-900 sm:text-5xl">
          What are you looking for?
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Search by product, fabric or collection. Try “lawn”, “shawl”, “khussa” or “prayer rug”.
        </p>
        {searchForm}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold text-stone-900">Popular collections</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-border bg-white px-3.5 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-brand-600 hover:text-brand-800"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-stone-900">Popular searches</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Lawn suit", "Cotton kurta", "Pashmina shawl", "Khussa", "Prayer rug", "Jhumka"].map(
                (term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full bg-brand-50 px-3.5 py-2 text-xs font-medium text-brand-800 transition-colors hover:bg-brand-100"
                  >
                    {term}
                  </Link>
                ),
              )}
            </div>
          </section>
        </div>

        {popular.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-stone-900">Recently added</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {popular.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm transition-colors hover:border-brand-600"
                  >
                    <span className="truncate text-stone-800">{product.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {product.categoryName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <CatalogListing
      basePath="/search"
      current={{ q, size, color, minPrice, maxPrice, sort, sale }}
      facets={facets}
      categories={categories}
      result={result}
      eyebrow="Search"
      title={`Results for “${q}”`}
      description="Use the filters to narrow by collection, size, colour and price."
      header={
        <div className="border-b border-border bg-white">
          <div className="container-page py-6">{searchForm}</div>
        </div>
      }
    />
  );
}
