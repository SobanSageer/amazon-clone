import "server-only";
import { db } from "@/lib/db";

const n = (d: { toNumber(): number }) => d.toNumber();

export async function getOrder(userId: string, orderNumber: string) {
  const o = await db.order.findFirst({
    where: { orderNumber, userId },
    include: { address: true, items: { include: { product: { select: { slug: true } } } } },
  });
  if (!o) return null;
  return {
    ...o,
    subtotal: n(o.subtotal),
    tax: n(o.tax),
    shippingFee: n(o.shippingFee),
    total: n(o.total),
    items: o.items.map((i) => ({ ...i, priceSnapshot: n(i.priceSnapshot) })),
  };
}

export async function getOrders(userId: string) {
  const rows = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      total: true,
      address: { select: { fullName: true } },
      items: { select: { id: true, titleSnapshot: true, imageSnapshot: true, quantity: true, product: { select: { slug: true } } } },
    },
  });
  return rows.map((r) => ({ ...r, total: n(r.total) }));
}

export const orderDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export const STATUS_LABEL: Record<string, string> = { placed: "Order placed" };
