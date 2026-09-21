import "server-only";
import { db } from "@/lib/db";

export async function getReviews(productId: string) {
  return db.review.findMany({
    where: { productId },
    orderBy: [{ createdAt: "desc" }],
    take: 30,
    select: { id: true, authorName: true, rating: true, title: true, body: true, verified: true, createdAt: true },
  });
}

export type ReviewRow = Awaited<ReturnType<typeof getReviews>>[number];

export async function hasPurchased(userId: string, productId: string) {
  const hit = await db.orderItem.findFirst({
    where: { productId, order: { userId, status: { not: "cancelled" } } },
    select: { id: true },
  });
  return Boolean(hit);
}
