import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";

const CART_COOKIE = "cart_session";

export type CartOwner = { userId: string } | { sessionId: string };

// Guests are identified by a random, httpOnly cookie id. Signed-in owners replace this
// in Phase 4; the rest of the cart code only ever sees a CartOwner.
export async function getCartOwner({ create }: { create: boolean }): Promise<CartOwner | null> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) return { sessionId: existing };
  if (!create) return null;
  const sessionId = randomUUID();
  jar.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { sessionId };
}

export function ownerWhere(owner: CartOwner) {
  return "userId" in owner ? { userId: owner.userId } : { sessionId: owner.sessionId };
}

export async function getCartItems(owner: CartOwner | null) {
  if (!owner) return [];
  const rows = await db.cartItem.findMany({
    where: ownerWhere(owner),
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantity: true,
      product: { select: { id: true, slug: true, title: true, thumbnail: true, price: true, stock: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    product: { ...r.product, price: r.product.price.toNumber() },
  }));
}

export type CartLine = Awaited<ReturnType<typeof getCartItems>>[number];

export async function getCartCount(owner: CartOwner | null) {
  if (!owner) return 0;
  const agg = await db.cartItem.aggregate({ where: ownerWhere(owner), _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}

// Sets an existing line's quantity (0 removes it). Scoped by owner so one visitor can
// never touch another's cart by guessing an item id.
export async function setItemQuantity(owner: CartOwner, itemId: string, quantity: number) {
  const item = await db.cartItem.findFirst({
    where: { id: itemId, ...ownerWhere(owner) },
    select: { id: true, product: { select: { stock: true } } },
  });
  if (!item) return;
  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    return;
  }
  const cap = Math.max(1, Math.min(item.product.stock, MAX_QTY_PER_ITEM));
  await db.cartItem.update({ where: { id: item.id }, data: { quantity: Math.min(quantity, cap) } });
}

// Adds to any quantity already in the cart, capped by stock and the per-item limit.
export async function addItem(owner: CartOwner, productId: string, quantity: number) {
  const product = await db.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product || product.stock <= 0) return { ok: false as const, error: "This item is currently unavailable." };

  const cap = Math.min(product.stock, MAX_QTY_PER_ITEM);
  const where = ownerWhere(owner);
  const existing = await db.cartItem.findFirst({ where: { ...where, productId }, select: { id: true, quantity: true } });
  const next = Math.min(cap, (existing?.quantity ?? 0) + quantity);

  if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: next } });
  else await db.cartItem.create({ data: { ...where, productId, quantity: next } });

  const capped = (existing?.quantity ?? 0) + quantity > cap;
  return { ok: true as const, capped, cap };
}
