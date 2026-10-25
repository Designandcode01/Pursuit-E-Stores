import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminFlash } from "@/components/admin/admin-flash";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { getAdminProduct, getCategoryOptions } from "@/db/queries/admin";
import { firstParam } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [product, categories] = await Promise.all([getAdminProduct(id), getCategoryOptions()]);

  if (!product) notFound();

  const productSlug = firstParam(query.slug);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to products
      </Link>

      <PageHeader
        title={product.name}
        description={`SKU ${product.sku} · ${product.variants.length} variant${
          product.variants.length === 1 ? "" : "s"
        }`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/products/${productSlug ?? product.slug}`} target="_blank">
              <ExternalLink aria-hidden="true" />
              View in store
            </Link>
          </Button>
        }
      />

      <AdminFlash params={query} />

      <ProductForm
        product={product}
        categories={categories}
        cloudinaryCloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""}
        cloudinaryPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""}
      />
    </div>
  );
}
