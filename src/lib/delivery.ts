import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";

// Business days from the product's own "Ships in…" text, plus two days in transit.
function businessDaysFor(shipping: string | undefined) {
  const s = (shipping ?? "").toLowerCase();
  if (s.includes("overnight")) return 1;
  if (s.includes("1-2 business")) return 2;
  if (s.includes("3-5 business")) return 5;
  if (s.includes("2 weeks")) return 10;
  if (s.includes("1 week")) return 5;
  if (s.includes("1 month")) return 20;
  return 3;
}

function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

export function deliveryEstimate(shipping: string | undefined, price: number, now = new Date()) {
  const date = addBusinessDays(now, businessDaysFor(shipping) + 2);
  return {
    free: price >= FREE_SHIPPING_THRESHOLD,
    short: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
    long: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }),
  };
}
