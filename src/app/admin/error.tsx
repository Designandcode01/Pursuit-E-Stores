"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] Unhandled error", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <h1 className="font-display text-2xl text-stone-900">Something went wrong in the admin</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        The action could not be completed. Try again, and check the server logs if the problem
        persists.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}
