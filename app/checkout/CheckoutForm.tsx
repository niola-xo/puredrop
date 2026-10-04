"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/cart";
import { getProductImage } from "@/lib/products";
import {
  getEarliestOneTimeDate,
  getLatestOneTimeDate,
  calculateFirstSubscriptionDeliveryDate,
  formatFriendlyDate,
  WEEKDAYS,
} from "@/lib/date";
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

  // One-time state
  const earliestDate = getEarliestOneTimeDate();
  const latestDate = getLatestOneTimeDate();
  const [deliveryDate, setDeliveryDate] = useState(earliestDate);

  // Subscription state (AC4.4)
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [deliveryWeekday, setDeliveryWeekday] = useState<number>(1); // 1 = Monday

  const calculatedSubFirstDate = calculateFirstSubscriptionDeliveryDate(deliveryWeekday);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

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

    if (orderType === "one_time") {
      if (!deliveryDate) {
        errs.deliveryDate = "Delivery date is required";
      } else if (deliveryDate < earliestDate || deliveryDate > latestDate) {
        errs.deliveryDate = `Date must be between ${earliestDate} and ${latestDate}`;
      }
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
        deliveryDate: orderType === "one_time" ? deliveryDate : calculatedSubFirstDate,
        frequency: orderType === "subscription" ? frequency : undefined,
        deliveryWeekday: orderType === "subscription" ? deliveryWeekday : undefined,
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

      // AC5.4: Transition immediately and open order confirmation
      setIsOrderPlaced(true);
      clearCart();
      router.push(`/order/${result.orderId}`);
    } catch {
      setErrors({ general: "An unexpected network error occurred." });
      setSubmitting(false);
    }
  }

  if (isOrderPlaced) {
    return (
      <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-8 sm:p-14 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl water-bubble-glow mx-auto flex items-center justify-center mb-5 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-emerald-600 animate-pulse"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#001d35] mb-2">
          {orderType === "subscription" ? "Subscription Started!" : "Order Confirmed!"}
        </h2>
        <p className="text-sm text-[#3f4753]">
          Opening your confirmation receipt...
        </p>
      </div>
    );
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

        {/* Purchase Type & Schedule */}
        <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-5">
          <div className="border-b border-white/70 pb-3">
            <h2 className="text-lg font-bold text-[#001d35]">Purchase Type &amp; Schedule</h2>
            <p className="text-xs text-[#3f4753]">Choose between one-time batch or recurring supply</p>
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
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all text-center ${
                orderType === "subscription"
                  ? "frutiger-gloss text-white shadow-md"
                  : "text-[#3f4753] hover:text-[#0061a5]"
              }`}
            >
              Subscribe
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
            /* AC4.4: Subscription options (Frequency + Weekday + Calculated First Delivery) */
            <div className="space-y-5">
              {/* Frequency Radios */}
              <div>
                <label className="block text-xs font-bold text-[#001d35] uppercase tracking-wider mb-2">
                  Delivery Frequency <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      frequency === "weekly"
                        ? "bg-sky-50 border-[#0061a5] ring-2 ring-sky-200 text-[#0061a5]"
                        : "bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={frequency === "weekly"}
                      onChange={() => setFrequency("weekly")}
                      className="text-[#0061a5] focus:ring-[#0061a5]"
                    />
                    <div>
                      <span className="text-xs font-bold block">Weekly</span>
                      <span className="text-[10px] text-slate-500">Every 7 days</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      frequency === "monthly"
                        ? "bg-sky-50 border-[#0061a5] ring-2 ring-sky-200 text-[#0061a5]"
                        : "bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value="monthly"
                      checked={frequency === "monthly"}
                      onChange={() => setFrequency("monthly")}
                      className="text-[#0061a5] focus:ring-[#0061a5]"
                    />
                    <div>
                      <span className="text-xs font-bold block">Monthly</span>
                      <span className="text-[10px] text-slate-500">Every 4 weeks (28 days)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Delivery Day Dropdown (Monday to Friday, no weekends) */}
              <div>
                <label className="block text-xs font-bold text-[#001d35] uppercase tracking-wider mb-1.5">
                  Preferred Delivery Day <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deliveryWeekday}
                  onChange={(e) => setDeliveryWeekday(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-sky-200 text-sm text-[#001d35] font-semibold focus:outline-hidden focus:border-[#0061a5] focus:ring-2 focus:ring-sky-200"
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Deliveries operate Monday through Sunday.
                </p>
              </div>

              {/* Calculated First Delivery Date (PRD Section 8 rules) */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0061a5] block">
                  Calculated First Delivery
                </span>
                <p className="text-base font-extrabold text-[#001d35]">
                  {formatFriendlyDate(calculatedSubFirstDate)}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  First delivery is scheduled for the first occurrence of your chosen weekday at least 1 day after today (Lagos time). Subsequent deliveries occur {frequency === "weekly" ? "every 7 days" : "every 28 days"}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Order Summary & Demo Payment */}
      <div className="lg:col-span-5 space-y-6">
        {/* AC4.5: Order Summary */}
        <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-white/70 pb-3">
            <h2 className="text-lg font-bold text-[#001d35]">
              {orderType === "subscription" ? "Subscription Summary" : "Order Summary"}
            </h2>
            {orderType === "subscription" && (
              <span className="text-[11px] font-bold text-[#0061a5] bg-sky-100 px-2.5 py-0.5 rounded-full capitalize">
                {frequency} Cycle
              </span>
            )}
          </div>

          <div className="divide-y divide-white/70 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.product_id} className="py-3 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200/80 overflow-hidden flex items-center justify-center shrink-0 relative">
                    <Image
                      src={getProductImage(item.name).src}
                      alt={getProductImage(item.name).alt}
                      fill
                      className="object-contain p-0.5"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#001d35] truncate">{item.name}</p>
                    <p className="text-slate-500">
                      {item.quantity} &times; {formatNaira(item.unit_price_ngn)}
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-[#001d35] tabular-nums shrink-0">
                  {formatNaira(item.unit_price_ngn * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/70 flex items-center justify-between">
            <span className="text-sm font-bold text-[#001d35]">
              {orderType === "subscription" ? "Per Delivery (NGN)" : "Total (NGN)"}
            </span>
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
            This is a test environment. No card number, expiration date, or CVV is required. Clicking the button below will record your {orderType === "subscription" ? "recurring subscription" : "order"} in Supabase.
          </p>

          {/* AC4.7: Main Button ("Place order" for one-time, "Start subscription" for subscribe) */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-full frutiger-gloss text-white font-extrabold text-base shadow-xl shadow-sky-400/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
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
