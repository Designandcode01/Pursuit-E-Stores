import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";

function pageList(current: number, total: number) {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
}

export function Pagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | number | boolean | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = pageList(page, totalPages);

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={buildHref(basePath, { ...params, page: page - 1 })}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-stone-600 transition-colors hover:border-brand-600 hover:text-brand-800"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 text-stone-300"
          aria-hidden="true"
        >
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((pageNumber, index) => {
        const previous = pages[index - 1];
        const showGap = previous !== undefined && pageNumber - previous > 1;
        return (
          <span key={pageNumber} className="flex items-center gap-1.5">
            {showGap ? <span className="px-1 text-xs text-stone-400">…</span> : null}
            <Link
              href={buildHref(basePath, { ...params, page: pageNumber })}
              aria-current={pageNumber === page ? "page" : undefined}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                pageNumber === page
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-border bg-white text-stone-600 hover:border-brand-600 hover:text-brand-800",
              )}
            >
              {pageNumber}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link
          href={buildHref(basePath, { ...params, page: page + 1 })}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-stone-600 transition-colors hover:border-brand-600 hover:text-brand-800"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 text-stone-300"
          aria-hidden="true"
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
