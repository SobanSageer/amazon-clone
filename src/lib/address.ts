import { digitsOnly } from "@/lib/payment";
import { US_STATE_CODES } from "@/lib/us-states";

export const ADDRESS_FIELDS = ["fullName", "phone", "street", "unit", "city", "state", "zip"] as const;
export type AddressField = (typeof ADDRESS_FIELDS)[number];
export type AddressInput = Record<AddressField, string>;
export type AddressErrors = Partial<Record<AddressField, string>>;

export function readAddress(formData: FormData): { a: AddressInput; errors: AddressErrors } {
  const a = Object.fromEntries(ADDRESS_FIELDS.map((f) => [f, String(formData.get(f) ?? "").trim()])) as AddressInput;
  const errors: AddressErrors = {};
  if (!a.fullName) errors.fullName = "Enter the recipient’s full name.";
  if (digitsOnly(a.phone).length < 10) errors.phone = "Enter a 10-digit phone number.";
  if (!a.street) errors.street = "Enter a street address.";
  if (!a.city) errors.city = "Enter a city.";
  if (!US_STATE_CODES.has(a.state)) errors.state = "Choose a state.";
  if (!/^\d{5}(-\d{4})?$/.test(a.zip)) errors.zip = "Enter a 5-digit ZIP code.";
  for (const f of ADDRESS_FIELDS) if (a[f].length > 120) errors[f] = "That’s too long.";
  return { a, errors };
}

export function toAddressData(a: AddressInput) {
  return { ...a, unit: a.unit || null };
}
