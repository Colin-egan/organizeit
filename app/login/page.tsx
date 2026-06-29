"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="OrganizeIt">
            <rect width="32" height="32" rx="9" fill="#4F46E5"/>
            <path
              d="M9 16l5 5L23 10"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-lg font-semibold text-white tracking-tight">OrganizeIt</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-stone-900/80 backdrop-blur-sm p-8 shadow-2xl shadow-black/40">
          <h1 className="text-xl font-bold text-white mb-1 tracking-tight">
            Welcome back
          </h1>
          <p className="text-stone-400 text-sm mb-8">
            Sign in to access your catalog
          </p>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400 mb-5">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-medium text-stone-200 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
              </svg>
            )}
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border border-stone-400 border-t-white rounded-full animate-spin" />
                Redirecting…
              </span>
            ) : (
              "Continue with Google"
            )}
          </button>

          <p className="text-center text-xs text-stone-600 mt-6">
            Your items are private and only visible to you.
          </p>
        </div>
      </div>
    </main>
  );
}
