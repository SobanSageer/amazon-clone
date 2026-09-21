import { cache } from "react";
import { db } from "@/lib/db";
import type { ProductCardData } from "@/components/product-card";

export const productCardSelect = {
  slug: true,
  title: true,
  brand: true,
  price: true,
  thumbnail: true,
  rating: true,
  ratingCount: true,
} as const;

type CardRow = Omit<ProductCardData, "price"> & { price: { toNumber(): number } };

export function toCard(row: CardRow): ProductCardData {
  return { ...row, price: row.price.toNumber() };
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

export async function getTopRated(take: number) {
  const rows = await db.product.findMany({
    where: { ratingCount: { gte: 100 } },
    orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
    take,
    select: productCardSelect,
  });
  return rows.map(toCard);
}
