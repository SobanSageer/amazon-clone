import Link from "next/link";
import { Suspense } from "react";
import { HeaderActions } from "@/components/header-actions";
import { CategoryNav } from "@/components/category-nav";
import { SearchBox, SearchBoxFallback } from "@/components/search-box";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="relative z-40 sm:sticky sm:top-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-amber-400 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-900"
      >
        Skip to content
      </a>
      <div className="bg-zinc-900 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2 sm:gap-x-6">
          <Link
            href="/"
            className="rounded-sm text-2xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            {site.name}
            <span className="text-amber-400">.</span>
          </Link>
          {/* Search takes its own full-width row on phones, sits inline from sm up. */}
          <div className="col-span-3 row-start-2 sm:col-span-1 sm:row-start-1 sm:col-start-2">
            <Suspense fallback={<SearchBoxFallback />}>
              <SearchBox />
            </Suspense>
          </div>
          <div className="col-start-3 row-start-1 justify-self-end">
            <HeaderActions />
          </div>
        </div>
      </div>
      <CategoryNav />
    </header>
  );
}
