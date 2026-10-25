import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  HeartHandshake,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { EmptyState } from "@/components/shop/empty-state";
import { ProductGrid } from "@/components/shop/product-card";
import { SectionHeading } from "@/components/shop/section-heading";
import { StarRating } from "@/components/shop/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategories, getProductCards, getStoreTestimonials } from "@/db/queries/catalog";
import { FREE_SHIPPING_THRESHOLD, STORE } from "@/lib/constants";
import { formatPKR } from "@/lib/format";
import { absoluteUrl, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pursuit E-Store — Pakistani lawn, kurtas, shawls & handmade craft",
  description:
    "Shop unstitched lawn suits, cotton kurtas, pashmina shawls, Multani khussa, prayer rugs and handmade Pakistani craft. Cash on delivery nationwide.",
  alternates: { canonical: "/" },
};

const trustPoints = [
  {
    icon: Banknote,
    title: "Cash on delivery",
    body: "Pay when your parcel arrives — anywhere in Pakistan.",
  },
  {
    icon: Truck,
    title: "Free delivery over ₨ 5,000",
    body: "Standard courier delivery in 3–5 working days.",
  },
  {
    icon: PackageCheck,
    title: "Easy 7-day returns",
    body: "Unworn, unwashed items can be exchanged or returned.",
  },
  {
    icon: HeartHandshake,
    title: "WhatsApp support",
    body: "Real people in Lahore, Monday to Saturday.",
  },
];

export default async function HomePage() {
  const [categories, featured, newArrivals, saleItems, testimonials] = await Promise.all([
    getCategories(),
    getProductCards({ featuredOnly: true, perPage: 8, sort: "popular" }),
    getProductCards({ newArrivalsOnly: true, perPage: 4, sort: "newest" }),
    getProductCards({ onSaleOnly: true, perPage: 4, sort: "popular" }),
    getStoreTestimonials(3),
  ]);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: STORE.name,
    url: STORE.siteUrl,
    logo: absoluteUrl("/og.jpg"),
    description: STORE.description,
    email: STORE.email,
    telephone: STORE.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lahore",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    sameAs: [STORE.instagram],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: STORE.name,
    url: STORE.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${STORE.siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={[organization, website]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#123b27] text-[#f7f0df]">
        <div className="jaali absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 -top-32 size-136 rounded-full bg-[#d97706]/10 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7e6d5]">
              <Sparkles className="size-3.5 text-[#f0b45c]" aria-hidden="true" />
              Crafted in Pakistan
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.03] tracking-tight sm:text-6xl lg:text-[4.1rem]">
              Everyday elegance,
              <span className="block text-[#cfe3cd]">made by hand.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#cfdac9] sm:text-base">
              Lawn for Lahore summers, pashmina for Murree winters and khussa for every
              celebration. A small label from Pakistan, delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[#f4ead8] text-brand-900 hover:bg-white"
              >
                <Link href="/products?sort=newest">
                  Shop new arrivals
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-[#f7f0df] hover:border-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/categories">Explore collections</Link>
              </Button>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6 text-xs text-[#b9c9b6]">
              <div>
                <dt className="font-display text-2xl text-[#f7f0df]">20+</dt>
                <dd className="mt-0.5">Small-batch pieces</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-[#f7f0df]">COD</dt>
                <dd className="mt-0.5">Nationwide</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-[#f7f0df]">7 days</dt>
                <dd className="mt-0.5">Easy returns</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl border border-white/15 shadow-2xl shadow-black/30">
              <Image
                src="/hero.jpg"
                alt="Hunar Bazaar edit of lawn, shawls, khussa and prayer rugs"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 44vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c2a1b]/60 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 left-2 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0f3323]/95 p-3 pr-4 shadow-xl backdrop-blur sm:left-6">
              <span className="grid size-10 place-items-center rounded-full bg-[#f4ead8] text-brand-900">
                <BadgeCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#f7f0df]">
                  Free delivery over {formatPKR(FREE_SHIPPING_THRESHOLD)}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[#a9c0a7]">
                  Standard courier · Pakistan-wide
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Why shop with Hunar Bazaar" className="border-b border-border bg-white">
        <div className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-7 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                <point.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-stone-900">{point.title}</p>
                <p className="mt-0.5 hidden text-[11px] leading-relaxed text-muted-foreground sm:block">
                  {point.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-14 sm:py-20">
        <SectionHeading
          eyebrow="Shop by collection"
          title="Six collections, one Pakistani wardrobe"
          description="From unstitched lawn to hand-embroidered khussa — each piece is chosen for the way we actually dress."
          href="/categories"
          linkLabel="All collections"
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-sand"
            >
              <div className="relative aspect-[4/3] w-full">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    priority={index < 3}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/75 via-[#1c1917]/10 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="font-display text-lg leading-tight text-white sm:text-xl">
                  {category.name}
                </h3>
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors group-hover:text-white">
                  Explore
                  <ArrowRight className="size-3" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="border-y border-border bg-white py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="The Hunar edit"
            title="Loved by our customers"
            description="The pieces our customers keep coming back for, chosen by our team in Lahore."
            href="/products?sort=popular"
            linkLabel="Shop bestsellers"
          />
          <div className="mt-8">
            {featured.items.length > 0 ? (
              <ProductGrid products={featured.items} />
            ) : (
              <EmptyState
                title="The edit is being restocked"
                description="Our next drop is on its way. Browse the full catalogue in the meantime."
                action={
                  <Button asChild>
                    <Link href="/products">Shop all products</Link>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container-page py-14 sm:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="relative order-2 overflow-hidden rounded-3xl lg:order-1">
            <div className="relative aspect-[5/4]">
              <Image
                src="/categories/shawls-dupattas.webp"
                alt="Handwoven shawls and dupattas from Hunar Bazaar"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/92 p-4 backdrop-blur sm:left-auto sm:right-5 sm:w-64">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                Our promise
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-stone-700">
                Honest fabric, fair prices and photographs that match what arrives at your door.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="eyebrow">The Hunar story</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-stone-900 sm:text-4xl">
              Made slowly, worn for years
            </h2>
            <div className="prose-store mt-5 text-sm sm:text-[15px]">
              <p>
                Hunar means craft. We started with a simple frustration: beautiful Pakistani
                textiles were hard to buy online without guessing the fabric, the colour or the
                fit.
              </p>
              <p>
                So we work in small batches with weavers in Multan, embroiderers in Lahore and
                leatherworkers in Kasur. Every listing tells you the fabric, the care and the
                measurements — and if something is not right, our WhatsApp line is answered by a
                person, not a bot.
              </p>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, text: "Secure checkout, no hidden charges" },
                { icon: BadgeCheck, text: "Quality checked before dispatch" },
                { icon: Truck, text: "Tracked courier across Pakistan" },
                { icon: HeartHandshake, text: "Support in English and Urdu" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-2.5 text-[13px] text-stone-700">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                  {item.text}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-7">
              <Link href="/pages/about">
                Read our story
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="border-y border-border bg-[#f6f1e6] py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Just in"
            title="New this week"
            description="Fresh cuts, new prints and a few pieces made in very small numbers."
            href="/products?sort=newest"
            linkLabel="All new arrivals"
          />
          <div className="mt-8">
            <ProductGrid products={newArrivals.items} />
          </div>
        </div>
      </section>

      {/* Sale band */}
      <section className="container-page py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#7c2d12] px-6 py-10 text-[#fdf3e7] sm:px-10 sm:py-12">
          <div className="pattern-arches absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f6c89b]">
                End of season
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
                Last pieces, kinder prices
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#f3d9c2]">
                A short edit of samples and final-run pieces. Once they are gone, they are gone —
                no restocks, no waiting lists.
              </p>
              <Button asChild className="mt-6 bg-[#f4ead8] text-[#7c2d12] hover:bg-white">
                <Link href="/products?sale=1">
                  Shop the sale
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {saleItems.items.slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 transition-colors hover:bg-white/15"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#5c1f0d]">
                    {product.image ? (
                      <Image
                        src={product.image.url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
                      {product.name}
                    </p>
                    <p className="mt-1 text-[11px] text-[#f3d9c2]">
                      {formatPKR(product.basePrice)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section className="border-y border-border bg-white py-14 sm:py-20">
          <div className="container-page">
            <SectionHeading
              eyebrow="From our customers"
              title="Kind words, real orders"
              description="Reviews are left by signed-in customers and published after moderation."
              align="center"
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((review) => (
                <figure
                  key={review.id}
                  className="flex h-full flex-col rounded-2xl border border-border bg-[#fcfaf5] p-5"
                >
                  <StarRating rating={review.rating} size={13} />
                  {review.title ? (
                    <blockquote className="mt-3 flex-1">
                      <p className="font-display text-lg leading-snug text-stone-900">
                        “{review.title}”
                      </p>
                      <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-muted-foreground">
                        {review.body}
                      </p>
                    </blockquote>
                  ) : (
                    <blockquote className="mt-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                      {review.body}
                    </blockquote>
                  )}
                  <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5">
                    <span className="text-xs font-semibold text-stone-800">
                      {review.authorName}
                    </span>
                    <Link
                      href={`/products/${review.productSlug}`}
                      className="max-w-[10rem] truncate text-[11px] text-brand-700 hover:underline"
                    >
                      {review.productName}
                    </Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* WhatsApp CTA */}
      <section className="container-page py-14 sm:py-20">
        <div className="grid items-center gap-6 rounded-3xl border border-brand-200 bg-brand-50 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Badge variant="green" className="mb-3">
              <Star className="size-3" aria-hidden="true" /> Personal styling
            </Badge>
            <h2 className="font-display text-2xl leading-tight text-stone-900 sm:text-3xl">
              Not sure which size or colour?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
              Send us a photo or a question on WhatsApp. We will help you choose the right piece,
              check stock and arrange delivery — usually within the hour during store hours.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild size="lg" className="bg-[#128c7e] hover:bg-[#0f766e]">
              <a
                href={whatsappLink("Assalam-o-Alaikum! I would like help choosing a product.")}
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white">
              <Link href="/pages/contact">Contact & store hours</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
