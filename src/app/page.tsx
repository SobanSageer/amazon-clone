import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
      <p className="mt-2 text-zinc-600">Storefront coming soon.</p>
    </div>
  );
}
