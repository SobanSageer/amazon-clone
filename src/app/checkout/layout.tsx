import Link from "next/link";
import { Lock, ShoppingCart } from "lucide-react";
import { MinimalFooter } from "@/components/minimal-footer";
import { Wordmark } from "@/components/wordmark";
import { site } from "@/lib/site";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-amz-header text-white">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4">
          <Link href="/" aria-label={`${site.name} home`} className="rounded-sm px-1 py-1 focus-visible:outline-2 focus-visible:outline-amber-400">
            <Wordmark />
          </Link>
          <p className="flex items-center justify-center gap-2 text-lg sm:text-2xl">
            <Lock className="hidden size-5 sm:block" aria-hidden />
            Secure checkout
          </p>
          <Link href="/cart" className="flex items-center gap-1 rounded-sm px-1 py-1 text-sm font-bold hover:outline hover:outline-1 hover:outline-white focus-visible:outline-2 focus-visible:outline-amber-400">
            <ShoppingCart className="size-7" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </div>
      </header>
      <main id="main" className="flex-1 bg-amz-page">
        {children}
      </main>
      <MinimalFooter />
    </>
  );
}
