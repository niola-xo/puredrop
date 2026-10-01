import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

export default async function Home() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-12 sm:py-16 lg:py-20 border-b border-sky-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-4">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            Factory Direct Delivery in Akoka &amp; Yaba
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Fresh Pure Water Delivered to Your Doorstep,{" "}
            <span className="text-sky-600">On Your Schedule</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Never run out of pure water again. Pick your batch size, choose weekly or monthly
            deliveries, and select your preferred weekday. Our factory drivers handle the rest.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#products"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
            >
              Order Water Now
            </a>
            <Link
              href="/subscription"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
            >
              Manage Subscription
            </Link>
          </div>

          {/* Quick value badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h2 className="font-semibold text-slate-900 text-sm">Pick Your Batch</h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose from 5-bag, 10-bag, or 20-bag batches of clean sachet water or dispenser refills.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h2 className="font-semibold text-slate-900 text-sm">Choose Your Day</h2>
              <p className="mt-1 text-xs text-slate-500">
                Select the day of the week you are home for regular weekly or monthly delivery.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h2 className="font-semibold text-slate-900 text-sm">Factory Driver Delivery</h2>
              <p className="mt-1 text-xs text-slate-500">
                Direct from our Lagos factory right to your compound with zero middlemen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Available Water Products</h2>
          <p className="mt-2 text-sm text-slate-600">
            Select a product to start a one-time order or set up recurring delivery.
          </p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(products as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-8 sm:p-12 text-center">
            <p className="text-sm font-medium text-sky-900">
              No products available right now. Please check back soon.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
