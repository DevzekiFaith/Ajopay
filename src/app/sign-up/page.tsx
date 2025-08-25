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
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h[calc(100vh-48px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-purple-50 to-white dark:from-[#0a0218] dark:to-[#0b0614] px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <form onSubmit={onSubmit} className="relative w-full max-w-md mx-auto rounded-3xl border border-white/40 bg-white/30 backdrop-blur-md dark:border-white/10 dark:bg-white/5 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-purple-700 to-violet-500 bg-clip-text text-transparent">Create your account</h1>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">Start digitizing microfinance contributions with Ajopay.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl px-3 bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/40 text-neutral-900 dark:text-white"
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
              className="w-full h-11 rounded-xl px-3 bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/40 text-neutral-900 dark:text-white"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
          <a href="/sign-in" className="block text-center text-sm text-purple-800/90 dark:text-white/80 hover:underline">Already have an account? Sign in</a>
        </div>
      </form>
    </div>
  );
}
