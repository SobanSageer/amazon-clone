import { auth } from "@/auth";
import { getCartCount, getCartOwner } from "@/lib/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const count = await getCartCount(await getCartOwner({ create: false }));
  const user = session?.user ? { name: session.user.name ?? "there" } : null;
  return Response.json({ count, user }, { headers: { "Cache-Control": "no-store" } });
}
