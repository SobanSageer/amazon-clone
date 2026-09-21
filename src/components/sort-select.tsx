"use client";

import { useRouter } from "next/navigation";
import { SORTS, type Sort } from "@/lib/search-sorts";

export function SortSelect({ value, hrefs }: { value: Sort; hrefs: Record<Sort, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700">
      <span className="shrink-0">Sort by</span>
      <select
        value={value}
        onChange={(e) => router.push(hrefs[e.target.value as Sort], { scroll: false })}
        className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        {(Object.keys(SORTS) as Sort[]).map((s) => (
          <option key={s} value={s}>
            {SORTS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
