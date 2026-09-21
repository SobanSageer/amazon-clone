import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
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
  const listFor = (slug: string) => lists[cardCategories.findIndex((c) => c.slug === slug)] ?? [];
  const fade = "bg-gradient-to-b to-amz-page";
  const slides: HeroSlide[] = [
    {
      eyebrow: `${productTotal} products · ${categories.length} categories`,
      title: "Everything you need. None of the clutter.",
      body: "Instant search, a one-page checkout, and no upsells in the way.",
      href: "/search",
      cta: "Shop all products",
      images: topRated.map((p) => p.thumbnail),
      bg: `${fade} from-[#f6c77a] via-[#fde2b3]`,
    },
    {
      eyebrow: "Smartphones",
      title: "The latest phones, delivered fast",
      body: "Compare top-rated phones from Apple, Samsung, Oppo and more.",
      href: "/search?category=smartphones",
      cta: "Shop phones",
      images: listFor("smartphones").map((p) => p.thumbnail),
      bg: `${fade} from-[#a9d6f5] via-[#d7ecfa]`,
    },
    {
      eyebrow: "Kitchen",
      title: "Upgrade your kitchen",
      body: "Cookware, tools and storage that make weeknights easier.",
      href: "/search?category=kitchen-accessories",
      cta: "Shop kitchen",
      images: listFor("kitchen-accessories").map((p) => p.thumbnail),
      bg: `${fade} from-[#f4b7a8] via-[#fadcd3]`,
    },
    {
      eyebrow: "Sports & Outdoors",
      title: "Gear up to get fit",
      body: "Balls, bats, rackets and more for every game.",
      href: "/search?category=sports-accessories",
      cta: "Shop sports",
      images: listFor("sports-accessories").map((p) => p.thumbnail),
      bg: `${fade} from-[#b9e3b0] via-[#dcf1d6]`,
    },
  ].filter((s) => s.images.length >= 3);

  return (
    <div className="bg-amz-page">
      <h1 className="sr-only">Amazon Clone: shop {productTotal} products across {categories.length} categories</h1>
      <HeroCarousel slides={slides} />

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
