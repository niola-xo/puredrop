import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PureDrop | Fresh Pure Water Delivered to Your Doorstep",
  description:
    "Never run out of pure water again. Akoka & Yaba direct factory supply. Sachet water batches, bottled table water, and dispenser refills delivered on your schedule.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // Not logged in or Supabase not initialized
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col relative overflow-x-hidden text-[#001d35] antialiased selection:bg-[#3cf9dc] selection:text-[#007061]">
        {/* Ambient Hydro Atmosphere with vivid, luminous backdrop blurs */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#cae8ff] via-[#e5f2fd] to-[#d4f2ee]" />

        {/* Luminous colorful hydro orbs positioned to visibly refract through the glass panels */}
        <div className="fixed top-10 left-1/4 w-[520px] h-[360px] rounded-full bg-gradient-to-r from-cyan-400/40 via-sky-400/35 to-blue-400/30 blur-[75px] pointer-events-none -z-10" />
        <div className="fixed top-1/3 -right-12 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/35 blur-[85px] pointer-events-none -z-10" />
        <div className="fixed top-2/3 left-10 w-[550px] h-[420px] rounded-full bg-gradient-to-br from-blue-500/30 via-sky-400/35 to-teal-300/25 blur-[80px] pointer-events-none -z-10" />
        <div className="fixed -bottom-20 right-1/4 w-[600px] h-[400px] rounded-full bg-gradient-to-t from-cyan-300/35 to-blue-300/25 blur-[90px] pointer-events-none -z-10" />

        <CartProvider>
          <Header userEmail={userEmail} />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="aero-glass-panel border-t border-white/80 mt-auto">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                <span className="font-extrabold text-[#0061a5] text-sm">PureDrop</span>
                <span className="hidden md:inline text-slate-400">•</span>
                <p className="text-slate-600">
                  PureDrop Factory, Akoka &amp; Yaba, Lagos, Nigeria. Demo mode: No real financial charges.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-slate-600 font-medium">
                <span>Direct Hub Delivery</span>
                <span>•</span>
                <span>Reverse Osmosis Purified</span>
                <span>•</span>
                <span>NAFDAC Certified</span>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
