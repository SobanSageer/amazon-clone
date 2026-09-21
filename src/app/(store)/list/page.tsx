import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { currentUser } from "@/auth";
import { removeFromListAction } from "@/app/actions/list";
import { CardAddToCart } from "@/components/card-add-to-cart";
import { Price } from "@/components/price";
import { RatingStars } from "@/components/rating-stars";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Your List" };

export default async function ListPage() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/list");

  const items = await db.listItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      product: { select: { id: true, slug: true, title: true, thumbnail: true, price: true, rating: true, ratingCount: true, stock: true } },
    },
  });

  return (
    <div className="bg-amz-page">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="bg-white p-5 sm:p-6">
          <h1 className="border-b border-zinc-200 pb-3 text-[28px] font-normal leading-tight text-[#0f1111]">Your List</h1>
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto size-10 text-zinc-300" aria-hidden />
              <p className="mt-3 text-lg text-[#0f1111]">Your list is empty</p>
              <p className="mt-1 text-sm text-zinc-600">Use “Add to List” on any product page to save it here for later.</p>
              <Link
                href="/"
                className="mt-5 inline-block rounded-full bg-amz-yellow px-5 py-2 text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {items.map(({ product: p, createdAt }) => (
                <li key={p.id} className="flex gap-4 py-4">
                  <Link href={`/product/${p.slug}`} tabIndex={-1} aria-hidden className="relative size-28 shrink-0 bg-[#f7f7f7] sm:size-36">
                    <Image src={p.thumbnail} alt="" fill sizes="144px" className="object-contain p-2 mix-blend-multiply" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <Link href={`/product/${p.slug}`} className="line-clamp-2 text-base text-[#0f1111] hover:text-amz-link-hover hover:underline">
                        {p.title}
                      </Link>
                      <RatingStars rating={p.rating} count={p.ratingCount} />
                      <Price value={p.price.toNumber()} className="mt-1" />
                      <p className="mt-0.5 text-xs text-zinc-600">
                        Item added{" "}
                        {createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-3 sm:mt-0 sm:w-40 sm:flex-col sm:items-stretch">
                      {p.stock > 0 ? (
                        <CardAddToCart productId={p.id} title={p.title} />
                      ) : (
                        <p className="text-xs text-zinc-600">Currently unavailable</p>
                      )}
                      <form action={removeFromListAction}>
                        <input type="hidden" name="productId" value={p.id} />
                        <button
                          type="submit"
                          className="h-8 w-full rounded-full border border-[#d5d9d9] bg-white px-3 text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa]"
                        >
                          Delete<span className="sr-only"> {p.title} from your list</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
