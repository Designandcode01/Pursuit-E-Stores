"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront] Unhandled error", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
        <TriangleAlert aria-hidden="true" className="size-7" />
      </span>
      <h1 className="mt-6 font-display text-3xl text-stone-900 sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        We could not load this page. Please try again — if the problem continues, message us on
        WhatsApp and we will help you straight away.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-muted-foreground/80">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
