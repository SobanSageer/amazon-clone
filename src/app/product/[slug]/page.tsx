import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { BuyBoxForm } from "@/components/buy-box";
import { Price } from "@/components/price";
import { ProductGallery } from "@/components/product-gallery";
import { ProductRail } from "@/components/product-rail";
import { RatingStars } from "@/components/rating-stars";
import { getMoreInCategory, getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";

// Render each product on first visit, then serve it from cache (ISR).
export async function generateStaticParams() {
  return [];
}
export const revalidate = 3600;

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProduct((await props.params).slug);
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.description.slice(0, 160) };
}

function stockLine(stock: number) {
  if (stock <= 0) return { text: "Currently unavailable", className: "text-red-700" };
  if (stock < 10) return { text: `Only ${stock} left in stock`, className: "text-orange-700" };
  return { text: "In stock", className: "text-emerald-700" };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const product = await getProduct((await props.params).slug);
  if (!product) notFound();

  const more = await getMoreInCategory(product.categoryId, product.id, 12);
  const stock = stockLine(product.stock);
  const images = product.images.length ? product.images : [product.thumbnail];
  const { Shipping, Returns, Warranty } = product.specs;
  const details = [
    ["Brand", product.brand],
    ["Category", product.category.name],
    ["Warranty", Warranty],
    ["Returns", Returns],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link href={`/search?category=${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden className="hidden sm:block">
            <ChevronRight className="size-3.5" />
          </li>
          <li className="hidden max-w-xs truncate text-zinc-900 sm:block" aria-current="page">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 [grid-template-areas:'head'_'gallery'_'buy'_'details'] md:grid-cols-2 md:[grid-template-areas:'gallery_head'_'gallery_buy'_'details_details'] lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_18rem] lg:gap-8 lg:[grid-template-areas:'gallery_head_buy'_'gallery_details_buy']">
        <div className="[grid-area:gallery] md:self-start lg:sticky lg:top-32">
          <ProductGallery images={images} title={product.title} />
        </div>

        <div className="[grid-area:head]">
          {product.brand && (
            <Link
              href={`/search?q=${encodeURIComponent(product.brand)}`}
              className="text-sm font-medium text-amz-link hover:underline"
            >
              {product.brand}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-zinc-900 text-balance sm:text-3xl">
            {product.title}
          </h1>
          <div className="mt-2">
            <RatingStars rating={product.rating} count={product.ratingCount} size="md" />
          </div>
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <Price value={product.price} size="lg" />
          </div>
        </div>

        <aside
          aria-label="Purchase options"
          className="self-start rounded-xl border border-zinc-200 bg-white p-4 [grid-area:buy] lg:sticky lg:top-32"
        >
          <Price value={product.price} size="lg" className="hidden lg:inline-flex" />
          <ul className="mt-0 flex flex-col gap-2 text-sm text-zinc-700 lg:mt-3">
            <li className="flex gap-2">
              <Truck className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
              <span>
                {product.price >= FREE_SHIPPING_THRESHOLD ? (
                  <strong className="text-zinc-900">Free shipping</strong>
                ) : (
                  <>Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}</>
                )}
                {Shipping && <span className="block text-zinc-600">{Shipping}</span>}
              </span>
            </li>
            {Returns && (
              <li className="flex gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
                {Returns}
              </li>
            )}
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
              Simulated checkout — no real charges
            </li>
          </ul>
          <p className={`mt-3 text-base font-semibold ${stock.className}`}>{stock.text}</p>
          <div className="mt-3">
            <BuyBoxForm productId={product.id} stock={product.stock} />
          </div>
        </aside>

        <div className="flex flex-col gap-6 [grid-area:details]">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-lg font-bold text-zinc-900">
              About this item
            </h2>
            <p className="mt-2 max-w-prose leading-relaxed text-zinc-700">{product.description}</p>
          </section>
          {details.length > 0 && (
            <section aria-labelledby="details-heading">
              <h2 id="details-heading" className="text-lg font-bold text-zinc-900">
                Product details
              </h2>
              <dl className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 text-sm">
                {details.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[8rem_1fr] gap-4 px-3 py-2">
                    <dt className="font-medium text-zinc-600">{k}</dt>
                    <dd className="text-zinc-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {more.length > 0 && (
        <div className="mt-10 -mx-4 sm:mx-0">
          <ProductRail
            title={`More in ${product.category.name}`}
            href={`/search?category=${product.category.slug}`}
            products={more}
          />
        </div>
      )}
    </div>
  );
}
