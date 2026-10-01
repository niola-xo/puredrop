import type { CartItem } from "@/lib/types";

/** Format an integer naira amount like ₦2,400 */
export function formatNaira(amountNgn: number): string {
  return `\u20A6${amountNgn.toLocaleString("en-NG")}`;
}

const CART_KEY = "puredrop_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  const existing = cart.find((c) => c.product_id === item.product_id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push({ ...item });
  }
  saveCart(cart);
  return cart;
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}
