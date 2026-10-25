import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions } from "@/db/queries/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getCategoryOptions();

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
        title="New product"
        description="Add the details, variants and photos. You can hide it from the store until it is ready."
      />

      <ProductForm
        product={null}
        categories={categories}
        cloudinaryCloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""}
        cloudinaryPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""}
      />
    </div>
  );
}
