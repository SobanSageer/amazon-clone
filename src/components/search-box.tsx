"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Search } from "lucide-react";
import { formatPrice } from "@/lib/format";

type Suggestion = { slug: string; title: string; thumbnail: string; categoryName: string; price: number };

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSearchPage = pathname === "/search";
  const urlQ = onSearchPage ? (searchParams.get("q") ?? "") : "";

  const [value, setValue] = useState(urlQ);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  // True while the input holds text the user typed that the URL doesn't reflect yet.
  const [dirty, setDirty] = useState(false);

  // Keep the box in sync when the URL changes from elsewhere (back button, filter links,
  // leaving /search).
  const [syncedQ, setSyncedQ] = useState(urlQ);
  if (urlQ !== syncedQ) {
    setSyncedQ(urlQ);
    // Compare trimmed so a trailing space the user just typed isn't wiped when their
    // own debounced search lands in the URL.
    if (!dirty && urlQ !== value.trim()) setValue(urlQ);
  }

  // On the results page, typing re-runs the search in place — no navigation, no reload.
  useEffect(() => {
    if (!onSearchPage || !dirty) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
      setDirty(false);
    }, 250);
    return () => clearTimeout(t);
  }, [value, dirty, onSearchPage, router, searchParams]);

  // Everywhere else, show instant product suggestions.
  useEffect(() => {
    if (onSearchPage) return;
    const q = value.trim();
    if (!q) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          setSuggestions(await res.json());
          setActive(-1);
        }
      } catch {
        // aborted or offline — keep the previous suggestions
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, onSearchPage]);

  const showList = open && !onSearchPage && value.trim() !== "" && suggestions.length > 0;

  function go(href: string) {
    setOpen(false);
    setDirty(false);
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (showList && active >= 0) return go(`/product/${suggestions[active].slug}`);
    const q = value.trim();
    go(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  }

  return (
    <form role="search" action="/search" onSubmit={submit} className="relative flex w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search products
      </label>
      <input
        id={`${listId}-input`}
        name="q"
        type="search"
        value={value}
        onChange={(e) => {
          setDirty(true);
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder="Search products, brands, categories"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
        className="h-10 min-w-0 flex-1 rounded-l-md border-0 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 sm:text-sm"
      />
      <button
        type="submit"
        className="flex h-10 w-12 shrink-0 items-center justify-center rounded-r-md bg-amz-search text-zinc-900 hover:bg-amz-search-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <Search className="size-5" aria-hidden />
        <span className="sr-only">Search</span>
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label="Product suggestions"
        hidden={!showList}
        className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 text-zinc-900 shadow-lg"
      >
        {suggestions.map((s, i) => (
          <li
            key={s.slug}
            id={`${listId}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              go(`/product/${s.slug}`);
            }}
            onMouseEnter={() => setActive(i)}
            className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-zinc-100" : ""}`}
          >
            <span className="relative size-10 shrink-0 overflow-hidden rounded bg-white">
              <Image src={s.thumbnail} alt="" fill sizes="40px" className="object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{s.title}</span>
              <span className="block text-xs text-zinc-600">in {s.categoryName}</span>
            </span>
            <span className="shrink-0 text-sm font-medium">{formatPrice(s.price)}</span>
          </li>
        ))}
        <li
          role="option"
          aria-selected={false}
          onMouseDown={(e) => {
            e.preventDefault();
            go(`/search?q=${encodeURIComponent(value.trim())}`);
          }}
          className="cursor-pointer border-t border-zinc-100 px-3 py-2 text-sm font-medium text-amz-link hover:bg-zinc-50"
        >
          See all results for “{value.trim()}”
        </li>
      </ul>
    </form>
  );
}

export function SearchBoxFallback() {
  return (
    <form role="search" action="/search" className="flex w-full">
      <label htmlFor="search-fallback" className="sr-only">
        Search products
      </label>
      <input
        id="search-fallback"
        name="q"
        type="search"
        placeholder="Search products, brands, categories"
        className="h-10 min-w-0 flex-1 rounded-l-md border-0 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-500 sm:text-sm"
      />
      <button type="submit" className="flex h-10 w-12 items-center justify-center rounded-r-md bg-amz-search text-zinc-900">
        <Search className="size-5" aria-hidden />
        <span className="sr-only">Search</span>
      </button>
    </form>
  );
}
