"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // If the user arrived via the magic reset link, supabase-js should have a session in the URL hash.
    // We just ensure the client is initialized and session is available.
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) setReady(true);
        else setMessage("Reset link invalid or expired. Request a new one from the sign-in page.");
      } catch (e: any) {
        setMessage(e?.message || "Unable to verify reset link.");
      }
    };
    void init();
  }, [supabase]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      if (password !== confirm) throw new Error("Passwords do not match");
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. Redirecting…");
      try {
        document.cookie = "recent_auth=1; Max-Age=900; Path=/; SameSite=Lax";
      } catch {}
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err: any) {
      setMessage(err?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const resendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResending(true);
    setMessage(null);
    try {
      if (!/\S+@\S+\.\S+/.test(email)) throw new Error("Enter the email to reset password for");
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
      if (error) throw error;
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to send reset email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-zinc-900/20 backdrop-blur-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        {ready ? (
          <form onSubmit={onSave} className="space-y-3">
            <div className="grid gap-2">
              <label htmlFor="pw" className="text-sm opacity-80">New password</label>
              <input
                id="pw"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/5 dark:bg-white/5"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="pw2" className="text-sm opacity-80">Confirm password</label>
              <input
                id="pw2"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/5 dark:bg-white/5"
              />
            </div>
            <button disabled={saving} className="w-full h-10 rounded bg-foreground text-background disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Saving…" : "Save new password"}
            </button>
          </form>
        ) : (
          <form onSubmit={resendResetEmail} className="space-y-3">
            <p className="text-sm opacity-80">Reset link invalid or expired. Request a new one.</p>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm opacity-80">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/5 dark:bg-white/5"
              />
            </div>
            <button disabled={resending} className="w-full h-10 rounded bg-foreground text-background disabled:opacity-50 disabled:cursor-not-allowed">
              {resending ? "Sending…" : "Send reset email"}
            </button>
          </form>
        )}
        {message && <p className="text-sm opacity-80">{message}</p>}
      </div>
    </div>
  );
}
