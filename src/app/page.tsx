import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductRail } from "@/components/product-rail";
import { getCategories, getProductsInCategory, getTopRated } from "@/lib/catalog";

const CARD_TITLES: Record<string, string> = {
  "kitchen-accessories": "Upgrade your kitchen",
  groceries: "Stock the pantry",
  "sports-accessories": "Gear up to get fit",
  smartphones: "The latest phones",
  "mobile-accessories": "Plug in with accessories",
  "mens-watches": "Watches for him",
  beauty: "Shop beauty",
  fragrances: "Signature scents",
};

export default async function HomePage() {
  const categories = await getCategories();
  const cardCategories = categories.slice(0, 8);
  const railCategories = categories.slice(0, 4);
  const [topRated, ...lists] = await Promise.all([
    getTopRated(10),
    ...cardCategories.map((c) => getProductsInCategory(c.slug, 12)),
  ]);
  const productTotal = categories.reduce((n, c) => n + c.productCount, 0);

  return (
    <div className="bg-amz-page">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f6c77a] via-[#fde2b3] to-amz-page">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:pb-24 sm:pt-12 lg:pb-64">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-800">{productTotal} products · {categories.length} categories</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-zinc-900 text-balance sm:text-5xl">
            Everything you need. None of the clutter.
          </h1>
          <p className="mt-3 max-w-xl text-base text-zinc-800 sm:text-lg">
            Instant search, a one-page checkout, and no upsells in the way.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="rounded-full bg-amz-yellow px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Shop all products
            </Link>
            <Link
              href="#top-rated"
              className="rounded-full border border-zinc-400 bg-white/80 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              See top rated
            </Link>
          </div>
        </div>
      </section>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-8 lg:-mt-52">
        <ul className="-mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0 lg:grid-cols-4" aria-label="Shop by category">
          {cardCategories.map((c, idx) => (
            <li key={c.slug} className="flex flex-col bg-white p-4 sm:p-5">
              <h2 className="text-lg font-bold leading-tight text-zinc-900 sm:text-xl">{CARD_TITLES[c.slug] ?? c.name}</h2>
              <ul className="mt-3 grid flex-1 grid-cols-2 gap-3">
                {lists[idx].slice(0, 4).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-amber-500">
                      <span className="relative block aspect-square overflow-hidden bg-zinc-50">
                        <Image
                          src={p.thumbnail}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 130px, 40vw"
                          className="object-contain p-1.5 transition-transform group-hover:scale-105"
                          priority={idx < 4}
                        />
                      </span>
                      <span className="mt-1 line-clamp-1 text-xs text-zinc-800 group-hover:underline">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/search?category=${c.slug}`} className="mt-3 text-sm font-medium text-amz-link hover:text-amz-link-hover hover:underline">
                See all {c.productCount} in {c.name}
              </Link>
            </li>
          ))}
        </ul>

        {railCategories.map((c, i) => (
          <ProductRail key={c.slug} title={`Best sellers in ${c.name}`} href={`/search?category=${c.slug}`} products={lists[i]} />
        ))}

        <section id="top-rated" aria-labelledby="top-rated-heading" className="scroll-mt-28 bg-white p-4 sm:p-5">
          <h2 id="top-rated-heading" className="mb-3 text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
            Top rated
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {topRated.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
