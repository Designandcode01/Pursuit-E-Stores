import type { Metadata } from "next";

import { CatalogListing } from "@/components/shop/catalog-listing";
import type { CatalogCurrentFilters } from "@/components/shop/catalog-filters";
import { getCategories, getFilterFacets, getProductCards } from "@/db/queries/catalog";
import { PRODUCTS_PER_PAGE, SORT_OPTIONS } from "@/lib/constants";
import { firstParam } from "@/lib/search-params";
import { parseInteger } from "@/lib/utils";
import type { SortOption } from "@/types/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop all products",
  description:
    "Browse lawn suits, kurtas, shawls, khussa, prayer rugs and handmade Pakistani craft. Filter by size, colour and price. Cash on delivery nationwide.",
  alternates: { canonical: "/products" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseSort(value: string | undefined): SortOption {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SortOption)
    : "newest";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const q = firstParam(sp.q)?.trim() || undefined;
  const category = firstParam(sp.category) || undefined;
  const size = firstParam(sp.size) || undefined;
  const color = firstParam(sp.color) || undefined;
  const minPrice = parseInteger(firstParam(sp.minPrice));
  const maxPrice = parseInteger(firstParam(sp.maxPrice));
  const sort = parseSort(firstParam(sp.sort));
  const sale = firstParam(sp.sale) === "1";
  const page = Math.max(parseInteger(firstParam(sp.page), 1) ?? 1, 1);

  const current: CatalogCurrentFilters = {
    q,
    category,
    size,
    color,
    minPrice,
    maxPrice,
    sort,
    sale,
  };

  const [result, facets, categories] = await Promise.all([
    getProductCards({
      category,
      size,
      color,
      minPrice,
      maxPrice,
      q,
      sort,
      onSaleOnly: sale,
      page,
      perPage: PRODUCTS_PER_PAGE,
    }),
    getFilterFacets(),
    getCategories(),
  ]);

  const title = q
    ? `Search results for “${q}”`
    : sale
      ? "The sale edit"
      : category
        ? (categories.find((item) => item.slug === category)?.name ?? "Products")
        : "All products";

  const description = sale
    ? "Final-run pieces and samples at kinder prices. Limited quantities, no restocks."
    : q
      ? `Pieces matching “${q}” across our lawn, menswear, shawls, footwear and home collections.`
      : "Small-batch Pakistani pieces for everyday wear and celebrations. Every price is in PKR, with COD available nationwide.";

  return (
    <CatalogListing
      basePath="/products"
      current={current}
      facets={facets}
      categories={categories}
      result={result}
      eyebrow={sale ? "Last pieces" : "The catalogue"}
      title={title}
      description={description}
    />
  );
}
