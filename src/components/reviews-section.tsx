import { UserCircle2 } from "lucide-react";
import { RatingStars } from "@/components/rating-stars";
import { ReviewForm } from "@/components/review-form";
import { formatCount } from "@/lib/format";
import type { ReviewRow } from "@/lib/reviews";

export function ReviewsSection({
  productId,
  rating,
  ratingCount,
  reviews,
}: {
  productId: string;
  rating: number;
  ratingCount: number;
  reviews: ReviewRow[];
}) {
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mt-10 grid scroll-mt-4 gap-8 border-t border-zinc-200 pt-8 lg:grid-cols-[18rem_1fr]">
      <div>
        <h2 id="reviews-heading" className="text-2xl font-bold text-[#0f1111]">
          Customer reviews
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <RatingStars rating={rating} size="md" showValue={false} />
          <span className="text-lg text-[#0f1111]">{rating.toFixed(1)} out of 5</span>
        </div>
        <p className="mt-1 text-sm text-zinc-600">{formatCount(ratingCount)} global ratings</p>
        <hr className="my-5 border-zinc-200" />
        <h3 className="text-lg font-bold text-[#0f1111]">Review this product</h3>
        <p className="mb-3 text-sm text-[#0f1111]">Share your thoughts with other customers</p>
        <ReviewForm productId={productId} />
      </div>

      <div>
        <h3 className="text-lg font-bold text-[#0f1111]">
          {reviews.length ? "Top reviews" : "No written reviews yet"}
        </h3>
        {reviews.length === 0 && <p className="mt-1 text-sm text-zinc-600">Be the first to tell others what you think.</p>}
        <ul className="mt-4 flex flex-col gap-6">
          {reviews.map((r) => (
            <li key={r.id}>
              <p className="flex items-center gap-2 text-[13px] text-[#0f1111]">
                <UserCircle2 className="size-8 text-zinc-400" strokeWidth={1.25} aria-hidden />
                {r.authorName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <RatingStars rating={r.rating} showValue={false} />
                {r.title && <span className="text-sm font-bold text-[#0f1111]">{r.title}</span>}
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Reviewed on{" "}
                {r.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
              </p>
              {r.verified && <p className="text-xs font-bold text-[#c45500]">Verified Purchase</p>}
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#0f1111]">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
