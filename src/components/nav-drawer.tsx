"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronRight, Menu, UserCircle2, X } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { useMe } from "@/components/header-actions";

type Category = { slug: string; name: string };

export function NavDrawer({ categories }: { categories: Category[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { me, setMe } = useMe();

  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  const close = () => ref.current?.close();
  const row =
    "flex items-center justify-between px-6 py-3 text-sm text-m-ink hover:bg-m-muted";

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1 text-sm font-bold text-m-ink hover:border-m-border-strong focus-visible:outline-2 focus-visible:outline-m-accent"
      >
        <Menu className="size-5" aria-hidden />
        All
      </button>
      <dialog
        ref={ref}
        aria-label="All categories and account"
        onClick={(e) => e.target === ref.current && close()}
        className="fixed inset-y-0 left-0 m-0 h-full max-h-none w-[85vw] max-w-sm bg-m-surface p-0 backdrop:bg-black/70 open:animate-in open:slide-in-from-left"
      >
        {/* Layout lives on this wrapper, never on the <dialog>: `display:flex` on the
            dialog would override the UA's display:none and pin it open. */}
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center gap-2 bg-m-accent px-6 py-3.5 text-lg font-bold text-white">
            <UserCircle2 className="size-7" aria-hidden />
            <span className="truncate">
              Hello, {me?.user ? me.user.name.split(" ")[0] : "sign in"}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="absolute right-3 top-3 rounded-sm p-1 text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="size-6" aria-hidden />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <nav
              aria-label="Shop by category"
              className="border-b border-m-border py-2"
            >
              <h2 className="px-6 py-2 text-lg font-bold text-m-ink">
                Shop by Category
              </h2>
              <ul>
                <li>
                  <Link href="/search" className={row}>
                    All products{" "}
                    <ChevronRight className="size-4 text-m-dim" aria-hidden />
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/search?category=${c.slug}`} className={row}>
                      {c.name}{" "}
                      <ChevronRight className="size-4 text-m-dim" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="py-2">
              <h2 className="px-6 py-2 text-lg font-bold text-m-ink">
                Help & Settings
              </h2>
              <ul>
                <li>
                  <Link href="/orders" className={row}>
                    Your Orders
                  </Link>
                </li>
                <li>
                  <Link href="/list" className={row}>
                    Your List
                  </Link>
                </li>
                <li>
                  <Link href="/account" className={row}>
                    Your Account
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className={row}>
                    Your Cart
                  </Link>
                </li>
                <li>
                  {me?.user ? (
                    <form
                      action={signOutAction}
                      onSubmit={() =>
                        setMe({ count: 0, user: null, address: null })
                      }
                    >
                      <button
                        type="submit"
                        className={`${row} w-full text-left`}
                      >
                        Sign Out
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                      className={row}
                    >
                      Sign In
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
