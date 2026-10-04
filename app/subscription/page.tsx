import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/cart";
import { formatFriendlyDate, getWeekdayName } from "@/lib/date";
import { getProductImage } from "@/lib/products";
import CancelSubscriptionButton from "./CancelSubscriptionButton";

interface SubscriptionItemSnapshot {
  product_id: string;
  name: string;
  unit_price_ngn: number;
  quantity: number;
}

export default async function SubscriptionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/subscription");
  }

  // AC6.1 & AC6.2: Fetch latest subscription for current user
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeSub = subscriptions?.find((s) => s.status === "active");
  const latestSub = activeSub || subscriptions?.[0] || null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      {/* Header */}
      <div className="mb-8">
        <span className="text-[#0061a5] text-xs font-bold uppercase tracking-wider block">
          Recurring Water Supply
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#001d35] tracking-tight">
          My Subscription
        </h1>
      </div>

      {!latestSub ? (
        /* AC6.2: Empty state with link to products */
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
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#001d35] mb-2">
            No Active Subscription
          </h2>
          <p className="text-sm text-[#3f4753] max-w-md mx-auto mb-8">
            You don&apos;t have any scheduled weekly or monthly pure water deliveries yet. Choose your preferred batch size and set up automated doorstep replenishment.
          </p>
          <Link
            href="/"
            className="inline-flex px-7 py-3 rounded-full frutiger-gloss text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Start a Water Subscription
          </Link>
        </div>
      ) : (
        /* AC6.1: Active or Cancelled subscription details */
        <div className="space-y-6">
          {/* Status & Overview Glass Card */}
          <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/70 pb-5">
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider mb-1">
                  Subscription Status
                </span>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      latestSub.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        latestSub.status === "active"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                    {latestSub.status === "active" ? "Active Subscription" : "Cancelled"}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold capitalize">
                    {latestSub.frequency} Schedule
                  </span>
                </div>
              </div>

              {/* Cancel Button if active (AC6.1 & AC6.3) */}
              {latestSub.status === "active" && (
                <CancelSubscriptionButton subscriptionId={latestSub.id} />
              )}
            </div>

            {/* Schedule Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/70 p-4 rounded-xl border border-white/80">
                <span className="text-slate-400 block font-semibold uppercase">
                  Delivery Frequency
                </span>
                <span className="font-bold text-sm text-[#001d35] capitalize">
                  {latestSub.frequency}
                </span>
              </div>
              <div className="bg-white/70 p-4 rounded-xl border border-white/80">
                <span className="text-slate-400 block font-semibold uppercase">
                  Delivery Weekday
                </span>
                <span className="font-bold text-sm text-[#001d35]">
                  Every {getWeekdayName(latestSub.delivery_weekday)}
                </span>
              </div>
              <div className="bg-white/70 p-4 rounded-xl border border-white/80">
                <span className="text-slate-400 block font-semibold uppercase">
                  {latestSub.status === "active" ? "Next Scheduled Date" : "Final Delivery Date"}
                </span>
                <span className="font-bold text-sm text-[#0061a5]">
                  {formatFriendlyDate(latestSub.next_delivery_date)}
                </span>
              </div>
            </div>

            {/* Cancelled notice */}
            {latestSub.status === "cancelled" && latestSub.cancelled_at && (
              <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600">
                This subscription was cancelled on{" "}
                <span className="font-bold">
                  {new Date(latestSub.cancelled_at).toLocaleDateString("en-NG", {
                    timeZone: "Africa/Lagos",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                . No further deliveries will be scheduled.
              </div>
            )}
          </div>

          {/* Delivery Address & Contact Card */}
          <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-[#001d35] border-b border-white/70 pb-3">
              Delivery Address &amp; Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Recipient</span>
                <span className="font-bold text-sm text-[#001d35]">
                  {latestSub.customer_name}
                </span>
                <span className="text-slate-500 block">{latestSub.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Address</span>
                <span className="font-medium text-[#001d35]">{latestSub.address}</span>
                {latestSub.landmark && (
                  <span className="text-slate-500 block">Near: {latestSub.landmark}</span>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Items & Cycle Total Card */}
          <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-[#001d35] border-b border-white/70 pb-3">
              Subscribed Water Items (Per Delivery)
            </h2>
            <div className="divide-y divide-white/70">
              {((latestSub.items as unknown as SubscriptionItemSnapshot[]) || []).map(
                (item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200/80 overflow-hidden flex items-center justify-center shrink-0 relative shadow-inner">
                        <Image
                          src={getProductImage(item.name).src}
                          alt={getProductImage(item.name).alt}
                          fill
                          className="object-contain p-1"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#001d35] text-sm truncate">{item.name}</p>
                        <p className="text-slate-500">
                          {item.quantity} &times; {formatNaira(item.unit_price_ngn)}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-[#001d35] tabular-nums shrink-0">
                      {formatNaira(item.unit_price_ngn * item.quantity)}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="pt-4 border-t border-white/70 flex items-center justify-between">
              <span className="text-base font-bold text-[#001d35]">Total Per Cycle</span>
              <span className="text-2xl font-extrabold text-[#0061a5] tabular-nums">
                {formatNaira(latestSub.total_ngn)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
