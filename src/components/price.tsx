import { cn } from "@/lib/utils";
import { formatPrice, splitPrice } from "@/lib/format";

export function Price({ value, size = "md", className }: {
  value: number;
  size?: "md" | "lg";
  className?: string;
}) {
  const { dollars, cents } = splitPrice(value);
  return (
    <span className={cn("inline-flex items-start leading-none text-zinc-900", className)}>
      <span className="sr-only">{formatPrice(value)}</span>
      <span aria-hidden className={cn("font-medium", size === "lg" ? "mt-1 text-sm" : "mt-0.5 text-xs")}>$</span>
      <span aria-hidden className={cn("font-semibold tracking-tight", size === "lg" ? "text-3xl" : "text-xl")}>
        {dollars}
      </span>
      <span aria-hidden className={cn("font-medium", size === "lg" ? "mt-1 text-sm" : "mt-0.5 text-xs")}>{cents}</span>
    </span>
  );
}
