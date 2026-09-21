export const CART_UPDATED_EVENT = "cart:updated";

export function announceCartCount(count: number) {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { count } }));
}
