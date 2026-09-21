import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto text-sm">
      <a href="#main" className="block bg-[#37475a] py-3.5 text-center font-medium text-white hover:bg-[#485769]">
        Back to top
      </a>
      <div className="bg-amz-nav text-zinc-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <Wordmark />
            <p className="mt-3 leading-relaxed">{site.disclaimer}</p>
          </div>
          <nav aria-label="Footer" className="flex gap-8">
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="hover:underline">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:underline">
                  Your cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:underline">
                  Your orders
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
