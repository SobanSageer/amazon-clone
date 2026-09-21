"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShoppingCart, User } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";

type Me = { count: number; user: { name: string } | null };

// The header is part of statically rendered pages, so who's signed in and the cart
// count are fetched on the client rather than read from cookies on the server (which
// would make every page dynamic).
export function HeaderActions() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/me", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => d && setMe(d))
      .catch(() => {});
    if (menuRef.current) menuRef.current.open = false;
    return () => ctrl.abort();
  }, [pathname]);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail.count;
      setMe((m) => (m ? { ...m, count } : { count, user: null }));
    };
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
  }, []);

  const count = me?.count ?? 0;
  const firstName = me?.user?.name.split(" ")[0];
  const itemLink = "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400";

  return (
    <div className="flex items-center gap-1">
      {me?.user ? (
        <details ref={menuRef} className="relative">
          <summary className={`${itemLink} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
            <User className="size-5" aria-hidden />
            <span className="max-w-24 truncate">Hi, {firstName}</span>
            <ChevronDown className="size-4" aria-hidden />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 text-sm text-zinc-900 shadow-lg">
            <Link href="/orders" className="block px-3 py-2 hover:bg-zinc-100">
              Your orders
            </Link>
            <form action={signOutAction} onSubmit={() => setMe({ count: 0, user: null })}>
              <button type="submit" className="block w-full px-3 py-2 text-left hover:bg-zinc-100">
                Sign out
              </button>
            </form>
          </div>
        </details>
      ) : me ? (
        <Link href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`} className={itemLink}>
          <User className="size-5" aria-hidden />
          Sign in
        </Link>
      ) : null}

      <Link
        href="/cart"
        aria-label={count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
        className={itemLink}
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
        <span aria-hidden className="hidden sm:inline">
          Cart
        </span>
      </Link>
    </div>
  );
}
