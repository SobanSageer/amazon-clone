import { suggestProducts } from "@/lib/search";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const suggestions = await suggestProducts(q);
  return Response.json(suggestions, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
