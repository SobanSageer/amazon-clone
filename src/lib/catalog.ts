import { cache } from "react";
import { db } from "@/lib/db";
import type { ProductCardData } from "@/components/product-card";

export const productCardSelect = {
  id: true,
  slug: true,
  title: true,
  brand: true,
  price: true,
  thumbnail: true,
  rating: true,
  ratingCount: true,
  stock: true,
  specs: true,
} as const;

type CardRow = Omit<ProductCardData, "price" | "shipping"> & { price: { toNumber(): number }; specs: unknown };

export function toCard({ specs, ...row }: CardRow): ProductCardData {
  return { ...row, price: row.price.toNumber(), shipping: (specs as Record<string, string> | null)?.Shipping };
}

// Categories ordered by how many products they hold, so the densest ones lead.
export const getCategories = cache(async () => {
  const rows = await db.category.findMany({
    select: { slug: true, name: true, imageUrl: true, _count: { select: { products: true } } },
  });
  return rows
    .map((c) => ({ slug: c.slug, name: c.name, imageUrl: c.imageUrl, productCount: c._count.products }))
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));
});

export async function getProductsInCategory(slug: string, take: number) {
  const rows = await db.product.findMany({
    where: { category: { slug } },
    orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
    take,
    select: productCardSelect,
  });
  return rows.map(toCard);
}

export const getProduct = cache(async (slug: string) => {
  const p = await db.product.findUnique({
    where: { slug },
    include: { category: { select: { slug: true, name: true } } },
  });
  if (!p) return null;
  return {
    ...p,
    price: p.price.toNumber(),
    specs: (p.specs ?? {}) as Record<string, string>,
  };
});

export async function getMoreInCategory(categoryId: string, excludeId: string, take: number) {
  const rows = await db.product.findMany({
    where: { categoryId, id: { not: excludeId } },
    orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
    take,
    select: productCardSelect,
  });
  return rows.map(toCard);
}

export async function getTopRated(take: number) {
  const rows = await db.product.findMany({
    where: { ratingCount: { gte: 100 } },
    orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
    take,
    select: productCardSelect,
  });
  return rows.map(toCard);
}
