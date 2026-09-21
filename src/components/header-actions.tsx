"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, MapPin, ShoppingCart, User } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";

type Me = { count: number; user: { name: string } | null; address: { city: string; zip: string } | null };

const MeContext = createContext<{ me: Me | null; setMe: (m: Me | null) => void }>({ me: null, setMe: () => {} });

// The header is part of statically rendered pages, so who's signed in, the cart count
// and the delivery location are fetched on the client rather than read from cookies on
// the server (which would make every page dynamic).
export function MeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/me", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => d && setMe(d))
      .catch(() => {});
    return () => ctrl.abort();
  }, [pathname]);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail.count;
      setMe((m) => (m ? { ...m, count } : { count, user: null, address: null }));
    };
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
  }, []);

  return <MeContext.Provider value={{ me, setMe }}>{children}</MeContext.Provider>;
}

export const useMe = () => useContext(MeContext);

const navItem =
  "rounded-sm border border-transparent px-1.5 py-1 leading-tight hover:border-white focus-visible:outline-2 focus-visible:outline-amber-400";

export function DeliverTo({ compact = false }: { compact?: boolean }) {
  const { me } = useMe();
  const firstName = me?.user?.name.split(" ")[0];
  const line1 = me?.user && me.address ? `Deliver to ${firstName}` : "Deliver to";
  const line2 = me?.address ? `${me.address.city} ${me.address.zip}` : "United States";
  if (compact) {
    return (
      <p className="flex items-center gap-1.5 bg-[#37475a] px-4 py-2 text-sm text-white">
        <MapPin className="size-4" aria-hidden />
        {line1} — {line2}
      </p>
    );
  }
  return (
    <div className="flex items-end gap-0.5 px-1.5 py-1 text-white">
      <MapPin className="mb-0.5 size-4" aria-hidden />
      <span className="leading-tight">
        <span className="block text-xs text-zinc-300">{line1}</span>
        <span className="block text-sm font-bold">{line2}</span>
      </span>
    </div>
  );
}

export function AccountMenu() {
  const { me, setMe } = useMe();
  const pathname = usePathname();
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(pathname)}`;
  const firstName = me?.user?.name.split(" ")[0];

  return (
    <div className="group relative">
      <Link href={me?.user ? "/orders" : signInHref} className={`${navItem} block text-white`}>
        <span className="block text-xs">{me?.user ? `Hello, ${firstName}` : "Hello, sign in"}</span>
        <span className="flex items-center text-sm font-bold">
          Account & Lists <ChevronDown className="size-3.5 text-zinc-400" aria-hidden />
        </span>
      </Link>
      <div className="invisible absolute right-0 top-full z-50 w-60 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-xl">
          {me?.user ? (
            <>
              <p className="font-bold">Your Account</p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <Link href="/orders" className="hover:text-amz-link-hover hover:underline">
                    Your Orders
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-amz-link-hover hover:underline">
                    Your Cart
                  </Link>
                </li>
                <li>
                  <form action={signOutAction} onSubmit={() => setMe({ count: 0, user: null, address: null })}>
                    <button type="submit" className="hover:text-amz-link-hover hover:underline">
                      Sign Out
                    </button>
                  </form>
                </li>
              </ul>
            </>
          ) : (
            <>
              <Link
                href={signInHref}
                className="block rounded-lg bg-amz-yellow py-1.5 text-center text-sm hover:bg-amz-yellow-hover"
              >
                Sign in
              </Link>
              <p className="mt-2 text-center text-xs">
                New customer?{" "}
                <Link href={`/signin?mode=signup&callbackUrl=${encodeURIComponent(pathname)}`} className="text-amz-link hover:text-amz-link-hover hover:underline">
                  Start here.
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileAccountLink() {
  const { me } = useMe();
  const pathname = usePathname();
  const firstName = me?.user?.name.split(" ")[0];
  return (
    <Link
      href={me?.user ? "/orders" : `/signin?callbackUrl=${encodeURIComponent(pathname)}`}
      className="flex items-center gap-0.5 rounded-sm px-1 py-1 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      <span className="max-w-24 truncate">{me?.user ? firstName : "Sign in"}</span>
      <ChevronRight className="size-4" aria-hidden />
      <User className="size-6" aria-hidden />
    </Link>
  );
}

export function OrdersLink() {
  return (
    <Link href="/orders" className={`${navItem} block text-white`}>
      <span className="block text-xs">Returns</span>
      <span className="block text-sm font-bold">& Orders</span>
    </Link>
  );
}

export function CartButton() {
  const { me } = useMe();
  const count = me?.count ?? 0;
  return (
    <Link
      href="/cart"
      aria-label={count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
      className={`${navItem} flex items-end text-white`}
    >
      <span className="relative">
        <ShoppingCart className="size-8" strokeWidth={1.75} aria-hidden />
        <span aria-hidden className="absolute -top-1.5 left-1/2 -translate-x-[40%] text-base font-bold text-[#f08804]">
          {count > 99 ? "99+" : count}
        </span>
      </span>
      <span aria-hidden className="hidden text-sm font-bold sm:inline">
        Cart
      </span>
    </Link>
  );
}
