import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { STORE } from "@/lib/constants";

/**
 * Brand glyphs live inline: lucide-react no longer ships social logos.
 */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.5 21v-7h2.6l.5-3h-3.1V9.2c0-.9.3-1.5 1.6-1.5H18V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.3-3.8 3.8V11H9.5v3H12v7" />
    </svg>
  );
}

export function SiteFooter({ categories }: { categories: { name: string; slug: string }[] }) {
  return (
    <footer className="mt-20 border-t border-[#2a241d] bg-[#1f2a23] text-[#e9e2d3]">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandMark inverted />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#c8c2b4]">
              A small Pakistani label celebrating lawn, craft and everyday elegance. Every order
              is packed with care from Lahore and delivered across Pakistan.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <a
                href={STORE.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Hunar Bazaar on Instagram"
                className="grid size-9 place-items-center rounded-full border border-white/15 text-[#e9e2d3] transition-colors hover:border-white/40 hover:bg-white/10"
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Hunar Bazaar on Facebook"
                className="grid size-9 place-items-center rounded-full border border-white/15 text-[#e9e2d3] transition-colors hover:border-white/40 hover:bg-white/10"
              >
                <FacebookIcon className="size-4" />
              </a>
              <a
                href={`mailto:${STORE.email}`}
                aria-label="Email Hunar Bazaar"
                className="grid size-9 place-items-center rounded-full border border-white/15 text-[#e9e2d3] transition-colors hover:border-white/40 hover:bg-white/10"
              >
                <Mail className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9db5a4]">
              Shop
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="text-[#d8d1c3] hover:text-white">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/products?sort=newest" className="text-[#d8d1c3] hover:text-white">
                  New arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?sale=1" className="text-[#d8d1c3] hover:text-white">
                  Sale
                </Link>
              </li>
              {categories.slice(0, 4).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-[#d8d1c3] hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9db5a4]">
              Help
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/pages/shipping" className="text-[#d8d1c3] hover:text-white">
                  Shipping & delivery
                </Link>
              </li>
              <li>
                <Link href="/pages/returns" className="text-[#d8d1c3] hover:text-white">
                  Returns & exchanges
                </Link>
              </li>
              <li>
                <Link href="/pages/size-guide" className="text-[#d8d1c3] hover:text-white">
                  Size guide
                </Link>
              </li>
              <li>
                <Link href="/pages/privacy" className="text-[#d8d1c3] hover:text-white">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/pages/terms" className="text-[#d8d1c3] hover:text-white">
                  Terms of service
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9db5a4]">
              Visit & contact
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-[#d8d1c3]">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#9db5a4]" aria-hidden="true" />
                <span>Gulberg III, Lahore, Punjab, Pakistan</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#9db5a4]" aria-hidden="true" />
                <a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="hover:text-white">
                  {STORE.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#9db5a4]" aria-hidden="true" />
                <a href={`mailto:${STORE.email}`} className="hover:text-white">
                  {STORE.email}
                </a>
              </li>
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-[#a9a294]">
              Customer care: Mon–Sat, 10am–7pm PKT. WhatsApp is the fastest way to reach us.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-[#a9a294] sm:flex-row sm:items-center sm:justify-between">
          <p>Â© {new Date().getFullYear()} Pursuit E-Store. All prices in PKR. Made in Pakistan.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#8f9d93]">We accept</span>
            {["Cash on Delivery", "Bank transfer", "JazzCash", "Easypaisa"].map((method) => (
              <span
                key={method}
                className="rounded border border-white/15 px-2 py-1 text-[10px] font-medium text-[#d8d1c3]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
