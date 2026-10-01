import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/cart";
import { formatFriendlyDate } from "@/lib/date";

interface OrderItemSnapshot {
  product_id: string;
  name: string;
  unit_price_ngn: number;
  quantity: number;
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/order/${id}`);
  }

  // AC5.5: Fetch order with RLS enforced (users can only read their own rows)
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const items = (order.items as unknown as OrderItemSnapshot[]) || [];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      {/* Confirmation Header */}
      <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-8 sm:p-12 text-center mb-8 relative overflow-hidden">
        {/* Specular highlight arc */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-gradient-to-b from-white/70 to-transparent blur-lg pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl water-bubble-glow mx-auto flex items-center justify-center mb-5 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-emerald-600"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-3">
          Order Successfully Placed
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#001d35] tracking-tight mb-2">
          Thank You, {order.customer_name}!
        </h1>
        <p className="text-sm text-[#3f4753] max-w-lg mx-auto">
          Your order has been recorded. Our factory drivers in Akoka will deliver your batch on the scheduled date.
        </p>

        {/* AC6.4: Email notification status message */}
        <div className="mt-4 text-xs font-semibold">
          {order.email_status === "sent" ? (
            <p className="text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full inline-block">
              A confirmation email was sent to {order.user_email}.
            </p>
          ) : (
            <p className="text-slate-500 bg-white/70 px-4 py-2 rounded-full inline-block">
              Your order is saved, and factory dispatch has been notified.
            </p>
          )}
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Delivery Details */}
        <div className="aero-glass-panel rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-[#001d35] border-b border-white/70 pb-3">
            Delivery Details
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Scheduled Date</span>
              <span className="font-bold text-sm text-[#001d35]">
                {formatFriendlyDate(order.delivery_date)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Address</span>
              <span className="font-medium text-[#001d35]">{order.address}</span>
            </div>
            {order.landmark && (
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Landmark</span>
                <span className="font-medium text-[#001d35]">{order.landmark}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Recipient Contact</span>
              <span className="font-medium text-[#001d35]">
                {order.customer_name} &bull; {order.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Payment & Reference Details */}
        <div className="aero-glass-panel rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-[#001d35] border-b border-white/70 pb-3">
            Order Reference
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Reference ID</span>
              <span className="font-mono font-bold text-sm text-[#0061a5]">
                {order.id}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Order Type</span>
              <span className="font-medium text-[#001d35] capitalize">
                {order.order_type.replace("_", "-")}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Payment Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Demo mode (No real charge)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Placed On</span>
              <span className="font-medium text-[#001d35]">
                {new Date(order.created_at).toLocaleString("en-NG", {
                  timeZone: "Africa/Lagos",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Summary Table */}
      <div className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 sm:p-8 mb-8 space-y-4">
        <h2 className="text-base font-bold text-[#001d35] border-b border-white/70 pb-3">
          Ordered Pure Water Batches
        </h2>
        <div className="divide-y divide-white/70">
          {items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-[#001d35] text-sm">{item.name}</p>
                <p className="text-slate-500">
                  {item.quantity} &times; {formatNaira(item.unit_price_ngn)}
                </p>
              </div>
              <span className="font-extrabold text-sm text-[#001d35] tabular-nums">
                {formatNaira(item.unit_price_ngn * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/70 flex items-center justify-between">
          <span className="text-base font-bold text-[#001d35]">Total Paid</span>
          <span className="text-2xl font-extrabold text-[#0061a5] tabular-nums">
            {formatNaira(order.total_ngn)}
          </span>
        </div>
      </div>

      {/* Back to Products / Action */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex px-8 py-3.5 rounded-full frutiger-gloss text-white text-sm font-bold shadow-lg shadow-sky-400/30 hover:brightness-110 active:scale-95 transition-all"
        >
          Return to PureDrop Home
        </Link>
      </div>
    </div>
  );
}
