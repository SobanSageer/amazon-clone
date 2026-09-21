"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/auth";
import { db } from "@/lib/db";
import { hasPurchased } from "@/lib/reviews";

export type ReviewFormState = {
  status: "idle" | "error" | "done";
  message?: string;
  fieldErrors?: Partial<Record<"rating" | "title" | "body", string>>;
};

export async function submitReviewAction(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const user = await currentUser();
  if (!user) return { status: "error", message: "Sign in to write a review." };

  const productId = String(formData.get("productId") ?? "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const fieldErrors: ReviewFormState["fieldErrors"] = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fieldErrors.rating = "Choose a star rating.";
  if (title.length > 100) fieldErrors.title = "Keep the headline under 100 characters.";
  if (body.length < 10) fieldErrors.body = "Tell others a bit more — at least 10 characters.";
  else if (body.length > 2000) fieldErrors.body = "Keep your review under 2,000 characters.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, slug: true } });
  if (!product) return { status: "error", message: "That product no longer exists." };

  const existing = await db.review.findUnique({ where: { userId_productId: { userId: user.id, productId } }, select: { id: true } });
  if (existing) return { status: "error", message: "You’ve already reviewed this product." };

  const verified = await hasPurchased(user.id, productId);

  // Fold the new rating into the product's running average in the same transaction.
  await db.$transaction(async (tx) => {
    await tx.review.create({
      data: { productId, userId: user.id, authorName: user.name, rating, title: title || null, body, verified },
    });
    const p = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { rating: true, ratingCount: true } });
    const count = p.ratingCount + 1;
    await tx.product.update({
      where: { id: productId },
      data: { ratingCount: count, rating: Math.round(((p.rating * p.ratingCount + rating) / count) * 100) / 100 },
    });
  });

  revalidatePath(`/product/${product.slug}`);
  return { status: "done" };
}
