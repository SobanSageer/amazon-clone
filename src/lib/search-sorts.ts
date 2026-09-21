// Kept separate from search.ts so the client-side sort control doesn't pull in the
// database client.
export const SORTS = {
  relevance: "Best match",
  rating: "Avg. customer review",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;

export type Sort = keyof typeof SORTS;
