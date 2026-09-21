import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product-card";

export function ProductRail({ title, href, products }: {
  title: string;
  href?: string;
  products: ProductCardData[];
}) {
  const headingId = `rail-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-xl font-bold leading-tight text-[#0f1111]">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 rounded-sm text-sm font-medium text-amz-link hover:text-amz-link-hover hover:underline">
            See more<span className="sr-only"> {title}</span>
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:-mx-5 sm:px-5">
        {products.map((p) => (
          <li key={p.slug} className="w-[40vw] max-w-48 shrink-0 snap-start sm:w-44">
            <ProductCard product={p} variant="rail" />
          </li>
        ))}
      </ul>
    </section>
  );
}
