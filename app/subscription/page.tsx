import Link from "next/link";

export default function SubscriptionPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16">
      <div className="aero-glass-panel rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001d35] mb-2">
          My Subscription
        </h1>
        <p className="text-sm text-[#3f4753] mb-6">
          Manage your recurring pure water batches and scheduled weekday deliveries.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-2.5 rounded-full frutiger-gloss text-white text-xs font-bold"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
