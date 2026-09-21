"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { deleteReviewAction, submitReviewAction, type ReviewFormState } from "@/app/actions/reviews";
import { useMe } from "@/components/header-actions";
import { cn } from "@/lib/utils";

const LABELS = ["", "I hate it", "I don’t like it", "It’s okay", "I like it", "I love it"];

export function ReviewForm({ productId }: { productId: string }) {
  const { me } = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReviewAction, { status: "idle" });
  // undefined = not checked yet, null = no review of mine on this product.
  const [mine, setMine] = useState<{ rating: number } | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const signedIn = Boolean(me?.user);

  useEffect(() => {
    if (!signedIn) return;
    const ctrl = new AbortController();
    fetch(`/api/product-state?productId=${encodeURIComponent(productId)}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMine(d.review))
      .catch(() => {});
    return () => ctrl.abort();
  }, [signedIn, productId, state.status]);

  useEffect(() => {
    if (state.status === "done") router.refresh();
  }, [state, router]);

  const pillBtn =
    "flex h-8 w-full items-center justify-center rounded-full border border-[#d5d9d9] bg-white text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185]";

  if (signedIn && mine) {
    return (
      <div className="flex flex-col gap-2">
        <p className="rounded-lg bg-[#f0f8f6] p-3 text-sm text-[#067d62]">
          {state.status === "done" ? "Thanks! Your review is live." : `You rated this product ${mine.rating} out of 5.`}
        </p>
        <form
          action={async (data) => {
            setDeleting(true);
            await deleteReviewAction(data);
            setMine(null);
            setDeleting(false);
            setOpen(false);
            setRating(0);
            router.refresh();
          }}
        >
          <input type="hidden" name="productId" value={productId} />
          <button type="submit" disabled={deleting} className="text-[13px] text-amz-link hover:text-amz-link-hover hover:underline disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete your review"}
          </button>
        </form>
      </div>
    );
  }
  if (!me?.user) {
    return (
      <Link href={`/signin?callbackUrl=${encodeURIComponent(pathname + "#reviews")}`} className={pillBtn}>
        Sign in to write a review
      </Link>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={pillBtn}>
        Write a customer review
      </button>
    );
  }

  const fe = state.fieldErrors ?? {};
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="flex flex-col gap-3 rounded-lg border border-[#d5d9d9] p-4"
    >
      <input type="hidden" name="productId" value={productId} />
      {state.message && (
        <p role="alert" className="text-sm text-[#c40000]">
          {state.message}
        </p>
      )}
      <fieldset>
        <legend className="text-sm font-bold text-[#0f1111]">Overall rating</legend>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#007185]"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
                aria-describedby={fe.rating ? "rating-error" : undefined}
              />
              <span className="sr-only">{`${n} star${n > 1 ? "s" : ""}: ${LABELS[n]}`}</span>
              <Star
                className={cn("size-7", n <= rating ? "fill-amz-star text-amz-star" : "fill-none text-zinc-400")}
                strokeWidth={1.5}
                aria-hidden
              />
            </label>
          ))}
          <span className="ml-2 text-sm text-zinc-600" aria-hidden>
            {LABELS[rating]}
          </span>
        </div>
        {fe.rating && (
          <p id="rating-error" className="mt-1 text-xs text-[#c40000]">
            {fe.rating}
          </p>
        )}
      </fieldset>
      <label className="text-sm font-bold text-[#0f1111]">
        Add a headline <span className="font-normal text-zinc-500">(optional)</span>
        <input
          name="title"
          maxLength={100}
          placeholder="What’s most important to know?"
          aria-invalid={fe.title ? true : undefined}
          className="mt-1 h-9 w-full rounded-[3px] border border-[#a6a6a6] px-2 text-base font-normal focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,.5)] focus:outline-none sm:text-sm"
        />
        {fe.title && <span className="mt-1 block text-xs font-normal text-[#c40000]">{fe.title}</span>}
      </label>
      <label className="text-sm font-bold text-[#0f1111]">
        Add a written review
        <textarea
          name="body"
          rows={4}
          maxLength={2000}
          placeholder="What did you like or dislike? What did you use this product for?"
          aria-invalid={fe.body ? true : undefined}
          className="mt-1 w-full rounded-[3px] border border-[#a6a6a6] p-2 text-base font-normal focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,.5)] focus:outline-none sm:text-sm"
        />
        {fe.body && <span className="mt-1 block text-xs font-normal text-[#c40000]">{fe.body}</span>}
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-8 items-center gap-2 rounded-full bg-amz-yellow px-5 text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          Submit
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 text-[13px] text-amz-link hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
