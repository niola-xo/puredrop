"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get("error") ? "Authentication could not be completed. Please try again." : null
  );

  async function handleGoogleLogin() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md aero-glass-panel rounded-2xl md:rounded-[28px] p-8 sm:p-10 shadow-xl relative overflow-hidden text-center">
      {/* Internal specular highlight arc */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-gradient-to-b from-white/70 to-transparent blur-lg pointer-events-none" />

      {/* Water Droplet Glow */}
      <div className="w-16 h-16 rounded-2xl water-bubble-glow mx-auto flex items-center justify-center mb-6 shadow-inner">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8 text-[#0061a5]"
        >
          <path d="M12 2.25c-2.4 3.75-6.75 9.1-6.75 13.05a6.75 6.75 0 0013.5 0c0-3.95-4.35-9.3-6.75-13.05z" />
        </svg>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001d35] mb-2 tracking-tight">
        Welcome to PureDrop
      </h1>
      <p className="text-sm text-[#3f4753] mb-8 leading-relaxed">
        Sign in with your Google account to manage your pure water subscriptions and track factory deliveries in Akoka and Yaba.
      </p>

      {errorMessage && (
        <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Continue with Google button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-50 text-[#001d35] font-bold text-sm border border-slate-200 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#0061a5] border-t-transparent rounded-full animate-spin" />
            Connecting to Google...
          </span>
        ) : (
          <>
            {/* Google 'G' icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <div className="mt-8 pt-6 border-t border-white/60 text-xs text-slate-400">
        Demo Mode: No sensitive personal information is stored.
      </div>
    </div>
  );
}
