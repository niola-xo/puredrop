"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscription } from "@/app/checkout/actions";

export default function CancelSubscriptionButton({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await cancelSubscription(subscriptionId);
      if (!res.success) {
        setError(res.error || "Could not cancel subscription.");
        setLoading(false);
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
        <p className="text-xs font-semibold text-rose-800">
          Are you sure you want to cancel your recurring pure water deliveries?
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="px-4 py-1.5 rounded-full bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Keep Subscription
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm"
          >
            {loading ? "Cancelling..." : "Yes, Cancel It"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="px-5 py-2.5 rounded-full border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all shadow-xs"
      >
        Cancel subscription
      </button>
    </div>
  );
}
