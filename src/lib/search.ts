import { db } from "@/lib/db";
import { productCardSelect, toCard } from "@/lib/catalog";
import type { ProductCardData } from "@/components/product-card";
import type { Prisma } from "@/generated/prisma/client";
import { SORTS, type Sort } from "@/lib/search-sorts";

export { SORTS, type Sort };

export const PAGE_SIZE = 24;

export type SearchInput = {
  q: string;
  category?: string;
  min?: number;
  max?: number;
  rating?: number;
  sort: Sort;
  page: number;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined) {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchInput {
  const sort = one(sp.sort);
  const rating = num(one(sp.rating));
  return {
    q: (one(sp.q) ?? "").trim().slice(0, 100),
    category: one(sp.category) || undefined,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
    sort: sort && sort in SORTS ? (sort as Sort) : "relevance",
    page: Math.max(1, Math.floor(num(one(sp.page)) ?? 1)),
  };
}

function terms(q: string) {
  return q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
}

function textWhere(q: string): Prisma.ProductWhereInput {
  const ts = terms(q);
  if (!ts.length) return {};
  return {
    AND: ts.map((t) => ({
      OR: [
        { title: { contains: t, mode: "insensitive" } },
        { brand: { contains: t, mode: "insensitive" } },
        { description: { contains: t, mode: "insensitive" } },
        { category: { name: { contains: t, mode: "insensitive" } } },
      ],
    })),
  };
}

type Row = ProductCardData & { categorySlug: string; categoryName: string };

async function matchText(q: string, take?: number): Promise<Row[]> {
  const rows = await db.product.findMany({
    where: textWhere(q),
    select: { ...productCardSelect, category: { select: { slug: true, name: true } } },
    take,
  });
  return rows.map(({ category, ...r }) => ({ ...toCard(r), categorySlug: category.slug, categoryName: category.name }));
}

function relevance(p: Row, q: string) {
  const title = p.title.toLowerCase();
  const brand = (p.brand ?? "").toLowerCase();
  const phrase = q.toLowerCase();
  let score = title.includes(phrase) ? 20 : 0;
  if (title.startsWith(phrase)) score += 10;
  for (const t of terms(q)) {
    if (title.includes(t)) score += 5;
    if (brand.includes(t)) score += 3;
    if (p.categoryName.toLowerCase().includes(t)) score += 2;
  }
  return score;
}

// Weight rating by volume so a 5.0 from 12 reviews doesn't outrank 4.8 from 3,000.
function popularity(p: Row) {
  return p.rating * Math.log10(p.ratingCount + 10);
}

export async function searchProducts(input: SearchInput) {
  const matched = await matchText(input.q);

  const passesNonCategory = (p: Row) =>
    (input.min === undefined || p.price >= input.min) &&
    (input.max === undefined || p.price <= input.max) &&
    (input.rating === undefined || p.rating >= input.rating);

  const facetMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of matched) {
    if (!passesNonCategory(p)) continue;
    const f = facetMap.get(p.categorySlug) ?? { slug: p.categorySlug, name: p.categoryName, count: 0 };
    f.count++;
    facetMap.set(p.categorySlug, f);
  }
  const categoryFacets = [...facetMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const filtered = matched.filter((p) => passesNonCategory(p) && (!input.category || p.categorySlug === input.category));

  const sorted = [...filtered].sort((a, b) => {
    switch (input.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating || b.ratingCount - a.ratingCount;
      default:
        return (input.q ? relevance(b, input.q) - relevance(a, input.q) : 0) || popularity(b) - popularity(a);
    }
  });

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(input.page, pageCount);
  const results = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { results, total, page, pageCount, categoryFacets };
}

export async function suggestProducts(q: string, limit = 6) {
  if (!q.trim()) return [];
  const matched = await matchText(q.trim().slice(0, 100));
  return matched
    .sort((a, b) => relevance(b, q) - relevance(a, q) || popularity(b) - popularity(a))
    .slice(0, limit)
    .map((p) => ({ slug: p.slug, title: p.title, thumbnail: p.thumbnail, categoryName: p.categoryName, price: p.price }));
}

export function searchHref(input: Partial<SearchInput>, overrides: Partial<Record<keyof SearchInput, string | number | undefined>> = {}) {
  const merged: Record<string, string | number | undefined> = {
    q: input.q,
    category: input.category,
    min: input.min,
    max: input.max,
    rating: input.rating,
    sort: input.sort === "relevance" ? undefined : input.sort,
    page: undefined,
    ...overrides,
  };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") params.set(k, String(v));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
