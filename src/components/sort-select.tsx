"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SORTS, type Sort } from "@/lib/search-sorts";

// Amazon's "Sort by: Featured" pill: a styled label over a transparent native select.
export function SortSelect({ value, hrefs }: { value: Sort; hrefs: Record<Sort, string> }) {
  const router = useRouter();
  return (
    <div className="relative rounded-lg border border-m-border bg-m-muted shadow-sm focus-within:outline-2 focus-within:outline-m-accent hover:bg-m-hover">
      <span aria-hidden className="flex h-8 items-center gap-1 px-2.5 text-[13px] text-m-ink">
        Sort by: {SORTS[value]}
        <ChevronDown className="size-3.5" />
      </span>
      <select
        aria-label="Sort by"
        value={value}
        onChange={(e) => router.push(hrefs[e.target.value as Sort], { scroll: false })}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      >
        {(Object.keys(SORTS) as Sort[]).map((s) => (
          <option key={s} value={s}>
            {SORTS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
