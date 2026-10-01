"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/cart";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const totalNgn = items.reduce(
    (sum, item) => sum + item.unit_price_ngn * item.quantity,
    0
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[#0061a5] text-xs font-bold uppercase tracking-wider block">
            Review Order
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#001d35] tracking-tight">
            Your Water Cart
          </h1>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
          >
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* AC3.3: Friendly empty cart state with link to products, blocking checkout */
        <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-8 sm:p-14 text-center">
          <div className="w-16 h-16 rounded-2xl water-bubble-glow mx-auto flex items-center justify-center mb-5 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-[#0061a5]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.7 2.84-7.25H6.386M7.5 14.25L6.386 5.272M16.5 20.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#001d35] mb-2">
            Your cart is empty
          </h2>
          <p className="text-sm text-[#3f4753] max-w-md mx-auto mb-8">
            You haven&apos;t added any pure water batches yet. Pick your batch size or dispenser refill to get started.
          </p>
          <Link
            href="/"
            className="inline-flex px-7 py-3 rounded-full frutiger-gloss text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Browse Water Products
          </Link>
        </div>
      ) : (
        /* AC3.1 & AC3.2: Cart lines with live quantity adjustment and removal */
        <div className="space-y-6">
          <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/70 last:border-b-0"
              >
                {/* Item Details */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl water-bubble-glow flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6 text-[#0061a5]"
                    >
                      <path d="M12 2.25c-2.4 3.75-6.75 9.1-6.75 13.05a6.75 6.75 0 0013.5 0c0-3.95-4.35-9.3-6.75-13.05z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#001d35]">{item.name}</h3>
                    <p className="text-xs text-[#3f4753]">
                      Unit Price: {formatNaira(item.unit_price_ngn)}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  {/* Stepper */}
                  <div className="inline-flex items-center border border-white/90 bg-white/70 rounded-full px-2 py-1 shadow-xs">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-sky-50 disabled:opacity-30 disabled:hover:bg-transparent font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-[#001d35] tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-sky-50 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-base font-extrabold text-[#001d35] tabular-nums block">
                      {formatNaira(item.unit_price_ngn * item.quantity)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.product_id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary Card */}
          <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/70">
              <span className="text-base text-[#3f4753] font-medium">Subtotal</span>
              <span className="text-2xl font-extrabold text-[#001d35] tabular-nums">
                {formatNaira(totalNgn)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/"
                className="text-xs font-semibold text-[#0061a5] hover:underline"
              >
                &larr; Add more water products
              </Link>
              <Link
                href="/checkout"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full frutiger-gloss text-white text-sm font-bold shadow-lg shadow-sky-400/30 hover:brightness-110 active:scale-95 transition-all text-center"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
