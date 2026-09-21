import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Wordmark({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-start gap-1 leading-none", className)}>
      <span className={cn("text-[1.65rem] font-extrabold tracking-[-0.04em]", tone === "light" ? "text-white" : "text-zinc-900")}>
        {site.wordmark}
      </span>
      <span className="mt-0.5 rounded-sm bg-amz-search px-1 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-zinc-900">
        {site.tag}
      </span>
    </span>
  );
}
