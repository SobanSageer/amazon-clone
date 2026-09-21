import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { CartCountSync } from "@/components/cart-quantity";
import { formatPrice } from "@/lib/format";
import { getOrder, orderDate, STATUS_LABEL } from "@/lib/orders";

export async function generateMetadata(props: PageProps<"/orders/[orderNumber]">): Promise<Metadata> {
  return { title: `Order ${(await props.params).orderNumber}` };
}

export default async function OrderPage(props: PageProps<"/orders/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const placed = (await props.searchParams).placed === "1";
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/orders/${encodeURIComponent(orderNumber)}`);

  const order = await getOrder(session.user.id, orderNumber);
  if (!order) notFound();
  const a = order.address;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="bg-zinc-100">
      {placed && <CartCountSync count={0} />}
      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 sm:py-8">
        {placed ? (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6" aria-labelledby="thanks">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <h1 id="thanks" className="text-2xl font-bold tracking-tight text-emerald-950">
                  Order placed, thank you!
                </h1>
                <p className="mt-1 text-emerald-900">
                  Your order <strong className="tabular-nums">{order.orderNumber}</strong> is confirmed and will ship to{" "}
                  {a.fullName} in {a.city}, {a.state}. This is a demo, so nothing will actually arrive.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <div>
            <Link href="/orders" className="text-sm font-medium text-sky-700 hover:underline">
              ← Your orders
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Order details</h1>
          </div>
        )}

        <section className="rounded-xl bg-white p-4 sm:p-6" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">
            Order summary
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-zinc-600">Order number</dt>
              <dd className="font-semibold tabular-nums text-zinc-900">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-zinc-600">Placed on</dt>
              <dd className="font-semibold text-zinc-900">{orderDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-600">Status</dt>
              <dd className="font-semibold text-emerald-700">{STATUS_LABEL[order.status] ?? order.status}</dd>
            </div>
            <div>
              <dt className="text-zinc-600">Total</dt>
              <dd className="font-semibold tabular-nums text-zinc-900">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-5 md:grid-cols-[1fr_18rem]">
          <section className="rounded-xl bg-white p-4 sm:p-6" aria-labelledby="items-heading">
            <h2 id="items-heading" className="text-lg font-bold text-zinc-900">
              Items ({itemCount})
            </h2>
            <ul className="mt-3 divide-y divide-zinc-200">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white">
                    {i.imageSnapshot && <Image src={i.imageSnapshot} alt="" fill sizes="64px" className="object-contain p-1" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/product/${i.product.slug}`} className="line-clamp-2 text-sm font-medium text-zinc-900 hover:underline">
                      {i.titleSnapshot}
                    </Link>
                    <span className="text-xs text-zinc-600">
                      Qty {i.quantity} · {formatPrice(i.priceSnapshot)} each
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatPrice(i.priceSnapshot * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-5">
            <section className="rounded-xl bg-white p-4 text-sm sm:p-5" aria-labelledby="ship-heading">
              <h2 id="ship-heading" className="font-bold text-zinc-900">
                Shipping to
              </h2>
              <address className="mt-2 not-italic text-zinc-700">
                <span className="font-medium text-zinc-900">{a.fullName}</span>
                <br />
                {a.street}
                {a.unit ? `, ${a.unit}` : ""}
                <br />
                {a.city}, {a.state} {a.zip}
              </address>
              <h2 className="mt-4 font-bold text-zinc-900">Payment</h2>
              <p className="mt-1 text-zinc-700">
                {order.paymentBrand} ending in {order.paymentLast4}
                <span className="block text-xs text-zinc-500">Simulated — not charged</span>
              </p>
            </section>
            <section className="rounded-xl bg-white p-4 text-sm sm:p-5" aria-labelledby="totals-heading">
              <h2 id="totals-heading" className="font-bold text-zinc-900">
                Order total
              </h2>
              <dl className="mt-2 space-y-1">
                {[
                  ["Items", formatPrice(order.subtotal)],
                  ["Shipping", order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)],
                  ["Tax", formatPrice(order.tax)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-zinc-600">{k}</dt>
                    <dd className="tabular-nums">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-300">
            Continue shopping
          </Link>
          <Link href="/orders" className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
            View all orders
          </Link>
        </div>
      </div>
    </div>
  );
}
