import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-zinc-900 text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link
          href="/"
          className="rounded-sm text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {site.name}
        </Link>
        <div className="flex-1" />
        <Link
          href="/cart"
          className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <ShoppingCart className="size-5" aria-hidden />
          <span>Cart</span>
        </Link>
      </div>
    </header>
  );
}
