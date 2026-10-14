import "server-only";
import { db } from "@/lib/db";

export type RetrievedProduct = {
  slug: string;
  title: string;
  brand: string | null;
  category: string;
  price: number;
  rating: number;
  ratingCount: number;
  stock: number;
  description: string;
  thumbnail: string;
};

export const MAX_MATCHES = 8;

// Words → an OR'd prefix tsquery ("wireless head" → 'wireless:* | head:*"). OR rather than
// AND keeps recall up for natural questions ("something cheap for the kitchen"); ts_rank
// then sorts the good matches to the top.
function queryTokens(question: string) {
  return question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .slice(0, 8);
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "any", "you", "can", "get", "has", "have", "what", "which", "that",
  "this", "with", "from", "about", "under", "over", "best", "good", "show", "me", "my", "do", "does",
  "is", "it", "a", "an", "of", "to", "in", "on", "i", "want", "need", "looking", "find", "please",
]);

type Row = Omit<RetrievedProduct, "price" | "rating"> & { price: string | number; rating: number };

export async function retrieveProducts(question: string): Promise<RetrievedProduct[]> {
  const tokens = queryTokens(question);
  if (!tokens.length) return [];
  const tsquery = tokens.map((t) => `${t}:*`).join(" | ");
  // Full-text matches whole words, so "phone" never reaches "iPhone" or "Smartphones".
  // A substring pass over title/brand/category catches those; with 184 products the
  // scan is free, and it only ever adds candidates the ranking then orders.
  const likeTokens = tokens.filter((t) => t.length >= 3);

  // Rank title/brand/description (weighted in the stored vector) and give a smaller
  // boost when the category name itself matches.
  const rows = await db.$queryRaw<Row[]>`
    SELECT "slug", "title", "brand", "category", "price", "rating", "ratingCount", "stock",
           "description", "thumbnail"
    FROM (
      SELECT p."slug", p."title", p."brand", c."name" AS "category", p."price"::text AS "price",
             p."rating", p."ratingCount", p."stock", p."description", p."thumbnail",
             ts_rank(p."searchVector", q) AS fts,
             ts_rank(to_tsvector('english', c."name"), q) AS catrank,
             (
               SELECT count(*) FROM unnest(${likeTokens}::text[]) AS t
               WHERE p."title" ILIKE '%' || t || '%'
                  OR coalesce(p."brand", '') ILIKE '%' || t || '%'
                  OR c."name" ILIKE '%' || t || '%'
             ) AS lex
      FROM "Product" p
      JOIN "Category" c ON c."id" = p."categoryId"
      , to_tsquery('english', ${tsquery}) AS q
    ) scored
    WHERE fts > 0 OR catrank > 0 OR lex > 0
    ORDER BY (fts + 0.3 * catrank + 0.25 * lex) DESC, "rating" DESC
    LIMIT ${MAX_MATCHES}
  `;

  return rows.map((r) => ({ ...r, price: Number(r.price), rating: Number(r.rating) }));
}

// Shown when retrieval finds nothing, so the assistant can point somewhere real
// instead of guessing.
export async function topCategories(limit = 6) {
  const rows = await db.category.findMany({
    select: { name: true, slug: true, _count: { select: { products: true } } },
  });
  return rows
    .sort((a, b) => b._count.products - a._count.products)
    .slice(0, limit)
    .map((c) => ({ name: c.name, slug: c.slug }));
}
