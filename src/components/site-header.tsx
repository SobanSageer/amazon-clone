import Link from "next/link";
import { Suspense } from "react";
import { CategoryNav } from "@/components/category-nav";
import { AccountMenu, CartButton, DeliverTo, MobileAccountLink, OrdersLink } from "@/components/header-actions";
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
    <header className="relative z-40">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-amz-yellow focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-zinc-900"
        >
          Skip to main content
        </a>

        {/* One search box that reflows: its own full-width row on phones, inline on desktop. */}
        <div className="flex flex-wrap items-center gap-x-1 bg-amz-header px-2 pt-1 md:h-[60px] md:flex-nowrap md:pt-0">
          {logo}
          <div className="hidden shrink-0 lg:block">
            <DeliverTo />
          </div>
          <div className="order-last w-full px-0.5 pb-2.5 pt-1.5 md:order-none md:mx-2 md:w-auto md:min-w-0 md:flex-1 md:p-0">
            {search}
          </div>
          <div className="flex-1 md:hidden" />
          <div className="md:hidden">
            <MobileAccountLink />
          </div>
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <div className="hidden md:block">
            <OrdersLink />
          </div>
          <CartButton />
        </div>
        <div className="md:hidden">
          <DeliverTo compact />
        </div>

        <CategoryNav categories={categories} />
    </header>
  );
}
