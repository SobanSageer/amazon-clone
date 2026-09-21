import { auth } from "@/auth";
import { getCartCount, getCartOwner } from "@/lib/cart";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const [count, address, row] = await Promise.all([
    getCartCount(await getCartOwner({ create: false })),
    userId
      ? db.address.findFirst({
          where: { userId, archived: false },
          orderBy: [{ isDefault: "desc" }, { id: "desc" }],
          select: { city: true, zip: true },
        })
      : null,
    // Name from the database, not the session token, so a rename shows up immediately.
    userId ? db.user.findUnique({ where: { id: userId }, select: { name: true } }) : null,
  ]);
  const user = row ? { name: row.name } : null;
  return Response.json({ count, user, address }, { headers: { "Cache-Control": "no-store" } });
}
