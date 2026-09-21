// Kept separate from search.ts so the client-side sort control doesn't pull in the
// database client.
export const SORTS = {
  relevance: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Avg. Customer Review",
} as const;

export type Sort = keyof typeof SORTS;
