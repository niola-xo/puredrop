"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { CartItem } from "@/lib/types";
import {
  getCart,
  saveCart,
  addToCart as addToCartUtil,
  clearCart as clearCartUtil,
} from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";

interface CartContextValue {
  items: CartItem[];
  count: number;
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function emptySubscribe() {
  return () => {};
}

export function CartProvider({ children }: { children: ReactNode }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Helper to ensure product catalog is available for cart mapping
  const getProductDetails = useCallback(
    async (productId: string): Promise<{ name: string; price_ngn: number } | null> => {
      try {
        const { data } = await supabase
          .from("products")
          .select("id, name, price_ngn")
          .eq("id", productId)
          .single();
        if (data) {
          return { name: data.name, price_ngn: data.price_ngn };
        }
      } catch {
        // Fallback
      }
      return null;
    },
    [supabase]
  );

  // Fetch cart items from Supabase database
  const fetchDbCart = useCallback(
    async (userId: string): Promise<CartItem[]> => {
      try {
        const { data, error } = await supabase
          .from("cart_items")
          .select(`
            product_id,
            quantity,
            products (
              id,
              name,
              price_ngn
            )
          `)
          .eq("user_id", userId)
          .order("updated_at", { ascending: true });

        if (error || !data) {
          return [];
        }

        const mapped: CartItem[] = [];
        for (const row of data) {
          const prodData = Array.isArray(row.products) ? row.products[0] : row.products;
          let name = prodData?.name;
          let price = prodData?.price_ngn;

          if (!name || price === undefined) {
            const fallback = await getProductDetails(row.product_id);
            if (fallback) {
              name = fallback.name;
              price = fallback.price_ngn;
            }
          }

          if (name && price !== undefined) {
            mapped.push({
              product_id: row.product_id,
              name,
              unit_price_ngn: price,
              quantity: row.quantity,
            });
          }
        }
        return mapped;
      } catch (err) {
        console.error("[Cart] Error fetching cart items from DB:", err);
        return [];
      }
    },
    [supabase, getProductDetails]
  );

  // AC-W1.2: Merge local items into database cart at login and clear local cart
  const mergeLocalCartIntoDb = useCallback(
    async (userId: string) => {
      const localCart = getCart();
      if (localCart.length > 0) {
        for (const item of localCart) {
          try {
            const { error: rpcError } = await supabase.rpc("add_to_cart", {
              p_product_id: item.product_id,
              p_qty: item.quantity,
            });

            if (rpcError) {
              const { data: existing } = await supabase
                .from("cart_items")
                .select("quantity")
                .eq("user_id", userId)
                .eq("product_id", item.product_id)
                .single();

              const mergedQty = existing
                ? Math.min(99, existing.quantity + item.quantity)
                : Math.min(99, Math.max(1, item.quantity));

              await supabase.from("cart_items").upsert(
                {
                  user_id: userId,
                  product_id: item.product_id,
                  quantity: mergedQty,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,product_id" }
              );
            }
          } catch (err) {
            console.error("[Cart] Error merging item into DB:", err);
          }
        }
        clearCartUtil();
      }
    },
    [supabase]
  );

  // Mount effect: initialize auth, sync cart, and set up Realtime subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setupCart() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUser(user);

        // AC-W1.2: Merge local cart into DB at login
        await mergeLocalCartIntoDb(user.id);

        // Load fresh DB cart
        const dbItems = await fetchDbCart(user.id);
        setItems(dbItems);

        // AC-W1.3: Subscribe to Realtime postgres_changes
        channel = supabase
          .channel(`cart_items_realtime_${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cart_items",
              filter: `user_id=eq.${user.id}`,
            },
            async () => {
              const fresh = await fetchDbCart(user.id);
              setItems(fresh);
            }
          )
          .subscribe();
      } else {
        // User is signed out: load from localStorage
        setCurrentUser(null);
        setItems(getCart());
      }
    }

    setupCart();

    // Listen for auth state changes (e.g. login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const authedUser = session.user;
        setCurrentUser(authedUser);

        if (channel) {
          supabase.removeChannel(channel);
        }

        await mergeLocalCartIntoDb(authedUser.id);
        const dbItems = await fetchDbCart(authedUser.id);
        setItems(dbItems);

        channel = supabase
          .channel(`cart_items_realtime_${authedUser.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cart_items",
              filter: `user_id=eq.${authedUser.id}`,
            },
            async () => {
              const fresh = await fetchDbCart(authedUser.id);
              setItems(fresh);
            }
          )
          .subscribe();
      } else if (event === "SIGNED_OUT") {
        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }
        setCurrentUser(null);
        setItems([]);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, fetchDbCart, mergeLocalCartIntoDb]);

  // Synchronize localStorage changes across tabs when signed out
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "puredrop_cart" && !currentUser) {
        setItems(getCart());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [currentUser]);

  // AC-W1.1: Add to cart
  const addToCart = useCallback(
    (item: CartItem) => {
      if (currentUser) {
        const userId = currentUser.id;
        // Optimistic UI update
        setItems((prev) => {
          const idx = prev.findIndex((i) => i.product_id === item.product_id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              quantity: Math.min(99, next[idx].quantity + item.quantity),
            };
            return next;
          }
          return [...prev, item];
        });

        // Write to cart_items asynchronously
        (async () => {
          try {
            const { error: rpcError } = await supabase.rpc("add_to_cart", {
              p_product_id: item.product_id,
              p_qty: item.quantity,
            });

            if (rpcError) {
              const { data: existing } = await supabase
                .from("cart_items")
                .select("quantity")
                .eq("user_id", userId)
                .eq("product_id", item.product_id)
                .single();

              const nextQty = existing
                ? Math.min(99, existing.quantity + item.quantity)
                : Math.min(99, Math.max(1, item.quantity));

              await supabase.from("cart_items").upsert(
                {
                  user_id: userId,
                  product_id: item.product_id,
                  quantity: nextQty,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,product_id" }
              );
            }

            const fresh = await fetchDbCart(userId);
            setItems(fresh);
          } catch (err) {
            console.error("[Cart] Error in addToCart DB write:", err);
          }
        })();
      } else {
        // Signed out: write to localStorage
        const updated = addToCartUtil(item);
        setItems([...updated]);
      }
    },
    [currentUser, supabase, fetchDbCart]
  );

  // AC-W1.1: Update quantity
  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const clamped = Math.max(1, Math.min(99, quantity));

      if (currentUser) {
        const userId = currentUser.id;
        // Optimistic UI update
        setItems((prev) =>
          prev.map((i) =>
            i.product_id === productId ? { ...i, quantity: clamped } : i
          )
        );

        // Write to cart_items asynchronously
        (async () => {
          try {
            await supabase
              .from("cart_items")
              .update({
                quantity: clamped,
                updated_at: new Date().toISOString(),
              })
              .eq("product_id", productId)
              .eq("user_id", userId);
          } catch (err) {
            console.error("[Cart] Error in updateQuantity DB write:", err);
          }
        })();
      } else {
        // Signed out: update localStorage
        const cart = getCart();
        const idx = cart.findIndex((c) => c.product_id === productId);
        if (idx !== -1) {
          cart[idx].quantity = clamped;
          saveCart(cart);
          setItems([...cart]);
        }
      }
    },
    [currentUser, supabase]
  );

  // AC-W1.1: Remove item
  const removeItem = useCallback(
    (productId: string) => {
      if (currentUser) {
        const userId = currentUser.id;
        // Optimistic UI update
        setItems((prev) => prev.filter((i) => i.product_id !== productId));

        // Delete from cart_items asynchronously
        (async () => {
          try {
            await supabase
              .from("cart_items")
              .delete()
              .eq("product_id", productId)
              .eq("user_id", userId);
          } catch (err) {
            console.error("[Cart] Error in removeItem DB write:", err);
          }
        })();
      } else {
        // Signed out: remove from localStorage
        const cart = getCart().filter((c) => c.product_id !== productId);
        saveCart(cart);
        setItems([...cart]);
      }
    },
    [currentUser, supabase]
  );

  // AC-W1.1: Clear cart
  const clearCart = useCallback(() => {
    // Immediate local cleanup
    clearCartUtil();
    setItems([]);

    if (currentUser) {
      const userId = currentUser.id;
      (async () => {
        try {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId);
        } catch (err) {
          console.error("[Cart] Error in clearCart DB write:", err);
        }
      })();
    }
  }, [currentUser, supabase]);

  // Prevent SSR hydration mismatch: count and items only surface after client mount
  const count = isMounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;
  const currentItems = isMounted ? items : [];

  return (
    <CartContext.Provider
      value={{
        items: currentItems,
        count,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
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
