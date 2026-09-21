import Link from "next/link";
import { Check, Square, SquareCheck } from "lucide-react";
import { RatingStars } from "@/components/rating-stars";
import { searchHref, type SearchInput } from "@/lib/search";
import { cn } from "@/lib/utils";

const PRICE_BANDS = [
  { label: "Under $25", min: undefined, max: 25 },
  { label: "$25 to $100", min: 25, max: 100 },
  { label: "$100 to $500", min: 100, max: 500 },
  { label: "$500 & above", min: 500, max: undefined },
];

function FilterLink({ href, selected, children }: { href: string; selected: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-500",
        selected ? "font-semibold text-zinc-900" : "text-zinc-700",
      )}
    >
      {children}
      {selected && <Check className="size-4 shrink-0 text-amber-600" aria-hidden />}
    </Link>
  );
}

export function SearchFilters({
  input,
  facets,
  idPrefix,
  categoryName,
  brandFacets,
}: {
  input: SearchInput;
  facets: { slug: string; name: string; count: number }[];
  idPrefix: string;
  categoryName?: string;
  brandFacets: { name: string; count: number }[];
}) {
  // Keep selected brands visible even if other filters have zeroed them out.
  const brands = [
    ...brandFacets,
    ...input.brands.filter((b) => !brandFacets.some((f) => f.name === b)).map((name) => ({ name, count: 0 })),
  ].slice(0, Math.max(12, input.brands.length));
  // A selected category with zero matches drops out of the facets; keep it visible
  // so the user can see what's filtering their results away.
  const selectedFacet = input.category && !facets.some((f) => f.slug === input.category);
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby={`${idPrefix}-cat`}>
        <h2 id={`${idPrefix}-cat`} className="mb-1 px-2 text-sm font-bold text-zinc-900">
          Category
        </h2>
        <ul>
          <li>
            <FilterLink href={searchHref(input, { category: undefined })} selected={!input.category}>
              All categories
            </FilterLink>
          </li>
          {selectedFacet && (
            <li>
              <FilterLink href={searchHref(input)} selected>
                <span>
                  {categoryName ?? input.category} <span className="text-xs font-normal text-zinc-500">(0)</span>
                </span>
              </FilterLink>
            </li>
          )}
          {facets.map((f) => (
            <li key={f.slug}>
              <FilterLink href={searchHref(input, { category: f.slug })} selected={input.category === f.slug}>
                <span>
                  {f.name} <span className="text-xs font-normal text-zinc-500">({f.count})</span>
                </span>
              </FilterLink>
            </li>
          ))}
        </ul>
      </section>

      {brands.length > 0 && (
        <section aria-labelledby={`${idPrefix}-brand`}>
          <h2 id={`${idPrefix}-brand`} className="mb-1 px-2 text-sm font-bold text-zinc-900">
            Brands
          </h2>
          <ul>
            {brands.map((b) => {
              const selected = input.brands.includes(b.name);
              const next = selected ? input.brands.filter((x) => x !== b.name) : [...input.brands, b.name];
              const Icon = selected ? SquareCheck : Square;
              return (
                <li key={b.name}>
                  <Link
                    href={searchHref(input, { brand: next })}
                    scroll={false}
                    role="checkbox"
                    aria-checked={selected}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-zinc-800 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    <Icon className={`size-4 shrink-0 ${selected ? "text-amz-link" : "text-zinc-500"}`} aria-hidden />
                    <span className="truncate">{b.name}</span>
                    <span className="text-xs text-zinc-500">({b.count})</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby={`${idPrefix}-rating`}>
        <h2 id={`${idPrefix}-rating`} className="mb-1 px-2 text-sm font-bold text-zinc-900">
          Customer reviews
        </h2>
        <ul>
          {[4, 3].map((r) => (
            <li key={r}>
              <FilterLink
                href={searchHref(input, { rating: input.rating === r ? undefined : r })}
                selected={input.rating === r}
              >
                <span className="flex items-center gap-1.5">
                  <RatingStars rating={r} />
                  <span>& up</span>
                </span>
              </FilterLink>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${idPrefix}-price`}>
        <h2 id={`${idPrefix}-price`} className="mb-1 px-2 text-sm font-bold text-zinc-900">
          Price
        </h2>
        <ul>
          {PRICE_BANDS.map((b) => {
            const selected = input.min === b.min && input.max === b.max;
            return (
              <li key={b.label}>
                <FilterLink
                  href={searchHref(input, selected ? { min: undefined, max: undefined } : { min: b.min, max: b.max })}
                  selected={selected}
                >
                  {b.label}
                </FilterLink>
              </li>
            );
          })}
        </ul>
        <form action="/search" className="mt-2 flex items-end gap-2 px-2">
          {input.q && <input type="hidden" name="q" value={input.q} />}
          {input.category && <input type="hidden" name="category" value={input.category} />}
          {input.rating && <input type="hidden" name="rating" value={input.rating} />}
          {input.brands.map((b) => (
            <input key={b} type="hidden" name="brand" value={b} />
          ))}
          {input.sort !== "relevance" && <input type="hidden" name="sort" value={input.sort} />}
          <label className="flex min-w-0 flex-1 flex-col text-xs text-zinc-600">
            Min
            <input
              name="min"
              type="number"
              inputMode="decimal"
              min={0}
              defaultValue={input.min}
              placeholder="$0"
              className="mt-0.5 h-9 w-full rounded-md border border-zinc-300 px-2 text-base text-zinc-900 sm:text-sm"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col text-xs text-zinc-600">
            Max
            <input
              name="max"
              type="number"
              inputMode="decimal"
              min={0}
              defaultValue={input.max}
              placeholder="Any"
              className="mt-0.5 h-9 w-full rounded-md border border-zinc-300 px-2 text-base text-zinc-900 sm:text-sm"
            />
          </label>
          <button
            type="submit"
            className="h-9 shrink-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Go
          </button>
        </form>
      </section>
    </div>
  );
}
