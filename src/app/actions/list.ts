"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/auth";
import { db } from "@/lib/db";

export async function toggleListAction(productId: string): Promise<{ inList: boolean } | { signIn: true }> {
  const user = await currentUser();
  if (!user) return { signIn: true };
  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await db.listItem.findUnique({ where: key, select: { id: true } });
  if (existing) await db.listItem.delete({ where: { id: existing.id } });
  else if (await db.product.findUnique({ where: { id: productId }, select: { id: true } })) {
    await db.listItem.create({ data: { userId: user.id, productId } });
  }
  revalidatePath("/list");
  return { inList: !existing };
}

export async function removeFromListAction(formData: FormData) {
  const user = await currentUser();
  if (!user) return;
  const productId = String(formData.get("productId") ?? "");
  await db.listItem.deleteMany({ where: { userId: user.id, productId } });
  revalidatePath("/list");
}
