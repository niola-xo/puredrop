"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";

export default function ClearCartEffect() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
