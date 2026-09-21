import { Star } from "lucide-react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

function StarRow({ className }: { className: string }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("shrink-0 fill-current", className)} strokeWidth={0} />
      ))}
    </span>
  );
}

function Stars({ rating, size }: { rating: number; size: "sm" | "md" }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const starCls = size === "md" ? "size-4" : "size-3.5";
  return (
    <span className="relative inline-flex shrink-0" aria-hidden>
      <span className="text-zinc-300">
        <StarRow className={starCls} />
      </span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-amz-star" style={{ width: `${pct}%` }}>
        <StarRow className={starCls} />
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
      <Stars rating={rating} size={size} />
      {count !== undefined && (
        <span aria-hidden className={cn("text-amz-link", size === "md" ? "text-sm" : "text-xs")}>
          {formatCount(count)}
        </span>
      )}
    </span>
  );
}
