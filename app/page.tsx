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

  const products: Product[] =
    liveProducts && liveProducts.length > 0 ? liveProducts : SEED_FALLBACK_PRODUCTS;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-16">
      {/* Hero Section */}
      <section className="aero-glass-panel rounded-2xl md:rounded-[28px] p-6 md:p-12 relative overflow-hidden mb-12">
        {/* Specular light highlight arc */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-gradient-to-b from-white/70 to-transparent blur-xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Akoka & Yaba Factory supply pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#3cf9dc]/25 border border-[#006b5c]/20 text-[#007061] text-xs font-bold mb-4 shadow-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5 text-[#006b5c]"
            >
              <path d="M12 2.25c-2.4 3.75-6.75 9.1-6.75 13.05a6.75 6.75 0 0013.5 0c0-3.95-4.35-9.3-6.75-13.05z" />
            </svg>
            <span>Akoka &amp; Yaba Direct Factory Supply</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-[54px] font-extrabold text-[#001d35] tracking-tight leading-[1.15] mb-4">
            Fresh Pure Water Delivered to Your Doorstep,{" "}
            <span className="text-[#0061a5]">On Your Schedule</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#3f4753] max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Never run out of pure water again. Pick your batch size, choose weekly or monthly
            deliveries, and select your preferred weekday. Our factory drivers handle the rest.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#products-section"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full frutiger-gloss text-white text-sm font-bold shadow-lg shadow-sky-400/30 hover:brightness-110 active:scale-95 transition-all text-center"
            >
              Order Water Now
            </a>
            <Link
              href="/subscription"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full aero-glass-secondary text-[#0061a5] text-sm font-bold hover:bg-white/80 active:scale-95 transition-all text-center border border-white/90 shadow-xs"
            >
              Manage Subscription
            </Link>
          </div>
        </div>

        {/* 3 Glass Step Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 pt-8 border-t border-white/60">
          {/* Step 1 */}
          <div className="aero-glass-secondary rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full frutiger-gloss flex items-center justify-center text-white font-bold text-base shadow-md">
              1
            </div>
            <div>
              <h3 className="font-bold text-base text-[#001d35] mb-1">Pick Your Batch</h3>
              <p className="text-xs text-[#3f4753] leading-relaxed">
                5-bag, 10-bag, or 20-bag sachet batches or dispenser refills
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="aero-glass-secondary rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full frutiger-gloss flex items-center justify-center text-white font-bold text-base shadow-md">
              2
            </div>
            <div>
              <h3 className="font-bold text-base text-[#001d35] mb-1">Choose Your Day</h3>
              <p className="text-xs text-[#3f4753] leading-relaxed">
                Select the weekday you are home for regular weekly or monthly delivery
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="aero-glass-secondary rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full frutiger-gloss flex items-center justify-center text-white font-bold text-base shadow-md">
              3
            </div>
            <div>
              <h3 className="font-bold text-base text-[#001d35] mb-1">Factory Driver Delivery</h3>
              <p className="text-xs text-[#3f4753] leading-relaxed">
                Direct from our Akoka factory right to your compound
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Catalog Grid */}
      <section className="scroll-mt-20" id="products-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <span className="text-[#0061a5] text-xs font-bold uppercase tracking-wider block">
              Direct From Hub
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001d35]">
              Factory Water Batches
            </h2>
          </div>
          <span className="text-xs text-[#3f4753] font-medium">
            Pure, sterilized, sealed in food-grade packs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
