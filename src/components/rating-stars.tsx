import { Star } from "lucide-react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

function Stars({ rating, className }: { rating: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className={cn("relative inline-flex", className)} aria-hidden>
      <span className="flex text-zinc-300">
        {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-full shrink-0 fill-current" strokeWidth={0} />)}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-amber-500" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-full shrink-0 fill-current" strokeWidth={0} />)}
      </span>
    </span>
  );
}

export function RatingStars({ rating, count, size = "sm" }: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const label = `${rating.toFixed(1)} out of 5 stars${count !== undefined ? `, ${formatCount(count)} ratings` : ""}`;
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={label}>
      <Stars rating={rating} className={size === "md" ? "h-4 w-20" : "h-3.5 w-[4.375rem]"} />
      {count !== undefined && (
        <span aria-hidden className={cn("text-zinc-600", size === "md" ? "text-sm" : "text-xs")}>
          {formatCount(count)}
        </span>
      )}
    </span>
  );
}
