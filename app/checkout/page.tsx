import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login?next=/checkout");
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <span className="text-[#0061a5] text-xs font-bold uppercase tracking-wider block">
          Final Step
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#001d35] tracking-tight">
          Complete Your Order
        </h1>
      </div>

      <CheckoutForm userEmail={user.email} />
    </div>
  );
}
