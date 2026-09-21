import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { CheckoutForm } from "@/components/checkout-form";
import { getCartItems } from "@/lib/cart";
import { db } from "@/lib/db";
import { orderTotals } from "@/lib/pricing";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/checkout");

  const items = await getCartItems({ userId: user.id });
  if (!items.length) redirect("/cart");

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
    take: 5,
    select: { id: true, fullName: true, street: true, unit: true, city: true, state: true, zip: true, phone: true },
  });
  const subtotal = items.reduce((s, i) => s + i.quantity * i.product.price, 0);

  return (
    <div className="bg-amz-page">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-zinc-900">Checkout</h1>
        <CheckoutForm
          addresses={addresses}
          items={items}
          subtotal={subtotal}
          total={orderTotals(subtotal).total}
        />
      </div>
    </div>
  );
}
