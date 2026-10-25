import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { CatalogListing } from "@/components/shop/catalog-listing";
import type { CatalogCurrentFilters } from "@/components/shop/catalog-filters";
import {
  getCategories,
  getCategoryBySlug,
  getFilterFacets,
  getProductCards,
} from "@/db/queries/catalog";
import { PRODUCTS_PER_PAGE, SORT_OPTIONS, STORE } from "@/lib/constants";
import { firstParam } from "@/lib/search-params";
import { parseInteger } from "@/lib/utils";
import type { SortOption } from "@/types/commerce";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseSort(value: string | undefined): SortOption {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SortOption)
    : "newest";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "Collection not found" };

  return {
    title: category.name,
    description:
      category.description ??
      `Shop ${category.name} from Hunar Bazaar. Cash on delivery across Pakistan.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${category.name} | ${STORE.name}`,
      description:
        category.description ??
        `Shop ${category.name} from Hunar Bazaar. Cash on delivery across Pakistan.`,
      url: `/category/${category.slug}`,
      images: category.imageUrl ? [{ url: category.imageUrl }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const size = firstParam(sp.size) || undefined;
  const color = firstParam(sp.color) || undefined;
  const minPrice = parseInteger(firstParam(sp.minPrice));
  const maxPrice = parseInteger(firstParam(sp.maxPrice));
  const sort = parseSort(firstParam(sp.sort));
  const sale = firstParam(sp.sale) === "1";
  const page = Math.max(parseInteger(firstParam(sp.page), 1) ?? 1, 1);

  const current: CatalogCurrentFilters = {
    size,
    color,
    minPrice,
    maxPrice,
    sort,
    sale,
  };

  const [result, facets, categories] = await Promise.all([
    getProductCards({
      category: category.slug,
      size,
      color,
      minPrice,
      maxPrice,
      sort,
      onSaleOnly: sale,
      page,
      perPage: PRODUCTS_PER_PAGE,
    }),
    getFilterFacets(),
    getCategories(),
  ]);

  const header = (
    <section className="relative overflow-hidden bg-[#123b27] text-[#f7f0df]">
      <div className="jaali absolute inset-0 opacity-40" aria-hidden="true" />
      {category.imageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={category.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f3323] via-[#0f3323]/85 to-[#0f3323]/40" />
        </div>
      ) : null}
      <div className="container-page relative py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-[#b9c9b6]">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <Link href="/categories" className="hover:text-white">
            Collections
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="text-white/80" aria-current="page">
            {category.name}
          </span>
        </nav>
        <h1 className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] sm:text-5xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#cfdac9] sm:text-[15px]">
            {category.description}
          </p>
        ) : null}
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d7e6d5]">
          {result.total} {result.total === 1 ? "piece" : "pieces"} · Cash on delivery
        </p>
      </div>
    </section>
  );

  return (
    <CatalogListing
      basePath={`/category/${category.slug}`}
      current={current}
      facets={facets}
      categories={categories}
      result={result}
      title={category.name}
      description={category.description ?? undefined}
      header={header}
      hideCategoryFilter
      hideHeading
    />
  );
}
