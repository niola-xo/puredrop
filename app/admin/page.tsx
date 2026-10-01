import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/cart";
import { formatFriendlyDate, getWeekdayName } from "@/lib/date";

export const dynamic = "force-dynamic";

interface ItemSnapshot {
  product_id: string;
  name: string;
  unit_price_ngn: number;
  quantity: number;
}

export default async function AdminDashboardPage() {
  // AC8.1: Check authenticated user
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  const openForDemo =
    (process.env.ADMIN_OPEN_FOR_DEMO || "true").toLowerCase().trim() === "true";
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const userEmail = (user?.email || "").toLowerCase().trim();

  // AC8.1: Allowed when signed in AND (ADMIN_OPEN_FOR_DEMO is true OR user email equals ADMIN_EMAIL)
  const isAllowed =
    user && (openForDemo || (adminEmail.length > 0 && userEmail === adminEmail));

  // AC8.1: Unauthorized view ("Not allowed" page)
  if (!isAllowed) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="aero-glass-panel rounded-2xl md:rounded-3xl p-8 sm:p-12 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 mx-auto flex items-center justify-center mb-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 mb-3">
            Access Restricted
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001d35] tracking-tight mb-3">
            Not Allowed
          </h1>
          <p className="text-sm text-[#3f4753] max-w-md mx-auto mb-8">
            {!user
              ? "You must be signed in to access the PureDrop factory dashboard. Please sign in with your authorized Google account."
              : `You are signed in as ${user.email}, but this account does not have permission to view the factory dashboard.`}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!user ? (
              <Link
                href="/login?next=/admin"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full frutiger-gloss text-white text-sm font-bold shadow-md shadow-sky-400/25 hover:brightness-110 active:scale-95 transition-all text-center"
              >
                Sign in with Google
              </Link>
            ) : null}
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full aero-glass-secondary text-[#0061a5] text-sm font-bold hover:bg-white/80 transition-all text-center border border-white/90"
            >
              Return to PureDrop Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AC8.4: Read data on the server with service role key (never exposed to browser)
  const serviceClient = await createServiceClient();

  const [subscriptionsRes, ordersRes] = await Promise.all([
    serviceClient
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false }),
    serviceClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const subscriptions = subscriptionsRes.data || [];
  const orders = ordersRes.data || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* AC8.2: When open for demo, show banner: 'Factory view (demo)' */}
      {openForDemo && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-400/10 to-amber-500/15 border border-amber-300/80 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 2.25a.75.75 0 01.75.75v1.259a9.75 9.75 0 015.65 2.825l.89-.89a.75.75 0 011.06 1.06l-.89.89a9.75 9.75 0 012.825 5.65H23.5a.75.75 0 010 1.5h-1.259a9.75 9.75 0 01-2.825 5.65l.89.89a.75.75 0 01-1.06 1.06l-.89-.89a9.75 9.75 0 01-5.65 2.825V21.75a.75.75 0 01-1.5 0v-1.259a9.75 9.75 0 01-5.65-2.825l-.89.89a.75.75 0 01-1.06-1.06l.89-.89a9.75 9.75 0 01-2.825-5.65H.5a.75.75 0 010-1.5h1.259a9.75 9.75 0 012.825-5.65l-.89-.89a.75.75 0 111.06-1.06l.89.89a9.75 9.75 0 015.65-2.825V3a.75.75 0 01.75-.75z" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-amber-950 tracking-tight">
                Factory view (demo)
              </h2>
              <p className="text-xs text-amber-800/90">
                Public demo view enabled. Real-time factory dispatch monitoring for Akoka &amp; Yaba routes.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
            Read-Only Monitor
          </span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-[#0061a5] uppercase tracking-wider">
            Akoka Pure Water Factory Dispatch
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#001d35] tracking-tight">
            Factory Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#3f4753] mt-1">
            Read-only dispatch view for driver scheduling, customer batches, and deliveries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="aero-glass-panel px-4 py-2 rounded-xl text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Subscriptions</span>
            <span className="text-lg font-black text-[#0061a5]">{subscriptions.length}</span>
          </div>
          <div className="aero-glass-panel px-4 py-2 rounded-xl text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
            <span className="text-lg font-black text-emerald-600">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* AC8.3: Table 1: Subscriptions (Newest First) */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#001d35] tracking-tight">
              Subscriptions ({subscriptions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Recurring customer deliveries sorted newest first.
            </p>
          </div>
        </div>

        <div className="aero-glass-panel rounded-2xl overflow-hidden border border-white/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-white/70">
              <thead className="bg-sky-50/80 text-[#001d35] font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Address</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Frequency</th>
                  <th className="px-4 py-3.5">Weekday</th>
                  <th className="px-4 py-3.5">Next Delivery</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60 bg-white/40">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No customer subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const items = (sub.items as unknown as ItemSnapshot[]) || [];
                    const isActive = sub.status === "active";
                    return (
                      <tr key={sub.id} className="hover:bg-white/60 transition-colors">
                        {/* Customer */}
                        <td className="px-4 py-3 font-semibold text-[#001d35]">
                          <div>{sub.customer_name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{sub.user_email}</div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 font-mono text-[#001d35] whitespace-nowrap">
                          {sub.phone}
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3 text-slate-700 min-w-[200px]">
                          <div>{sub.address}</div>
                          {sub.landmark && (
                            <div className="text-[11px] text-[#0061a5] font-medium">
                              Near {sub.landmark}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3 text-[#001d35] min-w-[180px]">
                          <ul className="space-y-0.5">
                            {items.map((item, idx) => (
                              <li key={idx} className="text-[11px]">
                                <span className="font-bold text-[#0061a5]">{item.quantity}&times;</span>{" "}
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        </td>

                        {/* Frequency */}
                        <td className="px-4 py-3 capitalize font-bold text-[#001d35] whitespace-nowrap">
                          {sub.frequency}
                        </td>

                        {/* Weekday */}
                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                          {getWeekdayName(sub.delivery_weekday)}
                        </td>

                        {/* Next Delivery */}
                        <td className="px-4 py-3 font-semibold text-[#0061a5] whitespace-nowrap">
                          {formatFriendlyDate(sub.next_delivery_date)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AC8.3: Table 2: Orders (Newest First) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#001d35] tracking-tight">
              Orders ({orders.length})
            </h2>
            <p className="text-xs text-slate-500">
              All factory orders (one-time and subscription batches) sorted newest first.
            </p>
          </div>
        </div>

        <div className="aero-glass-panel rounded-2xl overflow-hidden border border-white/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-white/70">
              <thead className="bg-sky-50/80 text-[#001d35] font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Address</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Delivery Date</th>
                  <th className="px-4 py-3.5">Created Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60 bg-white/40">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const items = (order.items as unknown as ItemSnapshot[]) || [];
                    const isSubOrder = order.order_type === "subscription";
                    return (
                      <tr key={order.id} className="hover:bg-white/60 transition-colors">
                        {/* Customer */}
                        <td className="px-4 py-3 font-semibold text-[#001d35]">
                          <div>{order.customer_name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{order.user_email}</div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 font-mono text-[#001d35] whitespace-nowrap">
                          {order.phone}
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3 text-slate-700 min-w-[200px]">
                          <div>{order.address}</div>
                          {order.landmark && (
                            <div className="text-[11px] text-[#0061a5] font-medium">
                              Near {order.landmark}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3 text-[#001d35] min-w-[180px]">
                          <ul className="space-y-0.5">
                            {items.map((item, idx) => (
                              <li key={idx} className="text-[11px]">
                                <span className="font-bold text-[#0061a5]">{item.quantity}&times;</span>{" "}
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3 font-extrabold text-[#0061a5] tabular-nums whitespace-nowrap">
                          {formatNaira(order.total_ngn)}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              isSubOrder
                                ? "bg-sky-100 text-[#0061a5]"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isSubOrder ? "Subscription" : "One-Time"}
                          </span>
                        </td>

                        {/* Delivery Date */}
                        <td className="px-4 py-3 font-semibold text-[#001d35] whitespace-nowrap">
                          {formatFriendlyDate(order.delivery_date)}
                        </td>

                        {/* Created Time (Africa/Lagos) */}
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleString("en-NG", {
                            timeZone: "Africa/Lagos",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
