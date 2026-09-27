import Link from "next/link";
import { NavDrawer } from "@/components/nav-drawer";

export function CategoryNav({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <nav aria-label="Main" className="flex h-10 items-center gap-1 border-b border-m-border bg-m-muted px-2 text-sm text-m-ink">
      <NavDrawer categories={categories} />
      <ul className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none]">
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`/search?category=${c.slug}`}
              className="block whitespace-nowrap rounded-sm border border-transparent px-2 py-1 hover:border-m-border-strong hover:text-m-accent focus-visible:outline-2 focus-visible:outline-m-accent"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
