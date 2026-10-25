import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  MessageCircle,
  PackageCheck,
  Scissors,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductGrid } from "@/components/shop/product-card";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ReviewForm } from "@/components/shop/review-form";
import { SectionHeading } from "@/components/shop/section-heading";
import { StarRating } from "@/components/shop/star-rating";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getProductDetail, getRelatedProducts } from "@/db/queries/catalog";
import { STORE } from "@/lib/constants";
import { formatDate, formatPKR } from "@/lib/format";
import { absoluteUrl, getInitials, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductDetail(slug);

  if (!data) return { title: "Product not found" };

  const { product } = data;
  const description =
    product.shortDescription ??
    `${product.name} from Hunar Bazaar. ${formatPKR(product.basePrice)} with cash on delivery across Pakistan.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | ${STORE.name}`,
      description,
      url: `/products/${product.slug}`,
      images: product.images.map((image) => ({
        url: image.url,
        alt: image.alt ?? product.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [data, user] = await Promise.all([getProductDetail(slug), getCurrentUser()]);

  if (!data) notFound();

  const { product, reviews } = data;
  const related = await getRelatedProducts(product.category.slug, product.id, 4);

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images.map((image) => absoluteUrl(image.url)),
    brand: { "@type": "Brand", name: STORE.name },
    category: product.category.name,
    ...(product.fabric ? { material: product.fabric } : {}),
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      sku: variant.sku,
      name: `${product.name} — ${variant.color}, ${variant.size}`,
      price: variant.price,
      priceCurrency: "PKR",
      availability:
        variant.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: absoluteUrl(`/products/${product.slug}`),
      seller: { "@type": "Organization", name: STORE.name },
    })),
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating.toFixed(1)),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: STORE.siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.name,
        item: absoluteUrl(`/category/${product.category.slug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(`/products/${product.slug}`),
      },
    ],
  };

  return (
    <>
      <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />

      <div className="container-page py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link href="/" className="hover:text-stone-900">
            Home
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <Link href="/categories" className="hover:text-stone-900">
            Collections
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <Link href={`/category/${product.category.slug}`} className="hover:text-stone-900">
            {product.category.name}
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="max-w-[14rem] truncate text-stone-700" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.02fr_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery
              images={product.images}
              name={product.name}
              compareAtPrice={product.compareAtPrice}
              basePrice={product.basePrice}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/category/${product.category.slug}`}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700 hover:underline"
              >
                {product.category.name}
              </Link>
              {product.isNewArrival ? (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
                  New in
                </span>
              ) : null}
              {product.isFeatured ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Bestseller
                </span>
              ) : null}
            </div>

            <h1 className="mt-2 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating
                rating={product.rating}
                count={product.reviewCount}
                size={14}
                showValue
              />
              <a href="#reviews" className="text-xs font-medium text-brand-700 hover:underline">
                Read reviews
              </a>
              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
            </div>

            {product.shortDescription ? (
              <p className="mt-4 text-sm leading-relaxed text-stone-600">
                {product.shortDescription}
              </p>
            ) : null}

            <ProductPurchase product={product} />

            <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-white">
              <details open className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-stone-900">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="size-4 text-brand-700" aria-hidden="true" /> Description
                  </span>
                  <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <p className="prose-store mt-3 whitespace-pre-line text-[13px]">
                  {product.description}
                </p>
              </details>

              <details className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-stone-900">
                  <span className="inline-flex items-center gap-2">
                    <Scissors className="size-4 text-brand-700" aria-hidden="true" /> Fabric & care
                  </span>
                  <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Fabric
                    </dt>
                    <dd className="mt-0.5 text-stone-700">{product.fabric ?? "See description"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Care
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-line text-stone-700">
                      {product.careInstructions ??
                        "Gentle wash separately. Dry in shade. Warm iron on reverse."}
                    </dd>
                  </div>
                </dl>
              </details>

              <details className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-stone-900">
                  <span className="inline-flex items-center gap-2">
                    <Truck className="size-4 text-brand-700" aria-hidden="true" /> Delivery & returns
                  </span>
                  <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <div className="prose-store mt-3 text-[13px]">
                  <p>
                    Standard courier delivery in 3–5 working days for ₨ 250, free on orders over
                    ₨ 5,000. Express delivery is available in major cities for ₨ 500.
                  </p>
                  <p>
                    Unworn, unwashed items with tags can be returned or exchanged within 7 days of
                    delivery. Read the full{" "}
                    <Link href="/pages/returns" className="text-brand-700 underline">
                      returns policy
                    </Link>
                    .
                  </p>
                </div>
              </details>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-stone-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand-700" aria-hidden="true" /> Quality checked
              </li>
              <li className="flex items-center gap-2">
                <PackageCheck className="size-4 text-brand-700" aria-hidden="true" /> COD nationwide
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="size-4 text-brand-700" aria-hidden="true" /> WhatsApp support
              </li>
              <li className="flex items-center gap-2">
                <Truck className="size-4 text-brand-700" aria-hidden="true" /> Tracked delivery
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section id="reviews" className="border-y border-border bg-white py-12 sm:py-16">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <p className="eyebrow">Customer reviews</p>
              <h2 className="mt-2 font-display text-3xl text-stone-900">
                What customers say
              </h2>
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-[#fcfaf5] p-5">
                <div className="text-center">
                  <p className="font-display text-4xl text-stone-900">
                    {product.reviewCount > 0 ? product.rating.toFixed(1) : "—"}
                  </p>
                  <StarRating rating={product.rating} size={12} />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingCounts.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="w-3 text-right">{row.stars}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{
                            width: `${reviews.length ? (row.count / reviews.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-4">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {user ? (
                <div className="mt-5">
                  <ReviewForm productId={product.id} />
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-border bg-[#fcfaf5] p-5 text-center">
                  <p className="font-display text-lg text-stone-900">Bought this piece?</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Sign in to leave a review and help other shoppers choose well.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/products/${product.slug}`)}`}>
                      Sign in to review
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <div>
              {reviews.length > 0 ? (
                <ul className="divide-y divide-border">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-5 first:pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-800">
                            {getInitials(review.authorName)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-stone-900">
                              {review.authorName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Verified customer · {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size={12} />
                      </div>
                      {review.title ? (
                        <p className="mt-3 font-display text-lg leading-snug text-stone-900">
                          {review.title}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">
                        {review.body}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="font-display text-xl text-stone-900">No reviews yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Be the first to share how this piece felt in person.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-900">
                <span>Questions about fabric, fit or delivery?</span>
                <a
                  href={whatsappLink(`Assalam-o-Alaikum! I have a question about "${product.name}".`)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-2"
                >
                  Message us on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="container-page py-12 sm:py-16">
          <SectionHeading
            eyebrow="You may also like"
            title={`More from ${product.category.name}`}
            href={`/category/${product.category.slug}`}
            linkLabel="Shop the collection"
          />
          <div className="mt-7">
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}
    </>
  );
}
