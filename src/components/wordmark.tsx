import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-[1.65rem] font-extrabold tracking-[-0.04em] text-m-ink", className)}>
      {site.wordmark}
    </span>
  );
}
