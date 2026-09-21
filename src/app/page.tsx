import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductRail } from "@/components/product-rail";
import { getCategories, getProductsInCategory, getTopRated } from "@/lib/catalog";

export default async function HomePage() {
  const categories = await getCategories();
  const railCategories = categories.slice(0, 4);
  const [topRated, ...rails] = await Promise.all([
    getTopRated(10),
    ...railCategories.map((c) => getProductsInCategory(c.slug, 12)),
  ]);
  const productTotal = categories.reduce((n, c) => n + c.productCount, 0);

  return (
    <div className="bg-zinc-100">
      <section className="bg-gradient-to-br from-amber-100 via-orange-50 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:py-14 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 text-balance sm:text-5xl">
              Everything you need. None of the clutter.
            </h1>
            <p className="mt-4 max-w-xl text-base text-zinc-700 sm:text-lg">
              {productTotal} products across {categories.length} categories, with instant search and a
              one-page checkout. No upsells in the way.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Browse all products
              </Link>
              <Link
                href="#top-rated"
                className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                See top rated
              </Link>
            </div>
          </div>
          <div aria-hidden className="hidden grid-cols-3 gap-3 md:grid">
            {topRated.slice(0, 3).map((p, i) => (
              <div
                key={p.slug}
                className={`relative aspect-[3/4] overflow-hidden rounded-2xl bg-white shadow-sm ${i === 1 ? "-translate-y-4" : "translate-y-2"}`}
              >
                <Image src={p.thumbnail} alt="" fill sizes="180px" className="object-contain p-3" priority />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
        <section aria-labelledby="categories-heading" className="rounded-xl bg-white p-4 sm:p-5">
          <h2 id="categories-heading" className="mb-3 text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
            Shop by category
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/search?category=${c.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-zinc-200 p-2 hover:border-zinc-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-amber-500"
                >
                  <span className="relative aspect-square overflow-hidden rounded-md bg-zinc-50">
                    {c.imageUrl && (
                      <Image
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 140px, 45vw"
                        className="object-contain p-2 transition-transform group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="mt-2 text-sm font-medium text-zinc-900 group-hover:underline">{c.name}</span>
                  <span className="text-xs text-zinc-600">{c.productCount} items</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {railCategories.map((c, i) => (
          <ProductRail key={c.slug} title={c.name} href={`/search?category=${c.slug}`} products={rails[i]} />
        ))}

        <section id="top-rated" aria-labelledby="top-rated-heading" className="scroll-mt-28 rounded-xl bg-white p-4 sm:p-5">
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
