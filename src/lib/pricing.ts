export const FREE_SHIPPING_THRESHOLD = 35;
export const SHIPPING_FEE = 5.99;
export const TAX_RATE = 0.08;
export const MAX_QTY_PER_ITEM = 10;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function orderTotals(subtotal: number) {
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = round2(subtotal * TAX_RATE);
  return { subtotal: round2(subtotal), shippingFee, tax, total: round2(subtotal + shippingFee + tax) };
}
