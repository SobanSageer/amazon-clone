import Link from "next/link";
import { site } from "@/lib/site";

// Amazon's sign-in / checkout pages drop the store chrome for a thin legal footer.
export function MinimalFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-6 text-center text-xs text-zinc-600">
      <nav aria-label="Footer" className="flex justify-center gap-5">
        <Link href="/" className="text-amz-link hover:text-amz-link-hover hover:underline">
          Home
        </Link>
        <Link href="/search" className="text-amz-link hover:text-amz-link-hover hover:underline">
          All products
        </Link>
        <Link href="/cart" className="text-amz-link hover:text-amz-link-hover hover:underline">
          Cart
        </Link>
      </nav>
      <p className="mx-auto mt-3 max-w-xl leading-relaxed">{site.disclaimer}</p>
    </footer>
  );
}
