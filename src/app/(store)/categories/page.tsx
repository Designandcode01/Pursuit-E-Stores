import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCategories } from "@/db/queries/catalog";
import { STORE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore Hunar Bazaar collections: women's lawn and pret, menswear, shawls and dupattas, footwear, prayer and home, and handmade jewellery.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground">
        <Link href="/" className="hover:text-stone-900">
          Home
        </Link>
        <span className="mx-1.5" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Collections</span>
      </nav>

      <div className="mt-5 max-w-2xl">
        <p className="eyebrow">Shop by collection</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-stone-900 sm:text-5xl">
          A wardrobe, built piece by piece
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          Six small collections, each chosen for Pakistani weather, weddings and everyday wear.
          Every price is in PKR and cash on delivery is available nationwide.
        </p>
      </div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2">
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-sand">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  priority={index < 2}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/40 to-transparent" />
            </div>
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
              <div>
                <h2 className="font-display text-2xl leading-tight text-stone-900">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                ) : null}
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800">
                  Shop collection
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-white p-6 text-center sm:p-8">
        <h2 className="font-display text-2xl text-stone-900">Looking for something specific?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Search the full catalogue or message us on WhatsApp at {STORE.phone}. We are happy to
          check stock, measurements or delivery timelines.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-full bg-brand-700 px-6 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Shop all products
          </Link>
          <Link
            href="/pages/contact"
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-stone-700 hover:border-brand-700 hover:text-brand-800"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
