const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const count = new Intl.NumberFormat("en-US");

export function formatPrice(value: number) {
  return usd.format(value);
}

export function formatCount(value: number) {
  return count.format(value);
}

export function splitPrice(value: number) {
  const [dollars, cents] = value.toFixed(2).split(".");
  return { dollars: count.format(Number(dollars)), cents };
}
