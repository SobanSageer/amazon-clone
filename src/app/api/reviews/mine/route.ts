import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Product pages are cached for everyone, so "is there a review of mine here?" is asked
// from the client.
export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId") ?? "";
  const userId = (await auth())?.user?.id;
  const review = userId
    ? await db.review.findUnique({ where: { userId_productId: { userId, productId } }, select: { rating: true } })
    : null;
  return Response.json({ review }, { headers: { "Cache-Control": "no-store" } });
}
