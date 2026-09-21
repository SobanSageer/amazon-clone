import { auth } from "@/auth";
import { getCartCount, getCartOwner } from "@/lib/cart";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const [count, address] = await Promise.all([
    getCartCount(await getCartOwner({ create: false })),
    userId
      ? db.address.findFirst({
          where: { userId },
          orderBy: [{ isDefault: "desc" }, { id: "desc" }],
          select: { city: true, zip: true },
        })
      : null,
  ]);
  const user = session?.user ? { name: session.user.name ?? "there" } : null;
  return Response.json({ count, user, address }, { headers: { "Cache-Control": "no-store" } });
}
