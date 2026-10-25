import { Compass, PackageSearch } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <PackageSearch aria-hidden="true" className="size-7" />
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700">
        404 — Page not found
      </p>
      <h1 className="mt-3 font-display text-3xl text-stone-900 sm:text-4xl">
        This page has wandered off the bazaar
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The page you are looking for may have moved, or the product is no longer available. Explore
        the collections below instead.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/products">
            <Compass aria-hidden="true" />
            Browse all products
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
