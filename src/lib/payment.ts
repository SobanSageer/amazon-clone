// Card-shape validation for the simulated payment form. Shared by the client (live
// formatting/feedback) and the server (the authoritative check). No card data is stored
// beyond brand + last four digits.

export const TEST_CARD = { name: "Test Shopper", number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };

export function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

export function cardBrand(number: string) {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(011|5)/.test(d)) return "Discover";
  return "Card";
}

export function formatCardNumber(input: string) {
  const d = digitsOnly(input).slice(0, 19);
  if (cardBrand(d) === "Amex") return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(input: string) {
  const d = digitsOnly(input).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function luhn(d: string) {
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export type CardFields = { name: string; number: string; expiry: string; cvc: string };
export type CardErrors = Partial<Record<keyof CardFields, string>>;

export function validateCard(c: CardFields, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  if (!c.name.trim()) errors.name = "Enter the name on the card.";

  const d = digitsOnly(c.number);
  if (d.length < 13 || d.length > 19 || !luhn(d)) errors.number = "Enter a valid card number.";

  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry.trim());
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) errors.expiry = "Use MM/YY.";
  else {
    const endOfMonth = new Date(2000 + Number(m[2]), Number(m[1]), 1);
    if (endOfMonth <= now) errors.expiry = "This card has expired.";
  }

  const cvcLen = cardBrand(d) === "Amex" ? 4 : 3;
  if (digitsOnly(c.cvc).length !== cvcLen) errors.cvc = `Enter the ${cvcLen}-digit security code.`;
  return errors;
}
