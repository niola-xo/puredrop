import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PureDrop | Lagos Pure Water Delivery & Subscription",
  description:
    "Fast, reliable pure water batch deliveries and weekly or monthly subscriptions for homes, students, and businesses in Yaba and Akoka, Lagos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <CartProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} PureDrop Factory. Akoka &amp; Yaba, Lagos, Nigeria.</p>
            <p className="mt-1">Demo Mode: No real financial charges.</p>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
