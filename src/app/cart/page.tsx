import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { CartCountSync, CartQuantity, CartRemove } from "@/components/cart-quantity";
import { OrderSummary } from "@/components/order-summary";
import { Price } from "@/components/price";
import { getCartItems, getCartOwner } from "@/lib/cart";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const items = await getCartItems(await getCartOwner({ create: false }));
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.product.price, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <CartCountSync count={0} />
        <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
          <ShoppingCart className="mx-auto size-10 text-zinc-400" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-zinc-600">You don’t need an account to start shopping. Items you add stay here.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-300">
              Continue shopping
            </Link>
            <Link href="/search" className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
              Browse all products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-100">
      <CartCountSync count={itemCount} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:py-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section aria-labelledby="cart-heading" className="order-2 rounded-xl bg-white p-4 sm:p-6 lg:order-1">
          <h1 id="cart-heading" className="text-2xl font-bold tracking-tight text-zinc-900">
            Shopping cart
          </h1>
          <ul className="mt-4 divide-y divide-zinc-200 border-t border-zinc-200">
            {items.map((item) => {
              const max = Math.max(1, Math.min(item.product.stock, MAX_QTY_PER_ITEM));
              return (
                <li key={item.id} className="flex gap-4 py-4">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white sm:size-32"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <Image src={item.product.thumbnail} alt="" fill sizes="128px" className="object-contain p-2" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <Link href={`/product/${item.product.slug}`} className="line-clamp-2 font-medium text-zinc-900 hover:underline">
                        {item.product.title}
                      </Link>
                      {item.product.stock < 10 && item.product.stock > 0 && (
                        <p className="mt-0.5 text-sm text-orange-700">Only {item.product.stock} left in stock</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <CartQuantity itemId={item.id} quantity={item.quantity} max={max} title={item.product.title} />
                        <CartRemove itemId={item.id} title={item.product.title} />
                      </div>
                    </div>
                    <div className="order-first sm:order-none sm:text-right">
                      <Price value={item.product.price * item.quantity} />
                      {item.quantity > 1 && (
                        <p className="text-xs text-zinc-600">
                          {item.quantity} × ${item.product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="order-1 lg:sticky lg:top-32 lg:order-2">
          <OrderSummary subtotal={subtotal} itemCount={itemCount}>
            <Link
              href="/checkout"
              className="flex h-11 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-zinc-900 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Proceed to checkout
            </Link>
            <p className="mt-2 text-center text-xs text-zinc-600">You’ll sign in or continue as a demo user at the next step.</p>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
