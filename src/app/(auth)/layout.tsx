import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-brand-900 p-12 text-[#f8f2e6] lg:flex lg:flex-col lg:justify-between">
        <div className="jaali absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative z-10">
          <BrandMark inverted />
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a7c9b1]">
            Welcome to Pursuit E-Store
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05]">
            The everyday elegance of Pakistan, saved to your account.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-[#cfdac9]">
            Track orders, save addresses and keep a wishlist across devices. Cash on delivery is
            available on every order, nationwide.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4 text-xs text-[#a7c9b1]">
          <span>₨ Prices in PKR</span>
          <span aria-hidden="true">·</span>
          <span>COD across Pakistan</span>
          <span aria-hidden="true">·</span>
          <span>WhatsApp support</span>
        </div>
      </section>
      <section className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 lg:hidden">
          <BrandMark />
        </div>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/pages/terms" className="underline underline-offset-2 hover:text-stone-900">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/pages/privacy" className="underline underline-offset-2 hover:text-stone-900">
            privacy policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
