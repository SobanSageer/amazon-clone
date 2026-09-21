"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";

// The header is part of statically rendered pages, so the count is fetched on the
// client rather than read from cookies on the server (which would make every page dynamic).
export function CartLink() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/cart/count", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCount(d.count))
      .catch(() => {});
    return () => ctrl.abort();
  }, [pathname]);

  useEffect(() => {
    const onUpdate = (e: Event) => setCount((e as CustomEvent<{ count: number }>).detail.count);
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
  }, []);

  const label = count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      <span className="relative">
        <ShoppingCart className="size-6" aria-hidden />
        {count ? (
          <span
            aria-hidden
            className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-zinc-900"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
      <span aria-hidden>Cart</span>
    </Link>
  );
}
