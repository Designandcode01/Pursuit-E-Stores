import { ExternalLink, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { deleteProductAction, setProductFlagAction } from "@/actions/admin";
import { AdminFlash } from "@/components/admin/admin-flash";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { getAdminProducts, getCategoryOptions } from "@/db/queries/admin";
import { formatNumber, formatPKR } from "@/lib/format";
import { firstParam } from "@/lib/search-params";
import { Pagination } from "@/components/shop/pagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Products" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const category = firstParam(params.category) ?? "";
  const statusParam = firstParam(params.status);
  const status = statusParam === "active" || statusParam === "inactive" ? statusParam : "all";
  const page = Math.max(Number(firstParam(params.page) ?? 1) || 1, 1);

  const [result, categories] = await Promise.all([
    getAdminProducts({ q, category, status, page }),
    getCategoryOptions(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Manage the catalogue, pricing, variants and stock levels."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus aria-hidden="true" />
              New product
            </Link>
          </Button>
        }
      />

      <AdminFlash params={params} />

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <div>
          <label htmlFor="product-search" className="text-xs font-semibold text-stone-700">
            Search
          </label>
          <div className="relative mt-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="product-search"
              name="q"
              defaultValue={q}
              placeholder="Name or SKU"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label htmlFor="product-category" className="text-xs font-semibold text-stone-700">
            Category
          </label>
          <NativeSelect id="product-category" name="category" defaultValue={category} className="mt-1">
            <option value="">All categories</option>
            {categories.map((option) => (
              <option key={option.id} value={option.slug}>
                {option.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div>
          <label htmlFor="product-status" className="text-xs font-semibold text-stone-700">
            Status
          </label>
          <NativeSelect id="product-status" name="status" defaultValue={status} className="mt-1">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Hidden</option>
          </NativeSelect>
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Filter
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/products">Reset</Link>
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        {formatNumber(result.total)} product{result.total === 1 ? "" : "s"} found
        {q ? ` for “${q}”` : ""}.
      </p>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {result.items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-xl text-stone-900">No products match these filters</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try clearing the search, or add a new product.
            </p>
            <Button asChild className="mt-5" size="sm">
              <Link href="/admin/products/new">
                <Plus aria-hidden="true" />
                Add a product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Visibility
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {result.items.map((product) => (
                  <tr key={product.id} className="align-top hover:bg-stone-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-stone-100">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="line-clamp-2 font-semibold text-stone-900 hover:text-brand-700"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {product.sku} · {product.variantCount} variant
                            {product.variantCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{product.categoryName}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-900">{formatPKR(product.basePrice)}</p>
                      {product.compareAtPrice ? (
                        <p className="text-[11px] text-muted-foreground line-through">
                          {formatPKR(product.compareAtPrice)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          product.totalStock === 0
                            ? "red"
                            : product.totalStock < 20
                              ? "amber"
                              : "green"
                        }
                      >
                        {product.totalStock === 0 ? "Sold out" : `${product.totalStock} units`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <form action={setProductFlagAction}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="flag" value="isActive" />
                          <input
                            type="hidden"
                            name="value"
                            value={product.isActive ? "false" : "true"}
                          />
                          <button type="submit" className="cursor-pointer">
                            <Badge variant={product.isActive ? "green" : "secondary"}>
                              {product.isActive ? "Live" : "Hidden"}
                            </Badge>
                          </button>
                        </form>

                        <form action={setProductFlagAction}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="flag" value="isFeatured" />
                          <input
                            type="hidden"
                            name="value"
                            value={product.isFeatured ? "false" : "true"}
                          />
                          <button type="submit" className="cursor-pointer" title="Toggle featured">
                            <Badge variant={product.isFeatured ? "terracotta" : "outline"}>
                              <Star aria-hidden="true" className="size-2.5" />
                              {product.isFeatured ? "Featured" : "Feature"}
                            </Badge>
                          </button>
                        </form>

                        {product.isNewArrival ? <Badge variant="blue">New</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          aria-label={`View ${product.name} in the store`}
                        >
                          <ExternalLink aria-hidden="true" className="size-3.5" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil aria-hidden="true" className="size-3.5" />
                        </Link>
                        <ConfirmForm
                          action={deleteProductAction}
                          message={`Delete “${product.name}”? This also removes its variants, images and reviews.`}
                        >
                          <input type="hidden" name="productId" value={product.id} />
                          <button
                            type="submit"
                            className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </ConfirmForm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        basePath="/admin/products"
        params={{ q, category, status: status === "all" ? undefined : status }}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
