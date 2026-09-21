import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { currentUser } from "@/auth";
import { CardAddToCart } from "@/components/card-add-to-cart";
import { formatPrice } from "@/lib/format";
import { getOrders, orderDate, STATUS_LABEL } from "@/lib/orders";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/orders");
  const orders = await getOrders(user.id);

  return (
    <div className="bg-amz-page">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <Package className="mx-auto size-10 text-zinc-400" aria-hidden />
            <p className="mt-3 text-lg font-semibold text-zinc-900">No orders yet</p>
            <p className="mt-1 text-sm text-zinc-600">When you place an order, it’ll show up here.</p>
            <Link href="/" className="mt-5 inline-block rounded-full bg-amz-yellow px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amz-yellow-hover">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {orders.map((o) => (
              <li key={o.orderNumber} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                  <dl className="flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-500">Placed</dt>
                      <dd className="font-medium text-zinc-900">{orderDate(o.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-500">Total</dt>
                      <dd className="font-medium tabular-nums text-zinc-900">{formatPrice(o.total)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-zinc-500">Ship to</dt>
                      <dd className="font-medium text-zinc-900">{o.address.fullName}</dd>
                    </div>
                  </dl>
                  <div className="text-right">
                    <p className="text-xs tabular-nums text-zinc-500">Order {o.orderNumber}</p>
                    <Link href={`/orders/${o.orderNumber}`} className="font-medium text-amz-link hover:underline">
                      View order details
                    </Link>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-emerald-700">{STATUS_LABEL[o.status] ?? o.status}</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex items-center gap-3">
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white">
                          {i.imageSnapshot && <Image src={i.imageSnapshot} alt="" fill sizes="48px" className="object-contain p-1" />}
                        </span>
                        <Link href={`/product/${i.product.slug}`} className="line-clamp-1 flex-1 text-sm text-zinc-900 hover:underline">
                          {i.titleSnapshot}
                        </Link>
                        {i.quantity > 1 && <span className="text-xs text-zinc-600">× {i.quantity}</span>}
                        {i.product.stock > 0 && <CardAddToCart productId={i.product.id} title={i.titleSnapshot} label="Buy it again" />}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
