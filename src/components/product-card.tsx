import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/price";
import { RatingStars } from "@/components/rating-stars";

export type ProductCardData = {
  slug: string;
  title: string;
  brand: string | null;
  price: number;
  thumbnail: string;
  rating: number;
  ratingCount: number;
};

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-3 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-amber-500">
      <div className="relative aspect-square overflow-hidden rounded-md bg-white">
        <Image
          src={product.thumbnail}
          alt=""
          fill
          sizes="(min-width: 1024px) 220px, 45vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{product.brand}</p>}
        <h3 className="line-clamp-2 text-sm leading-snug text-zinc-900">
          <Link href={`/product/${product.slug}`} className="outline-none after:absolute after:inset-0 group-hover:underline">
            {product.title}
          </Link>
        </h3>
        <RatingStars rating={product.rating} count={product.ratingCount} />
        <div className="mt-auto pt-1">
          <Price value={product.price} />
        </div>
      </div>
    </article>
  );
}
