import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Product pages are cached for everyone, so the signed-in user's own state on a product
// (their review, whether it's on their list) is asked for from the client.
export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId") ?? "";
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ review: null, inList: false }, { headers: { "Cache-Control": "no-store" } });
  const [review, listItem] = await Promise.all([
    db.review.findUnique({ where: { userId_productId: { userId, productId } }, select: { rating: true } }),
    db.listItem.findUnique({ where: { userId_productId: { userId, productId } }, select: { id: true } }),
  ]);
  return Response.json({ review, inList: Boolean(listItem) }, { headers: { "Cache-Control": "no-store" } });
}
