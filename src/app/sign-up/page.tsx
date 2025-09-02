"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-purple-50 to-white dark:from-[#0a0218] dark:to-[#0b0614] relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <form onSubmit={onSubmit} className="relative w-full max-w-md mx-auto rounded-3xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-neutral-900/70 backdrop-blur-2xl p-8 sm:p-10 shadow-[8px_8px_32px_rgba(0,0,0,0.18),_-8px_-8px_32px_rgba(255,255,255,0.08)] transition-all">
        {/* Morphism sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_40%,transparent_60%)]">
          <div className="absolute -top-8 left-0 right-0 h-24 bg-gradient-to-b from-white/40 to-transparent dark:from-white/8" />
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-700 to-violet-500 bg-clip-text text-transparent">Create your account</h1>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 text-center">Start digitizing microfinance contributions with Ajopay.</p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl px-4 bg-white/80 dark:bg-white/10 border-none shadow-[inset_2px_2px_8px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-purple-400/30 text-neutral-900 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl px-4 bg-white/80 dark:bg-white/10 border-none shadow-[inset_2px_2px_8px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-purple-400/30 text-neutral-900 dark:text-white"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-purple-700 text-white hover:bg-purple-800 shadow-[4px_4px_16px_rgba(128,90,213,0.12)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
          <a href="/sign-in" className="block text-center text-sm text-purple-700 dark:text-purple-300 hover:underline">Already have an account? Sign in</a>
        </div>
      </form>
    </div>
  );
}
