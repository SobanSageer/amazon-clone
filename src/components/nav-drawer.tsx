"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronRight, Menu, UserCircle2, X } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { useMe } from "@/components/header-actions";

type Category = { slug: string; name: string };

// Amazon's "☰ All" side menu. A native modal <dialog> gives focus trapping, Escape to
// close and an inert background for free.
export function NavDrawer({ categories }: { categories: Category[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { me, setMe } = useMe();

  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  const close = () => ref.current?.close();
  const row = "flex items-center justify-between px-6 py-3 text-sm text-zinc-900 hover:bg-zinc-100";

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1 text-sm font-bold text-white hover:border-white focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        <Menu className="size-5" aria-hidden />
        All
      </button>
      <dialog
        ref={ref}
        aria-label="All categories and account"
        onClick={(e) => e.target === ref.current && close()}
        className="fixed inset-y-0 left-0 m-0 h-full max-h-none w-[85vw] max-w-sm bg-white p-0 backdrop:bg-black/70 open:animate-in open:slide-in-from-left"
      >
        <div className="flex items-center gap-2 bg-amz-nav px-6 py-3.5 text-lg font-bold text-white">
          <UserCircle2 className="size-7" aria-hidden />
          <span className="truncate">Hello, {me?.user ? me.user.name.split(" ")[0] : "sign in"}</span>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-sm p-1 text-white focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <X className="size-6" aria-hidden />
        </button>
        <nav aria-label="Shop by category" className="border-b border-zinc-200 py-2">
          <h2 className="px-6 py-2 text-lg font-bold text-zinc-900">Shop by Category</h2>
          <ul>
            <li>
              <Link href="/search" className={row}>
                All products <ChevronRight className="size-4 text-zinc-500" aria-hidden />
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/search?category=${c.slug}`} className={row}>
                  {c.name} <ChevronRight className="size-4 text-zinc-500" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="py-2">
          <h2 className="px-6 py-2 text-lg font-bold text-zinc-900">Help & Settings</h2>
          <ul>
            <li>
              <Link href="/orders" className={row}>
                Your Orders
              </Link>
            </li>
            <li>
              <Link href="/cart" className={row}>
                Your Cart
              </Link>
            </li>
            <li>
              {me?.user ? (
                <form action={signOutAction} onSubmit={() => setMe({ count: 0, user: null, address: null })}>
                  <button type="submit" className={`${row} w-full text-left`}>
                    Sign Out
                  </button>
                </form>
              ) : (
                <Link href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`} className={row}>
                  Sign In
                </Link>
              )}
            </li>
          </ul>
        </div>
      </dialog>
    </>
  );
}
