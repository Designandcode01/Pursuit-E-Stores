import { Pencil, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { deleteCategoryAction } from "@/actions/admin";
import { AdminFlash } from "@/components/admin/admin-flash";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { getAdminCategories } from "@/db/queries/admin";
import { firstParam } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const editId = firstParam(params.edit);
  const categories = await getAdminCategories();
  const editing = editId ? categories.find((category) => category.id === editId) ?? null : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description="Categories power the storefront navigation and SEO-friendly /category URLs."
      />

      <AdminFlash params={params} />

      <CategoryForm
        category={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                slug: editing.slug,
                description: editing.description,
                imageUrl: editing.imageUrl,
                sortOrder: editing.sortOrder,
                isActive: editing.isActive,
              }
            : null
        }
      />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-lg text-stone-900">All categories</h2>
          <p className="text-xs text-muted-foreground">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} · sorted by sort order.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-5 py-2.5 font-semibold">
                  Products
                </th>
                <th scope="col" className="px-5 py-2.5 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-stone-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900">{category.name}</p>
                        <p className="text-[11px] text-muted-foreground">/category/{category.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-stone-600">{category.productCount}</td>
                  <td className="px-5 py-3">
                    <Badge variant={category.isActive ? "green" : "secondary"}>
                      {category.isActive ? "Visible" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/categories?edit=${category.id}`}
                        className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil aria-hidden="true" className="size-3.5" />
                      </Link>
                      <ConfirmForm
                        action={deleteCategoryAction}
                        message={`Delete “${category.name}”? Categories with products cannot be deleted.`}
                      >
                        <input type="hidden" name="categoryId" value={category.id} />
                        <button
                          type="submit"
                          className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${category.name}`}
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
      </div>
    </div>
  );
}
