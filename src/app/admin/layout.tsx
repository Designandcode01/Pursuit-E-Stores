import { ExternalLink, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminMobileNav, AdminNav } from "@/components/admin/admin-nav";
import { BrandMark } from "@/components/layout/brand-mark";
import { getPendingReviewsCount } from "@/db/queries/admin";
import { getAdminUser, getSession, displayName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Hunar Bazaar Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await getSession();
  if (!userId) redirect("/sign-in?redirect_url=/admin");

  const admin = await getAdminUser();
  if (!admin) redirect("/?forbidden=admin");

  const pendingReviews = await getPendingReviewsCount().catch(() => 0);

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="hidden w-60 shrink-0 border-r border-stone-200/80 bg-white lg:block print:hidden">
          <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
            <div className="px-2">
              <BrandMark />
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-800">
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              Admin workspace
            </div>

            <div className="mt-4 flex-1 overflow-y-auto">
              <AdminNav pendingReviews={pendingReviews} />
            </div>

            <div className="mt-4 border-t border-stone-200 pt-4">
              <p className="px-2 text-[11px] text-muted-foreground">Signed in as</p>
              <p className="truncate px-2 text-sm font-semibold text-stone-800">
                {displayName(admin)}
              </p>
              <Link
                href="/"
                className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                View storefront
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
            <div className="flex items-center justify-between gap-3">
              <BrandMark compact />
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-600"
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                Store
              </Link>
            </div>
            <div className="mt-3">
              <AdminMobileNav />
            </div>
          </header>

          <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
