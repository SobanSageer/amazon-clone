import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";

const CART_COOKIE = "cart_session";

export type CartOwner = { userId: string } | { sessionId: string };

// Signed-in users own their cart by user id; guests by a random, httpOnly cookie id.
export async function getCartOwner({ create }: { create: boolean }): Promise<CartOwner | null> {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id };

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

// Lines in the active cart (what checkout buys) or the "Saved for later" list.
export async function getCartItems(owner: CartOwner | null, { saved = false } = {}) {
  if (!owner) return [];
  const rows = await db.cartItem.findMany({
    where: { ...ownerWhere(owner), savedForLater: saved },
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantity: true,
      product: { select: { id: true, slug: true, title: true, thumbnail: true, price: true, stock: true, specs: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    product: {
      ...r.product,
      price: r.product.price.toNumber(),
      shipping: (r.product.specs as Record<string, string> | null)?.Shipping,
      specs: undefined,
    },
  }));
}

export type CartLine = Awaited<ReturnType<typeof getCartItems>>[number];

export async function getCartCount(owner: CartOwner | null) {
  if (!owner) return 0;
  const agg = await db.cartItem.aggregate({ where: { ...ownerWhere(owner), savedForLater: false }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}

// Moves a guest's cart into the account they just signed into, summing quantities for
// products already in the account's cart. Call from server actions only (clears a cookie).
export async function mergeGuestCartInto(userId: string) {
  const jar = await cookies();
  const sessionId = jar.get(CART_COOKIE)?.value;
  if (!sessionId) return;

  const guestItems = await db.cartItem.findMany({
    where: { sessionId },
    select: { id: true, productId: true, quantity: true, savedForLater: true, product: { select: { stock: true } } },
  });
  if (guestItems.length) {
    const existing = await db.cartItem.findMany({
      where: { userId, productId: { in: guestItems.map((g) => g.productId) } },
      select: { id: true, productId: true, quantity: true, savedForLater: true },
    });
    const byProduct = new Map(existing.map((e) => [e.productId, e]));
    await db.$transaction([
      ...guestItems.map((g) => {
        const cap = Math.max(1, Math.min(g.product.stock, MAX_QTY_PER_ITEM));
        const mine = byProduct.get(g.productId);
        // Stays "saved for later" only if both sides had it saved.
        return mine
          ? db.cartItem.update({
              where: { id: mine.id },
              data: { quantity: Math.min(cap, mine.quantity + g.quantity), savedForLater: mine.savedForLater && g.savedForLater },
            })
          : db.cartItem.create({
              data: { userId, productId: g.productId, quantity: Math.min(cap, g.quantity), savedForLater: g.savedForLater },
            });
      }),
      db.cartItem.deleteMany({ where: { sessionId } }),
    ]);
  }
  jar.delete(CART_COOKIE);
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

export async function setSavedForLater(owner: CartOwner, itemId: string, saved: boolean) {
  await db.cartItem.updateMany({ where: { id: itemId, ...ownerWhere(owner) }, data: { savedForLater: saved } });
}

// Adds to any quantity already in the cart, capped by stock and the per-item limit.
// A product sitting in "Saved for later" moves back into the cart.
export async function addItem(owner: CartOwner, productId: string, quantity: number) {
  const product = await db.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product || product.stock <= 0) return { ok: false as const, error: "This item is currently unavailable." };

  const cap = Math.min(product.stock, MAX_QTY_PER_ITEM);
  const where = ownerWhere(owner);
  const existing = await db.cartItem.findFirst({ where: { ...where, productId }, select: { id: true, quantity: true, savedForLater: true } });
  const base = existing && !existing.savedForLater ? existing.quantity : 0;
  const next = Math.min(cap, base + quantity);

  if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: next, savedForLater: false } });
  else await db.cartItem.create({ data: { ...where, productId, quantity: next } });

  const capped = base + quantity > cap;
  return { ok: true as const, capped, cap };
}
