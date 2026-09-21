"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/auth";
import { db } from "@/lib/db";

// Cancels an order that hasn't shipped and puts its items back in stock.
export async function cancelOrderAction(formData: FormData) {
  const user = await currentUser();
  if (!user) return;
  const orderNumber = String(formData.get("orderNumber") ?? "");
  let restocked: string[] = [];

  await db.$transaction(async (tx) => {
    // Conditional update so a double-submit can't restock twice.
    const { count } = await tx.order.updateMany({
      where: { orderNumber, userId: user.id, status: "placed" },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    if (count === 0) return;
    const items = await tx.orderItem.findMany({
      where: { order: { orderNumber } },
      select: { productId: true, quantity: true, product: { select: { slug: true } } },
    });
    for (const i of items) {
      await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
    }
    restocked = items.map((i) => i.product.slug);
  });

  for (const slug of restocked) revalidatePath(`/product/${slug}`);
  revalidatePath("/");

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderNumber}`);
}
