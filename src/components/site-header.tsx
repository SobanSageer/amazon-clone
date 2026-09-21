import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { CategoryNav } from "@/components/category-nav";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-amber-400 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-900"
      >
        Skip to content
      </a>
      <div className="bg-zinc-900 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link
            href="/"
            className="rounded-sm text-2xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            {site.name}
            <span className="text-amber-400">.</span>
          </Link>
          <div className="flex-1" />
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <ShoppingCart className="size-6" aria-hidden />
            <span>Cart</span>
          </Link>
        </div>
      </div>
      <CategoryNav />
    </header>
  );
}
