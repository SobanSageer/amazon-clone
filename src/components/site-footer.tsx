import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-zinc-50 text-sm text-zinc-600">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p>
          {site.name} is a portfolio demo. Payments are simulated — no real charges are made,
          and you should never enter real card details.
        </p>
      </div>
    </footer>
  );
}
