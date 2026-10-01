"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatNaira } from "@/lib/cart";
import { useCart } from "@/components/CartProvider";

const productIcons: Record<string, string> = {
  "Pure Water": "💧",
  "Table Water": "🍶",
  "Dispenser Refill": "🫗",
};

function getIcon(name: string): string {
  for (const [key, icon] of Object.entries(productIcons)) {
    if (name.startsWith(key)) return icon;
  }
  return "💧";
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart({
      product_id: product.id,
      name: product.name,
      unit_price_ngn: product.price_ngn,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center text-3xl mb-4">
        {getIcon(product.name)}
      </div>

      {/* Info */}
      <h3 className="font-semibold text-slate-900 text-base leading-snug">{product.name}</h3>
      <p className="mt-1 text-sm text-slate-500 leading-relaxed flex-1">{product.description}</p>

      {/* Price & Button */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-lg font-bold text-slate-900">{formatNaira(product.price_ngn)}</span>
        <button
          onClick={handleAdd}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            added
              ? "bg-green-100 text-green-700 cursor-default"
              : "bg-sky-600 text-white hover:bg-sky-700 active:scale-95 shadow-xs"
          }`}
        >
          {added ? "✓ Added" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
