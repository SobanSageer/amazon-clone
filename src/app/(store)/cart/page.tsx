import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CartCountSync, CartQuantity, CartRemove } from "@/components/cart-quantity";
import { Price } from "@/components/price";
import { getCartItems, getCartOwner } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, MAX_QTY_PER_ITEM } from "@/lib/pricing";

export const metadata: Metadata = { title: "Shopping Cart" };

function Subtotal({ count, amount, className }: { count: number; amount: number; className?: string }) {
  return (
    <p className={className}>
      Subtotal ({count} {count === 1 ? "item" : "items"}): <span className="font-bold">{formatPrice(amount)}</span>
    </p>
  );
}

export default async function CartPage() {
  const items = await getCartItems(await getCartOwner({ create: false }));
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.product.price, 0);
  const toFree = FREE_SHIPPING_THRESHOLD - subtotal;

  if (items.length === 0) {
    return (
      <div className="bg-amz-page px-4 py-6">
        <CartCountSync count={0} />
        <div className="mx-auto max-w-[1500px] bg-white p-6 sm:p-8">
          <h1 className="text-[28px] font-normal leading-tight text-[#0f1111]">Your Amazon Clone Cart is empty</h1>
          <p className="mt-2 text-sm text-[#0f1111]">
            Your Shopping Cart lives to serve. Give it purpose — fill it with groceries, clothing, household supplies,
            electronics, and more. You don’t need an account to start.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-amz-yellow px-5 py-2 text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover">
              Continue shopping
            </Link>
            <Link href="/search" className="rounded-full border border-[#d5d9d9] bg-white px-5 py-2 text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa]">
              Browse all products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amz-page">
      <CartCountSync count={itemCount} />
      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[1fr_18.5rem] lg:items-start">
        <section aria-labelledby="cart-heading" className="order-2 bg-white px-5 py-4 lg:order-1">
          <div className="flex items-end justify-between border-b border-zinc-200 pb-1">
            <h1 id="cart-heading" className="text-[28px] font-normal leading-tight text-[#0f1111]">
              Shopping Cart
            </h1>
            <span className="hidden text-sm text-zinc-600 sm:block">Price</span>
          </div>
          <ul className="divide-y divide-zinc-200">
            {items.map((item) => {
              const max = Math.max(1, Math.min(item.product.stock, MAX_QTY_PER_ITEM));
              const inStock = item.product.stock >= 10;
              return (
                <li key={item.id} className="flex gap-4 py-4">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="relative size-28 shrink-0 bg-[#f7f7f7] sm:size-44"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <Image src={item.product.thumbnail} alt="" fill sizes="176px" className="object-contain p-2 mix-blend-multiply" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="line-clamp-2 text-base leading-snug text-[#0f1111] hover:text-amz-link-hover hover:underline sm:text-lg"
                      >
                        {item.product.title}
                      </Link>
                      <p className={`mt-0.5 text-xs ${inStock ? "text-[#007600]" : "text-amz-deal"}`}>
                        {inStock ? "In Stock" : `Only ${item.product.stock} left in stock - order soon.`}
                      </p>
                      <p className="text-xs text-zinc-600">Eligible for FREE Shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <CartQuantity itemId={item.id} quantity={item.quantity} max={max} title={item.product.title} />
                        <span className="h-4 w-px bg-zinc-300" aria-hidden />
                        <CartRemove itemId={item.id} title={item.product.title} />
                      </div>
                    </div>
                    <div className="order-first sm:order-none sm:text-right">
                      <Price value={item.product.price} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Subtotal count={itemCount} amount={subtotal} className="border-t border-zinc-200 pt-2 text-right text-lg text-[#0f1111]" />
        </section>

        <div className="order-1 bg-white p-5 lg:sticky lg:top-4 lg:order-2">
          {toFree > 0 ? (
            <div className="mb-3 text-xs">
              <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-zinc-200" aria-hidden>
                <div className="h-full rounded-full bg-[#067d62]" style={{ width: `${(subtotal / FREE_SHIPPING_THRESHOLD) * 100}%` }} />
              </div>
              Add <span className="font-bold text-amz-deal">{formatPrice(toFree)}</span> of eligible items to your order to qualify
              for FREE Shipping.
            </div>
          ) : (
            <p className="mb-3 flex gap-1.5 text-xs text-[#067d62]">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              <span>
                <span className="font-bold">Your order qualifies for FREE Shipping.</span>{" "}
                <span className="text-zinc-700">Choose this option at checkout.</span>
              </span>
            </p>
          )}
          <Subtotal count={itemCount} amount={subtotal} className="text-lg text-[#0f1111]" />
          <Link
            href="/checkout"
            className="mt-3 flex h-9 items-center justify-center rounded-full bg-amz-yellow text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185]"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
