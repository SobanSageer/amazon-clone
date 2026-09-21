export const FREE_SHIPPING_THRESHOLD = 35;
export const SHIPPING_FEE = 5.99;
export const MAX_QTY_PER_ITEM = 10;

const round2 = (n: number) => Math.round(n * 100) / 100;

export const SHIPPING_SPEEDS = {
  standard: { label: "Standard Shipping", transitDays: 4 },
  "two-day": { label: "Two-Day Shipping", transitDays: 2, fee: 9.99 },
  "one-day": { label: "One-Day Shipping", transitDays: 1, fee: 14.99 },
} as const;
export type ShippingSpeed = keyof typeof SHIPPING_SPEEDS;

export function isShippingSpeed(v: unknown): v is ShippingSpeed {
  return typeof v === "string" && v in SHIPPING_SPEEDS;
}

export function shippingFeeFor(speed: ShippingSpeed, subtotal: number) {
  if (speed === "standard") return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return SHIPPING_SPEEDS[speed].fee;
}

// State base sales-tax rates (no local add-ons), so this is an estimate like Amazon's.
export const STATE_TAX: Record<string, number> = {
  AL: 0.04, AK: 0, AZ: 0.056, AR: 0.065, CA: 0.0725, CO: 0.029, CT: 0.0635, DE: 0, DC: 0.06,
  FL: 0.06, GA: 0.04, HI: 0.04, ID: 0.06, IL: 0.0625, IN: 0.07, IA: 0.06, KS: 0.065, KY: 0.06,
  LA: 0.0445, ME: 0.055, MD: 0.06, MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07, MO: 0.04225,
  MT: 0, NE: 0.055, NV: 0.0685, NH: 0, NJ: 0.06625, NM: 0.04875, NY: 0.04, NC: 0.0475, ND: 0.05,
  OH: 0.0575, OK: 0.045, OR: 0, PA: 0.06, RI: 0.07, SC: 0.06, SD: 0.042, TN: 0.07, TX: 0.0625,
  UT: 0.061, VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06, WI: 0.05, WY: 0.04,
};

type Promo = { code: string; description: string; minSubtotal?: number } & (
  | { kind: "percent"; value: number }
  | { kind: "amount"; value: number }
  | { kind: "free-shipping" }
);

export const PROMOS: Promo[] = [
  { code: "SAVE10", kind: "percent", value: 0.1, description: "10% off items" },
  { code: "WELCOME5", kind: "amount", value: 5, minSubtotal: 25, description: "$5 off orders of $25+" },
  { code: "FREESHIP", kind: "free-shipping", description: "Free Standard Shipping on any order" },
];

export function findPromo(code: string | null | undefined) {
  const c = (code ?? "").trim().toUpperCase();
  return PROMOS.find((p) => p.code === c) ?? null;
}

// Why a code can't be used right now, or null if it can.
export function promoProblem(code: string, subtotal: number): string | null {
  const promo = findPromo(code);
  if (!promo) return "That promo code isn’t valid.";
  if (promo.minSubtotal && subtotal < promo.minSubtotal) return `${promo.code} needs an order of $${promo.minSubtotal} or more.`;
  return null;
}

export function orderTotals(
  subtotal: number,
  { speed = "standard", state, promoCode }: { speed?: ShippingSpeed; state?: string | null; promoCode?: string | null } = {},
) {
  const promo = promoCode && !promoProblem(promoCode, subtotal) ? findPromo(promoCode) : null;
  let discount = 0;
  if (promo?.kind === "percent") discount = round2(subtotal * promo.value);
  if (promo?.kind === "amount") discount = Math.min(promo.value, subtotal);

  let shippingFee = shippingFeeFor(speed, subtotal);
  if (promo?.kind === "free-shipping" && speed === "standard") shippingFee = 0;

  const taxRate = state && state in STATE_TAX ? STATE_TAX[state] : null;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxRate === null ? 0 : round2(taxable * taxRate);
  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    promoCode: promo?.code ?? null,
    shippingFee: round2(shippingFee),
    taxRate,
    tax,
    total: round2(taxable + shippingFee + tax),
  };
}
