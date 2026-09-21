import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SearchFilters } from "@/components/search-filters";
import { SortSelect } from "@/components/sort-select";
import { getCategories } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { parseSearchParams, searchHref, searchProducts, SORTS, type SearchInput, type Sort } from "@/lib/search";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const input = parseSearchParams(await props.searchParams);
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === input.category)?.name;
  if (input.q) return { title: `Results for “${input.q}”` };
  return { title: cat ?? "All products" };
}

function priceLabel(input: SearchInput) {
  if (input.min !== undefined && input.max !== undefined) return `${formatPrice(input.min)} – ${formatPrice(input.max)}`;
  if (input.min !== undefined) return `${formatPrice(input.min)} & above`;
  if (input.max !== undefined) return `Under ${formatPrice(input.max)}`;
  return null;
}

export default async function SearchPage(props: PageProps<"/search">) {
  const input = parseSearchParams(await props.searchParams);
  const [{ results, total, page, pageCount, categoryFacets }, categories] = await Promise.all([
    searchProducts(input),
    getCategories(),
  ]);
  const categoryName = categories.find((c) => c.slug === input.category)?.name;

  const chips: { label: string; href: string }[] = [];
  if (input.category) chips.push({ label: categoryName ?? input.category, href: searchHref(input, { category: undefined }) });
  if (input.rating) chips.push({ label: `${input.rating}★ & up`, href: searchHref(input, { rating: undefined }) });
  const price = priceLabel(input);
  if (price) chips.push({ label: price, href: searchHref(input, { min: undefined, max: undefined }) });
  const clearAll = searchHref({ q: input.q, sort: input.sort });

  const sortHrefs = Object.fromEntries(
    (Object.keys(SORTS) as Sort[]).map((s) => [s, searchHref(input, { sort: s === "relevance" ? undefined : s })]),
  ) as Record<Sort, string>;

  const heading = input.q ? (
    <>
      {total} {total === 1 ? "result" : "results"} for <span className="text-amber-700">“{input.q}”</span>
      {categoryName && <> in {categoryName}</>}
    </>
  ) : (
    (categoryName ?? "All products")
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl" aria-live="polite">
            {heading}
          </h1>
          {!input.q && (
            <p className="mt-1 text-sm text-zinc-600">
              {total} {total === 1 ? "product" : "products"}
            </p>
          )}
        </div>
        <SortSelect value={input.sort} hrefs={sortHrefs} />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside aria-label="Filters" className="hidden lg:block">
          <SearchFilters input={input} facets={categoryFacets} idPrefix="desk" categoryName={categoryName} />
        </aside>

        <div className="min-w-0">
          <details className="mb-4 rounded-lg border border-zinc-200 bg-white lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters
              {chips.length > 0 && (
                <span className="rounded-full bg-amz-yellow px-2 py-0.5 text-xs font-bold text-zinc-900">{chips.length}</span>
              )}
            </summary>
            <div className="border-t border-zinc-200 p-2">
              <SearchFilters input={input} facets={categoryFacets} idPrefix="mob" categoryName={categoryName} />
            </div>
          </details>

          {chips.length > 0 && (
            <ul className="mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    scroll={false}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white py-1 pl-3 pr-2 text-sm text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    {c.label}
                    <X className="size-3.5" aria-hidden />
                    <span className="sr-only">Remove filter</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href={clearAll} scroll={false} className="text-sm font-medium text-amz-link hover:underline">
                  Clear all
                </Link>
              </li>
            </ul>
          )}

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-semibold text-zinc-900">No products match{input.q ? ` “${input.q}”` : ""}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {chips.length > 0 ? "Try removing a filter, or " : "Check the spelling, or "}
                browse a category instead.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {chips.length > 0 && (
                  <Link href={clearAll} className="rounded-full bg-amz-yellow px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amz-yellow-hover">
                    Clear filters
                  </Link>
                )}
                {categories.slice(0, 4).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/search?category=${c.slug}`}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {results.map((p, i) => (
                <li key={p.slug}>
                  <ProductCard product={p} priority={i < 4} />
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
              {page > 1 && (
                <Link
                  href={searchHref(input, { page: page - 1 })}
                  className="inline-flex h-10 items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50"
                >
                  <ChevronLeft className="size-4" aria-hidden /> Previous
                </Link>
              )}
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={searchHref(input, { page: n === 1 ? undefined : n })}
                  aria-current={n === page ? "page" : undefined}
                  className={`hidden h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium sm:inline-flex ${
                    n === page ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white hover:bg-zinc-50"
                  }`}
                >
                  {n}
                </Link>
              ))}
              <span className="px-3 text-sm text-zinc-600 sm:hidden">
                Page {page} of {pageCount}
              </span>
              {page < pageCount && (
                <Link
                  href={searchHref(input, { page: page + 1 })}
                  className="inline-flex h-10 items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50"
                >
                  Next <ChevronRight className="size-4" aria-hidden />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
