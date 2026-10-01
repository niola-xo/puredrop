import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

const SEED_FALLBACK_PRODUCTS: Product[] = [
  {
    id: "seed-1",
    name: "Pure Water, 5-bag batch",
    description: "5 bags, about 20 sachets per bag",
    price_ngn: 2400,
    sort_order: 1,
    active: true,
  },
  {
    id: "seed-2",
    name: "Pure Water, 10-bag batch",
    description: "10 bags, about 20 sachets per bag",
    price_ngn: 4600,
    sort_order: 2,
    active: true,
  },
  {
    id: "seed-3",
    name: "Pure Water, 20-bag batch",
    description: "20 bags, about 20 sachets per bag",
    price_ngn: 9000,
    sort_order: 3,
    active: true,
  },
  {
    id: "seed-4",
    name: "Table Water, 1 pack",
    description: "One pack of bottled table water",
    price_ngn: 1500,
    sort_order: 4,
    active: true,
  },
  {
    id: "seed-5",
    name: "Dispenser Refill, 1 bottle",
    description: "One refill bottle for water dispensers",
    price_ngn: 1600,
    sort_order: 5,
    active: true,
  },
];

export default async function Home() {
  let liveProducts: Product[] | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      liveProducts = data;
    }
  } catch {
    // Supabase credentials not connected yet
  }

  const isLive = Boolean(liveProducts && liveProducts.length > 0);
  const products: Product[] = liveProducts && liveProducts.length > 0 ? liveProducts : SEED_FALLBACK_PRODUCTS;

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
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Available Water Products</h2>
            {!isLive && (
              <span className="text-[11px] font-medium bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                UI Preview Mode
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {isLive
              ? "Select a product to start a one-time order or set up recurring delivery."
              : "Previewing product catalog layout locally. Connect Supabase to stream live database records."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
