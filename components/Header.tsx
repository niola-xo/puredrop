"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-sky-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-sky-500 text-white shadow-sm group-hover:bg-sky-600 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 2.25c-2.4 3.75-6.75 9.1-6.75 13.05a6.75 6.75 0 0013.5 0c0-3.95-4.35-9.3-6.75-13.05z" />
              </svg>
            </span>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Pure<span className="text-sky-600">Drop</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link
              href="/cart"
              className="flex items-center gap-1.5 hover:text-sky-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.7 2.84-7.25H6.386M7.5 14.25L6.386 5.272M16.5 20.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                />
              </svg>
              <span>Cart</span>
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold text-white bg-sky-600 rounded-full">
                {cartCount}
              </span>
            </Link>

            <Link
              href="/subscription"
              className="hover:text-sky-600 transition-colors"
            >
              My subscription
            </Link>

            <Link
              href="/admin"
              className="text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
            >
              Factory dashboard (demo)
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-xs"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/cart"
              className="relative p-2 text-slate-700 hover:text-sky-600"
              aria-label="Shopping Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.7 2.84-7.25H6.386M7.5 14.25L6.386 5.272M16.5 20.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                />
              </svg>
              <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-sky-600 rounded-full">
                {cartCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-sky-600 focus:outline-hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-3">
            <Link
              href="/subscription"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-sky-50 hover:text-sky-600"
            >
              My subscription
            </Link>

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-600"
            >
              Factory dashboard (demo)
            </Link>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 text-base font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
