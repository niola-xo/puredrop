"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/cart";
import { getEarliestOneTimeDate, getLatestOneTimeDate } from "@/lib/date";
import { placeOrder } from "./actions";

interface FormErrors {
  customerName?: string;
  phone?: string;
  address?: string;
  deliveryDate?: string;
  general?: string;
}

export default function CheckoutForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const { items, clearCart } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [orderType, setOrderType] = useState<"one_time" | "subscription">("one_time");

  const earliestDate = getEarliestOneTimeDate();
  const latestDate = getLatestOneTimeDate();
  const [deliveryDate, setDeliveryDate] = useState(earliestDate);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const totalNgn = items.reduce(
    (sum, item) => sum + item.unit_price_ngn * item.quantity,
    0
  );

  function validate(): boolean {
    const errs: FormErrors = {};

    if (!customerName.trim()) {
      errs.customerName = "Full name is required";
    }

    const digits = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (digits.length < 10) {
      errs.phone = "Phone number must have at least 10 digits";
    }

    if (!address.trim()) {
      errs.address = "Delivery address is required";
    }

    if (!deliveryDate) {
      errs.deliveryDate = "Delivery date is required";
    } else if (deliveryDate < earliestDate || deliveryDate > latestDate) {
      errs.deliveryDate = `Date must be between ${earliestDate} and ${latestDate}`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) {
      setErrors({ general: "Your cart is empty. Add water products before checkout." });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const result = await placeOrder({
        customerName,
        phone,
        address,
        landmark,
        orderType,
        deliveryDate,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      });

      if (!result.success || !result.orderId) {
        setErrors({ general: result.error || "Failed to process order." });
        setSubmitting(false);
        return;
      }

      // AC5.4: Clear cart and redirect to /order/[id]
      clearCart();
      router.push(`/order/${result.orderId}`);
    } catch {
      setErrors({ general: "An unexpected network error occurred." });
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-8 sm:p-12 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-[#001d35] mb-2">Cart is empty</h2>
        <p className="text-sm text-[#3f4753] mb-6">
          You need at least one water product in your cart to proceed with checkout.
        </p>
        <Link
          href="/"
          className="inline-flex px-7 py-3 rounded-full frutiger-gloss text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Details & Delivery */}
      <div className="lg:col-span-7 space-y-6">
        {/* Customer & Address Details */}
        <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-5">
          <div className="border-b border-white/70 pb-3">
            <h2 className="text-lg font-bold text-[#001d35]">Delivery Details</h2>
            <p className="text-xs text-[#3f4753]">
              Ordering as <span className="font-semibold text-[#0061a5]">{userEmail}</span>
            </p>
          </div>

          {errors.general && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errors.general}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#001d35] uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Tunde Adebayo"
              className={`w-full px-4 py-3 rounded-xl bg-white/80 border text-sm text-[#001d35] placeholder-slate-400 focus:outline-hidden transition-all ${
                errors.customerName
                  ? "border-rose-400 ring-2 ring-rose-200"
                  : "border-sky-200 focus:border-[#0061a5] focus:ring-2 focus:ring-sky-200"
              }`}
            />
            {errors.customerName && (
              <p className="text-xs text-rose-600 mt-1">{errors.customerName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-[#001d35] uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              className={`w-full px-4 py-3 rounded-xl bg-white/80 border text-sm text-[#001d35] placeholder-slate-400 focus:outline-hidden transition-all ${
                errors.phone
                  ? "border-rose-400 ring-2 ring-rose-200"
                  : "border-sky-200 focus:border-[#0061a5] focus:ring-2 focus:ring-sky-200"
              }`}
            />
            {errors.phone ? (
              <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Must be at least 10 digits for driver contact.</p>
            )}
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-xs font-bold text-[#001d35] uppercase tracking-wider mb-1.5">
              Delivery Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 14 University Road, Akoka, Lagos"
              className={`w-full px-4 py-3 rounded-xl bg-white/80 border text-sm text-[#001d35] placeholder-slate-400 focus:outline-hidden transition-all ${
                errors.address
                  ? "border-rose-400 ring-2 ring-rose-200"
                  : "border-sky-200 focus:border-[#0061a5] focus:ring-2 focus:ring-sky-200"
              }`}
            />
            {errors.address && (
              <p className="text-xs text-rose-600 mt-1">{errors.address}</p>
            )}
          </div>

          {/* Landmark or Area */}
          <div>
            <label className="block text-xs font-bold text-[#001d35] uppercase tracking-wider mb-1.5">
              Landmark or Area <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near UNILAG 2nd Gate, behind St. Finbarrs"
              className="w-full px-4 py-3 rounded-xl bg-white/80 border border-sky-200 text-sm text-[#001d35] placeholder-slate-400 focus:outline-hidden focus:border-[#0061a5] focus:ring-2 focus:ring-sky-200 transition-all"
            />
          </div>
        </div>

        {/* Purchase Type & Date Schedule */}
        <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-5">
          <div className="border-b border-white/70 pb-3">
            <h2 className="text-lg font-bold text-[#001d35]">Purchase Type &amp; Schedule</h2>
            <p className="text-xs text-[#3f4753]">Choose between one-time supply or subscription</p>
          </div>

          {/* AC4.2: Purchase type selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-white/60 border border-white/80">
            <button
              type="button"
              onClick={() => setOrderType("one_time")}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all text-center ${
                orderType === "one_time"
                  ? "frutiger-gloss text-white shadow-md"
                  : "text-[#3f4753] hover:text-[#0061a5]"
              }`}
            >
              One-time order
            </button>
            <button
              type="button"
              onClick={() => setOrderType("subscription")}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all text-center relative ${
                orderType === "subscription"
                  ? "frutiger-gloss text-white shadow-md"
                  : "text-[#3f4753] hover:text-[#0061a5]"
              }`}
            >
              Subscribe
              <span className="ml-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                Phase 4
              </span>
            </button>
          </div>

          {orderType === "one_time" ? (
            /* AC4.3: One-time order delivery date picker */
            <div>
              <label className="block text-xs font-bold text-[#001d35] uppercase tracking-wider mb-1.5">
                Preferred Delivery Date (Lagos Time) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={earliestDate}
                max={latestDate}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white/80 border text-sm text-[#001d35] focus:outline-hidden transition-all ${
                  errors.deliveryDate
                    ? "border-rose-400 ring-2 ring-rose-200"
                    : "border-sky-200 focus:border-[#0061a5] focus:ring-2 focus:ring-sky-200"
                }`}
              />
              {errors.deliveryDate ? (
                <p className="text-xs text-rose-600 mt-1">{errors.deliveryDate}</p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Earliest available date is tomorrow ({earliestDate}). Up to 30 days ahead ({latestDate}).
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-[#0061a5] leading-relaxed">
              Subscription settings (weekly/monthly recurrence and weekday delivery selection) will be unlocked in Phase 4. For now, please select <strong>One-time order</strong> to complete your order.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Order Summary & Demo Payment */}
      <div className="lg:col-span-5 space-y-6">
        {/* AC4.5: Order Summary */}
        <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[#001d35] border-b border-white/70 pb-3">
            Order Summary
          </h2>

          <div className="divide-y divide-white/70 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.product_id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#001d35]">{item.name}</p>
                  <p className="text-slate-500">
                    {item.quantity} &times; {formatNaira(item.unit_price_ngn)}
                  </p>
                </div>
                <span className="font-extrabold text-[#001d35] tabular-nums">
                  {formatNaira(item.unit_price_ngn * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/70 flex items-center justify-between">
            <span className="text-sm font-bold text-[#001d35]">Total (NGN)</span>
            <span className="text-2xl font-extrabold text-[#0061a5] tabular-nums">
              {formatNaira(totalNgn)}
            </span>
          </div>
        </div>

        {/* AC4.6: Demo Payment Section (NO card fields) */}
        <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-4 border-2 border-sky-300/60">
          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Demo mode: no real payment is taken
          </div>

          <p className="text-xs text-[#3f4753] leading-relaxed">
            This is a test environment. No card number, expiration date, or CVV is required. Clicking the button below will immediately simulate a successful payment and record your order in Supabase.
          </p>

          {/* AC4.7: Main Button ("Place order" for one-time, "Start subscription" for subscribe) */}
          <button
            type="submit"
            disabled={submitting || orderType !== "one_time"}
            className="w-full py-4 px-6 rounded-full frutiger-gloss text-white font-extrabold text-base shadow-xl shadow-sky-400/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing order...
              </span>
            ) : orderType === "one_time" ? (
              "Place order"
            ) : (
              "Start subscription"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
