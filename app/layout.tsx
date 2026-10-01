import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "PureDrop | Fresh Pure Water Delivered to Your Doorstep",
  description:
    "Never run out of pure water again. Akoka & Yaba direct factory supply. Sachet water batches, bottled table water, and dispenser refills delivered on your schedule.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col relative overflow-x-hidden text-[#001d35] antialiased selection:bg-[#3cf9dc] selection:text-[#007061]">
        {/* Ambient Frutiger Aero Atmosphere */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#dceefc] via-[#f5faff] to-[#e8f7f5]" />
        <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-sky-200 blur-3xl opacity-60 pointer-events-none -z-10" />
        <div className="fixed top-1/3 -right-28 w-96 h-96 rounded-full bg-emerald-200 blur-3xl opacity-40 pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-200 blur-3xl opacity-35 pointer-events-none -z-10" />

        <CartProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="bg-white/80 backdrop-blur-md border-t border-sky-100/60 mt-auto">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                <span className="font-bold text-[#0061a5] text-sm">PureDrop</span>
                <span className="hidden md:inline text-slate-300">•</span>
                <p className="text-slate-600">
                  PureDrop Factory, Akoka &amp; Yaba, Lagos, Nigeria. Demo mode: No real financial charges.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-slate-500">
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
