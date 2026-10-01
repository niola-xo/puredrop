"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";
import {
  getCart,
  saveCart,
  addToCart as addToCartUtil,
  clearCart as clearCartUtil,
} from "@/lib/cart";

// ── External store for cart (localStorage) ──────────────────────────
let listeners: Array<() => void> = [];
let cachedSnapshot: CartItem[] = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify() {
  // Update the cached snapshot so useSyncExternalStore sees the change
  cachedSnapshot = getCart();
  for (const l of listeners) l();
}

function getSnapshot(): CartItem[] {
  return cachedSnapshot;
}

const emptyCart: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return emptyCart;
}

// Initialize cache on module load (client only)
if (typeof window !== "undefined") {
  cachedSnapshot = getCart();
}

// ── Context ─────────────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[];
  count: number;
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const addToCart = useCallback((item: CartItem) => {
    addToCartUtil(item);
    notify();
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const cart = getCart();
    const idx = cart.findIndex((c) => c.product_id === productId);
    if (idx !== -1) {
      cart[idx].quantity = Math.max(1, quantity);
      saveCart(cart);
      notify();
    }
  }, []);

  const removeItem = useCallback((productId: string) => {
    const cart = getCart().filter((c) => c.product_id !== productId);
    saveCart(cart);
    notify();
  }, []);

  const clearCart = useCallback(() => {
    clearCartUtil();
    notify();
  }, []);

  return (
    <CartContext.Provider
      value={{ items, count, addToCart, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
