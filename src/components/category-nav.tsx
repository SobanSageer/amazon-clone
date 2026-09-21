import Link from "next/link";
import { NavDrawer } from "@/components/nav-drawer";

export function CategoryNav({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <nav aria-label="Main" className="flex h-10 items-center gap-1 bg-amz-nav px-2 text-sm text-white">
      <NavDrawer categories={categories} />
      <ul className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none]">
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`/search?category=${c.slug}`}
              className="block whitespace-nowrap rounded-sm border border-transparent px-2 py-1 hover:border-white focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
