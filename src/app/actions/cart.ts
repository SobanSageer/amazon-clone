"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addItem, getCartCount, getCartOwner, setItemQuantity } from "@/lib/cart";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";

export type AddToCartState =
  | { status: "idle" }
  | { status: "added"; count: number; note?: string }
  | { status: "error"; message: string };

function parse(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const qty = Number(formData.get("quantity") ?? 1);
  const quantity = Number.isInteger(qty) ? Math.min(Math.max(qty, 1), MAX_QTY_PER_ITEM) : 1;
  return { productId, quantity };
}

export async function addToCartAction(_prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  const { productId, quantity } = parse(formData);
  if (!productId) return { status: "error", message: "Something went wrong. Please try again." };

  const owner = await getCartOwner({ create: true });
  const result = await addItem(owner!, productId, quantity);
  if (!result.ok) return { status: "error", message: result.error };

  return {
    status: "added",
    count: await getCartCount(owner),
    note: result.capped ? `You can have up to ${result.cap} of this item in your cart.` : undefined,
  };
}

export async function setQuantityAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!itemId || !Number.isInteger(quantity)) return;
  const owner = await getCartOwner({ create: false });
  if (!owner) return;
  await setItemQuantity(owner, itemId, quantity);
  revalidatePath("/cart");
}

export async function buyNowAction(formData: FormData) {
  const { productId, quantity } = parse(formData);
  if (!productId) return;
  const owner = await getCartOwner({ create: true });
  const result = await addItem(owner!, productId, quantity);
  if (!result.ok) return;
  redirect("/checkout");
}
