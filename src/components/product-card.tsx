import Image from "next/image";
import Link from "next/link";
import { CardAddToCart } from "@/components/card-add-to-cart";
import { Price } from "@/components/price";
import { RatingStars } from "@/components/rating-stars";
import { deliveryEstimate } from "@/lib/delivery";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  price: number;
  thumbnail: string;
  rating: number;
  ratingCount: number;
  stock: number;
  shipping?: string;
};

// "grid": Amazon's search-results card (delivery line + Add to cart).
// "rail": the slimmer card used in horizontal carousels.
export function ProductCard({
  product,
  priority = false,
  variant = "grid",
}: {
  product: ProductCardData;
  priority?: boolean;
  variant?: "grid" | "rail";
}) {
  const delivery = deliveryEstimate(product.shipping, product.price);
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden bg-[#f7f7f7]">
        <Image
          src={product.thumbnail}
          alt=""
          fill
          sizes="(min-width: 1024px) 240px, 45vw"
          className="object-contain p-3 mix-blend-multiply"
          priority={priority}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-2">
        {variant === "grid" && product.brand && (
          <p className="text-[13px] font-bold leading-tight text-[#0f1111]">{product.brand}</p>
        )}
        <h3 className={variant === "grid" ? "line-clamp-3 text-[15px] leading-snug" : "line-clamp-2 text-sm leading-snug"}>
          <Link
            href={`/product/${product.slug}`}
            className="text-[#0f1111] outline-none after:absolute after:inset-0 hover:text-amz-link-hover focus-visible:underline"
          >
            {product.title}
          </Link>
        </h3>
        <RatingStars rating={product.rating} count={product.ratingCount} />
        <Price value={product.price} className="mt-0.5" />
        {variant === "grid" && (
          <>
            <p className="text-xs text-[#0f1111]">
              {delivery.free ? (
                <>
                  <span className="font-bold">FREE delivery</span> {delivery.short}
                </>
              ) : (
                <>
                  Delivery <span className="font-bold">{delivery.short}</span>
                </>
              )}
            </p>
            {product.stock > 0 && product.stock < 10 && (
              <p className="text-xs text-amz-deal">Only {product.stock} left in stock - order soon.</p>
            )}
            <div className="mt-auto pt-2">
              {product.stock > 0 ? (
                <CardAddToCart productId={product.id} title={product.title} />
              ) : (
                <p className="text-xs text-zinc-600">Currently unavailable</p>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
