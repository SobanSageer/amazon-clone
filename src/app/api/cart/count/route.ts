import { getCartCount, getCartOwner } from "@/lib/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await getCartCount(await getCartOwner({ create: false }));
  return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
