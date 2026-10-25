"use client";

import { Loader2, Search, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  categoryName: string;
  imageUrl: string | null;
};

export function SearchDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { name: string; slug: string }[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const term = query.trim();

  // Reset the dialog from the event that closes it instead of an effect.
  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setResults([]);
      setError(null);
      setIsLoading(false);
    }
    onOpenChange(next);
  }

  useEffect(() => {
    if (term.length < 2) return;

    const id = ++requestId.current;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { results: SearchResult[] };
        if (id === requestId.current) setResults(data.results);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError" && id === requestId.current) {
          setError("Search is unavailable right now. Please try again.");
        }
      } finally {
        if (id === requestId.current) setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [term]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[12%] max-w-2xl translate-y-0 p-0 sm:top-[18%]" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search Hunar Bazaar</DialogTitle>
          <DialogDescription>Search for lawn suits, kurtas, shawls and more.</DialogDescription>
        </DialogHeader>

        <form
          action="/search"
          method="get"
          className="flex items-center gap-3 border-b border-border px-5 py-4"
          onSubmit={() => handleOpenChange(false)}
        >
          <Search className="size-5 shrink-0 text-stone-400" aria-hidden="true" />
          <Input
            name="q"
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              // Clear immediately when the term is too short for a request.
              if (next.trim().length < 2) {
                setResults([]);
                setError(null);
                setIsLoading(false);
              }
            }}
            placeholder="Search lawn, khussa, prayer rug…"
            className="h-10 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            autoFocus
            autoComplete="off"
            aria-label="Search products"
          />
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-stone-400" aria-label="Searching" />
          ) : null}
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            Enter
          </kbd>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {term.length < 2 ? (
            <div className="p-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <TrendingUp className="size-3.5" aria-hidden="true" /> Popular right now
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    onClick={() => handleOpenChange(false)}
                    className="rounded-full border border-border bg-white px-3.5 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-brand-600 hover:text-brand-800"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {error && term.length >= 2 ? (
            <p className="p-4 text-sm text-destructive">{error}</p>
          ) : null}

          {!isLoading && term.length >= 2 && results.length === 0 && !error ? (
            <div className="p-6 text-center">
              <p className="font-display text-lg text-stone-900">No matches for “{term}”</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a broader term like “lawn”, “shawl” or “khussa”.
              </p>
            </div>
          ) : null}

          {term.length >= 2 && results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={`/products/${result.slug}`}
                    onClick={() => handleOpenChange(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted",
                    )}
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {result.imageUrl ? (
                        <Image
                          src={result.imageUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{result.name}</p>
                      <p className="text-xs text-muted-foreground">{result.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-900">
                        {formatPKR(result.price)}
                      </p>
                      {result.compareAtPrice && result.compareAtPrice > result.price ? (
                        <p className="text-[11px] text-muted-foreground line-through">
                          {formatPKR(result.compareAtPrice)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {term.length >= 2 ? (
            <Link
              href={`/search?q=${encodeURIComponent(term)}`}
              onClick={() => handleOpenChange(false)}
              className="mt-2 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100"
            >
              View all results for “{term}”
              <Search className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
