"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { NativeSelect } from "@/components/ui/input";
import { SORT_OPTIONS } from "@/lib/constants";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">Sort by</span>
      <NativeSelect
        value={value}
        aria-label="Sort products"
        disabled={isPending}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          if (event.target.value === "newest") params.delete("sort");
          else params.set("sort", event.target.value);
          params.delete("page");
          const query = params.toString();
          startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
          });
        }}
        className="h-10 w-auto min-w-[9.5rem] bg-white text-xs font-medium"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
