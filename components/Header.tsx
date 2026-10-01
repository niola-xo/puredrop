"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

interface HeaderProps {
  userEmail?: string | null;
}

export default function Header({ userEmail = null }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: cartCount } = useCart();

  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-white/80 sticky top-0 z-50 shadow-xs shadow-sky-900/5">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-b from-[#38b6ff] to-[#0061a5] text-white shadow-md shadow-sky-400/30 group-hover:scale-105 transition-transform duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 2.25c-2.4 3.75-6.75 9.1-6.75 13.05a6.75 6.75 0 0013.5 0c0-3.95-4.35-9.3-6.75-13.05z" />
              </svg>
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#001d35]">
              Pure<span className="text-[#0061a5]">Drop</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/subscription"
              className="text-[#3f4753] text-sm font-semibold hover:text-[#0061a5] transition-colors"
            >
              My subscription
            </Link>
            <Link
              href="/admin"
              className="text-[#3f4753] text-sm font-semibold hover:text-[#0061a5] transition-colors"
            >
              Factory dashboard (demo)
            </Link>
          </nav>

          {/* Trailing Action Cluster */}
          <div className="flex items-center gap-3">
            {/* Cart Action with Counter */}
            <Link
              href="/cart"
              id="cart-btn"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-200/80 bg-white/90 text-[#0061a5] text-sm font-semibold hover:bg-sky-50/80 transition-all shadow-xs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-[#0061a5]"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Cart ({cartCount})</span>
            </Link>

            {/* Login or User Auth state */}
            {userEmail ? (
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
                <span className="text-xs text-slate-600 max-w-[140px] truncate" title={userEmail}>
                  {userEmail}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full frutiger-gloss text-white text-sm font-semibold shadow-md shadow-sky-400/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Login</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-[#0061a5] md:hidden focus:outline-hidden"
              aria-label="Toggle navigation menu"
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-sky-100 space-y-2">
            <Link
              href="/subscription"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-[#001d35] hover:bg-sky-50"
            >
              My subscription
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-600 hover:bg-sky-50"
            >
              Factory dashboard (demo)
            </Link>
            <div className="pt-2 border-t border-sky-100">
              {userEmail ? (
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-slate-600 truncate">{userEmail}</span>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full px-4 py-2.5 text-sm font-semibold text-white rounded-full frutiger-gloss shadow-md"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
