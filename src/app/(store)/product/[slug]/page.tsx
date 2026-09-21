import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import { BuyBoxForm } from "@/components/buy-box";
import { Price } from "@/components/price";
import { ProductGallery } from "@/components/product-gallery";
import { ProductRail } from "@/components/product-rail";
import { RatingStars } from "@/components/rating-stars";
import { ReviewsSection } from "@/components/reviews-section";
import { getMoreInCategory, getProduct } from "@/lib/catalog";
import { getReviews } from "@/lib/reviews";
import { deliveryEstimate } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";

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
  if (stock <= 0) return { text: "Currently unavailable.", className: "text-amz-deal" };
  if (stock < 10) return { text: `Only ${stock} left in stock - order soon.`, className: "text-amz-deal" };
  return { text: "In Stock", className: "text-[#007600]" };
}

// DummyJSON descriptions are 1–3 sentences; Amazon shows "About this item" as bullets.
function toBullets(description: string) {
  return description
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const product = await getProduct((await props.params).slug);
  if (!product) notFound();

  const [more, reviews] = await Promise.all([getMoreInCategory(product.categoryId, product.id, 14), getReviews(product.id)]);
  const stock = stockLine(product.stock);
  const images = product.images.length ? product.images : [product.thumbnail];
  const { Shipping, Returns, Warranty } = product.specs;
  const delivery = deliveryEstimate(Shipping, product.price);
  const details = [
    ["Brand", product.brand],
    ["Category", product.category.name],
    ["Warranty", Warranty],
    ["Shipping", Shipping],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-10">
      <nav aria-label="Breadcrumb" className="py-3 text-xs text-zinc-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-amz-link-hover hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3" />
          </li>
          <li>
            <Link href={`/search?category=${product.category.slug}`} className="hover:text-amz-link-hover hover:underline">
              {product.category.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 [grid-template-areas:'head'_'gallery'_'buy'_'details'] md:grid-cols-2 md:[grid-template-areas:'gallery_head'_'gallery_buy'_'details_details'] lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_16rem] lg:[grid-template-areas:'gallery_head_buy'_'gallery_details_buy'] xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_18rem]">
        <div className="[grid-area:gallery] md:self-start lg:sticky lg:top-4">
          <ProductGallery images={images} title={product.title} />
        </div>

        <div className="[grid-area:head]">
          <h1 className="text-2xl font-normal leading-8 text-[#0f1111]">{product.title}</h1>
          {product.brand && (
            <Link
              href={`/search?q=${encodeURIComponent(product.brand)}`}
              className="text-sm text-amz-link hover:text-amz-link-hover hover:underline"
            >
              Visit the {product.brand} Store
            </Link>
          )}
          <a href="#reviews" className="mt-1 flex w-fit items-center gap-2 hover:underline">
            <RatingStars rating={product.rating} count={product.ratingCount} size="md" />
            <span className="text-sm text-amz-link">ratings</span>
          </a>
          <hr className="my-3 border-zinc-200" />
          {/* Phones and tablets see the price in the buy box just below; only the 3-column
              desktop layout repeats it here, as Amazon does. */}
          <Price value={product.price} size="lg" className="hidden lg:inline-flex" />
        </div>

        <aside
          aria-label="Purchase options"
          className="self-start rounded-lg border border-[#d5d9d9] p-4 text-sm text-[#0f1111] [grid-area:buy] lg:sticky lg:top-4"
        >
          <Price value={product.price} size="lg" />
          <p className="mt-3">
            {delivery.free ? (
              <>
                <span className="text-amz-link">FREE delivery</span> <span className="font-bold">{delivery.long}</span>
              </>
            ) : (
              <>
                <span className="text-amz-link">{formatPrice(SHIPPING_FEE)} delivery</span>{" "}
                <span className="font-bold">{delivery.long}</span>. Or FREE delivery on orders over{" "}
                {formatPrice(FREE_SHIPPING_THRESHOLD)}.
              </>
            )}
          </p>
          <p className={`mt-3 text-lg ${stock.className}`}>{stock.text}</p>
          <div className="mt-3">
            <BuyBoxForm productId={product.id} stock={product.stock} />
          </div>
          <dl className="mt-4 grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1 text-xs">
            <dt className="text-zinc-600">Ships from</dt>
            <dd>Amazon Clone</dd>
            <dt className="text-zinc-600">Sold by</dt>
            <dd>Amazon Clone</dd>
            {Returns && (
              <>
                <dt className="text-zinc-600">Returns</dt>
                <dd className="text-amz-link">{Returns}</dd>
              </>
            )}
            <dt className="text-zinc-600">Payment</dt>
            <dd className="flex items-center gap-1 text-amz-link">
              <Lock className="size-3" aria-hidden /> Simulated · no charge
            </dd>
          </dl>
        </aside>

        <div className="flex flex-col gap-5 [grid-area:details]">
          {details.length > 0 && (
            <table className="w-full max-w-xl text-sm">
              <tbody>
                {details.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row" className="w-36 py-1 pr-4 text-left align-top font-bold text-[#0f1111]">
                      {k}
                    </th>
                    <td className="py-1 text-[#0f1111]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <hr className="border-zinc-200" />
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-base font-bold text-[#0f1111]">
              About this item
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#0f1111]">
              {toBullets(product.description).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <ReviewsSection productId={product.id} rating={product.rating} ratingCount={product.ratingCount} reviews={reviews} />

      {more.length > 0 && (
        <div className="mt-10 border-t border-zinc-200 pt-2">
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
