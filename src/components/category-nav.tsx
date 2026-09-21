import Link from "next/link";
import { getCategories } from "@/lib/catalog";

export async function CategoryNav() {
  const categories = await getCategories();
  return (
    <nav aria-label="Shop by category" className="bg-zinc-800">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-1.5 text-sm [scrollbar-width:none] sm:px-3">
        <li className="shrink-0">
          <Link href="/search" className="block rounded-sm px-2 py-1 font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400">
            All products
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`/search?category=${c.slug}`}
              className="block whitespace-nowrap rounded-sm px-2 py-1 text-zinc-200 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
