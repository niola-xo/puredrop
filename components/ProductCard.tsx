"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatNaira } from "@/lib/cart";
import { useCart } from "@/components/CartProvider";

function getProductBadge(name: string): string | null {
  if (name.includes("5-bag")) return "Popular";
  if (name.includes("10-bag")) return "Best Value";
  if (name.includes("20-bag")) return "Bulk Tier";
  if (name.includes("Dispenser")) return "20L Standard";
  return null;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const badge = getProductBadge(product.name);

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
    <div className="aero-glass-panel rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-400/20 group">
      <div>
        {/* Visual Water Refraction Bubble Container */}
        <div className="w-full h-36 rounded-xl bg-gradient-to-tr from-sky-100/60 to-white/70 flex items-center justify-center mb-5 relative overflow-hidden border border-white/70">
          <div className="w-20 h-20 rounded-2xl water-bubble-glow flex items-center justify-center shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 text-[#0061a5]"
            >
              <path d="M12 2.25c-2.4 3.75-6.75 9.1-6.75 13.05a6.75 6.75 0 0013.5 0c0-3.95-4.35-9.3-6.75-13.05z" />
            </svg>
          </div>
          {badge && (
            <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#3cf9dc]/40 text-[#007061] text-xs font-bold border border-[#006b5c]/20">
              {badge}
            </span>
          )}
        </div>

        <h3 className="font-bold text-lg text-[#001d35] mb-1">{product.name}</h3>
        <p className="text-sm text-[#3f4753] mb-4">{product.description}</p>
      </div>

      {/* Pricing & Add to Cart action */}
      <div className="pt-4 border-t border-white/70 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Price
          </span>
          <span className="text-xl font-extrabold text-[#001d35] tabular-nums">
            {formatNaira(product.price_ngn)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
            added
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "frutiger-gloss text-white shadow-sky-400/25 hover:brightness-110 active:scale-95"
          }`}
        >
          {added ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-emerald-700"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Added</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M1 1.75A.75.75 0 011.75 1h1.628a1.75 1.75 0 011.734 1.51L5.18 3h12.07a.75.75 0 01.728.932l-1.5 6A.75.75 0 0115.75 10.5H6.28l.27 1.62a.25.25 0 00.246.209h9.454a.75.75 0 010 1.5H6.796a1.75 1.75 0 01-1.724-1.463L3.435 2.5H1.75a.75.75 0 01-.75-.75zM6 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              <span>Add to cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
