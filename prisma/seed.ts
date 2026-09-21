import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import products from "./data/products.json";
import { directUrl } from "../src/lib/direct-url";

// Runs on every Vercel build, so it must be idempotent and fast: bulk inserts that
// skip rows already present, no per-row round trips.

const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: directUrl }),
});

const CATEGORY_NAMES: Record<string, string> = {
  beauty: "Beauty",
  fragrances: "Fragrances",
  furniture: "Furniture",
  groceries: "Groceries",
  "home-decoration": "Home Decor",
  "kitchen-accessories": "Kitchen",
  laptops: "Laptops",
  "mens-shirts": "Men's Shirts",
  "mens-shoes": "Men's Shoes",
  "mens-watches": "Men's Watches",
  "mobile-accessories": "Phone Accessories",
  "skin-care": "Skin Care",
  smartphones: "Smartphones",
  "sports-accessories": "Sports & Outdoors",
  sunglasses: "Sunglasses",
  tablets: "Tablets",
  tops: "Women's Tops",
  "womens-bags": "Women's Bags",
  "womens-dresses": "Women's Dresses",
  "womens-jewellery": "Jewelry",
  "womens-shoes": "Women's Shoes",
  "womens-watches": "Women's Watches",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// DummyJSON ships only 3 reviews per product; a count of "3" everywhere reads as fake.
// Derive a stable, plausible-looking count from the product id instead.
function ratingCountFor(id: number) {
  return 12 + ((id * 7919) % 4200);
}

async function main() {
  const categorySlugs = [...new Set(products.map((p) => p.category))];
  const firstThumb = new Map<string, string>();
  for (const p of products) if (!firstThumb.has(p.category)) firstThumb.set(p.category, p.thumbnail);

  await db.category.createMany({
    data: categorySlugs.map((slug) => ({
      slug,
      name: CATEGORY_NAMES[slug] ?? slug,
      imageUrl: firstThumb.get(slug),
    })),
    skipDuplicates: true,
  });

  const categories = await db.category.findMany({ select: { id: true, slug: true } });
  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));

  const usedSlugs = new Set<string>();
  const productRows = products.map((p) => {
    let slug = slugify(p.title);
    if (usedSlugs.has(slug)) slug = `${slug}-${p.id}`;
    usedSlugs.add(slug);
    return {
      slug,
      title: p.title,
      description: p.description,
      brand: p.brand ?? null,
      price: p.price,
      thumbnail: p.thumbnail,
      images: p.images,
      rating: p.rating,
      ratingCount: ratingCountFor(p.id),
      stock: p.stock,
      specs: p.specs,
      categoryId: categoryId.get(p.category)!,
    };
  });

  const inserted = await db.product.createMany({ data: productRows, skipDuplicates: true });

  // Backfill columns added after the first seed. Only touches rows still missing
  // them, so steady-state builds do no per-row work.
  const missingSpecs = await db.product.findMany({
    where: { specs: { equals: Prisma.DbNull } },
    select: { slug: true },
  });
  if (missingSpecs.length) {
    const bySlug = new Map(productRows.map((r) => [r.slug, r.specs]));
    await db.$transaction(
      missingSpecs.map(({ slug }) =>
        db.product.update({ where: { slug }, data: { specs: bySlug.get(slug) ?? {} } }),
      ),
    );
  }

  const total = await db.product.count();
  console.log(
    `Seed: ${categories.length} categories, ${total} products (${inserted.count} new, ${missingSpecs.length} specs backfilled).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
