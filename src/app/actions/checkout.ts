"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { getCartItems } from "@/lib/cart";
import { db } from "@/lib/db";
import { cardBrand, digitsOnly, validateCard, type CardErrors } from "@/lib/payment";
import { orderTotals } from "@/lib/pricing";
import { readAddress, toAddressData, type AddressErrors, type AddressInput } from "@/lib/address";
import { Prisma } from "@/generated/prisma/client";

export type CheckoutState = {
  error?: string;
  addressErrors?: AddressErrors & { addressId?: string };
  cardErrors?: CardErrors;
  address?: Partial<AddressInput>;
};

class CheckoutError extends Error {}

function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `NL-${ymd}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
}

export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/checkout");

  // Address: a saved one the user owns, or a new one they just typed.
  const addressChoice = String(formData.get("addressId") ?? "new");
  let addressId: string | null = null;
  let newAddress: AddressInput | null = null;
  if (addressChoice !== "new") {
    const owned = await db.address.findFirst({ where: { id: addressChoice, userId: user.id, archived: false }, select: { id: true } });
    if (!owned) return { addressErrors: { addressId: "Choose a shipping address." } };
    addressId = owned.id;
  } else {
    const { a, errors } = readAddress(formData);
    if (Object.keys(errors).length) return { addressErrors: errors, address: a };
    newAddress = a;
  }

  const card = {
    name: String(formData.get("cardName") ?? ""),
    number: String(formData.get("cardNumber") ?? ""),
    expiry: String(formData.get("cardExpiry") ?? ""),
    cvc: String(formData.get("cardCvc") ?? ""),
  };
  const cardErrors = validateCard(card);
  if (Object.keys(cardErrors).length) return { cardErrors, address: newAddress ?? undefined };

  const items = await getCartItems({ userId: user.id });
  if (!items.length) return { error: "Your cart is empty." };

  const totals = orderTotals(items.reduce((s, i) => s + i.quantity * i.product.price, 0));
  const digits = digitsOnly(card.number);

  let orderNumber = "";
  try {
    for (let attempt = 0; attempt < 3 && !orderNumber; attempt++) {
      const candidate = newOrderNumber();
      try {
        await db.$transaction(async (tx) => {
          const shipTo =
            addressId ??
            (await tx.address.create({ data: { ...toAddressData(newAddress!), userId: user.id }, select: { id: true } })).id;

          // Conditional decrement: fails instead of overselling if stock moved underneath us.
          for (const i of items) {
            const { count } = await tx.product.updateMany({
              where: { id: i.product.id, stock: { gte: i.quantity } },
              data: { stock: { decrement: i.quantity } },
            });
            if (count === 0) {
              throw new CheckoutError(
                i.product.stock > 0
                  ? `Only ${i.product.stock} of “${i.product.title}” left. Update the quantity in your cart.`
                  : `“${i.product.title}” just sold out. Remove it from your cart to continue.`,
              );
            }
          }

          await tx.order.create({
            data: {
              orderNumber: candidate,
              userId: user.id,
              addressId: shipTo,
              ...totals,
              paymentBrand: cardBrand(digits),
              paymentLast4: digits.slice(-4),
              items: {
                create: items.map((i) => ({
                  productId: i.product.id,
                  titleSnapshot: i.product.title,
                  priceSnapshot: i.product.price,
                  imageSnapshot: i.product.thumbnail,
                  quantity: i.quantity,
                })),
              },
            },
          });
          await tx.cartItem.deleteMany({ where: { userId: user.id, savedForLater: false } });
        }, { timeout: 15_000 });
        orderNumber = candidate;
      } catch (err) {
        const clash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!clash) throw err;
      }
    }
  } catch (err) {
    if (err instanceof CheckoutError) return { error: err.message, address: newAddress ?? undefined };
    throw err;
  }
  if (!orderNumber) return { error: "We couldn’t place your order. Please try again." };

  redirect(`/orders/${orderNumber}?placed=1`);
}
