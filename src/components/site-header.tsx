import Link from "next/link";
import { Suspense } from "react";
import { CategoryNav } from "@/components/category-nav";
import { AccountMenu, CartButton, DeliverTo, MeProvider, MobileAccountLink, OrdersLink } from "@/components/header-actions";
import { SearchBox, SearchBoxFallback } from "@/components/search-box";
import { Wordmark } from "@/components/wordmark";
import { getCategories } from "@/lib/catalog";
import { site } from "@/lib/site";

export async function SiteHeader() {
  const categories = (await getCategories()).map((c) => ({ slug: c.slug, name: c.name }));

  const logo = (
    <Link
      href="/"
      aria-label={`${site.name} home`}
      className="shrink-0 rounded-sm border border-transparent px-1.5 pb-1 pt-2 hover:border-white focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      <Wordmark />
    </Link>
  );
  const search = (
    <Suspense fallback={<SearchBoxFallback />}>
      <SearchBox categories={categories} />
    </Suspense>
  );

  return (
    <MeProvider>
      <header className="relative z-40">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-amz-yellow focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-zinc-900"
        >
          Skip to main content
        </a>

        {/* Desktop: one row, like amazon.com */}
        <div className="hidden h-[60px] items-center gap-1 bg-amz-header px-2 md:flex">
          {logo}
          <div className="hidden shrink-0 lg:block">
            <DeliverTo />
          </div>
          <div className="mx-2 min-w-0 flex-1">{search}</div>
          <AccountMenu />
          <OrdersLink />
          <CartButton />
        </div>

        {/* Phone: logo + account + cart, then full-width search, then deliver-to strip */}
        <div className="bg-amz-header md:hidden">
          <div className="flex items-center gap-1 px-2 pt-1">
            {logo}
            <div className="flex-1" />
            <MobileAccountLink />
            <CartButton />
          </div>
          <div className="px-2.5 pb-2.5 pt-1.5">{search}</div>
        </div>
        <div className="md:hidden">
          <DeliverTo compact />
        </div>

        <CategoryNav categories={categories} />
      </header>
    </MeProvider>
  );
}
