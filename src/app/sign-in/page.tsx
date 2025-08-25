"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function SignInPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [resendSending, setResendSending] = useState(false);
  const [reauth, setReauth] = useState(false);
  const isEmailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  // Password helpers
  const canSubmitPassword = useMemo(() => {
    const base = isEmailValid && password.length >= 6 && (!isSignup || password === confirmPassword);
    return isSignup ? base && fullName.trim().length >= 2 : base;
  }, [isEmailValid, password, isSignup, confirmPassword, fullName]);

  // Prefill from localStorage
  useEffect(() => {
    try {
      const lastEmail = localStorage.getItem("ajopay_last_email");
      if (lastEmail) setEmail(lastEmail);
    } catch {}
    try {
      const qs = new URLSearchParams(window.location.search);
      if (qs.get("reauth") === "1") setReauth(true);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Email/password: sign up
  const signUpWithPassword = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setSending(true);
    setMessage(null);
    try {
      if (!isEmailValid) throw new Error("Enter a valid email address");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, ...(emailRedirectTo ? { emailRedirectTo } : {}) },
      });
      if (error) throw error;
      // If email confirmation is disabled, Supabase returns a session.
      // We upsert profile using that session, then sign out to enforce explicit sign-in.
      if (data.session) {
        try {
          const uid = data.user?.id;
          if (uid) {
            await supabase.from("profiles").upsert({ id: uid, full_name: fullName }, { onConflict: "id" });
          }
        } catch {}
        try { await supabase.auth.signOut(); } catch {}
      }
      // Switch back to sign-in form with success message (no email confirmation required)
      setIsSignup(false);
      setPendingConfirm(false);
      setMessage("Account created. Please sign in.");
      try { localStorage.setItem("ajopay_last_email", email); } catch {}
    } catch (err: any) {
      console.error("signUp error", err);
      setMessage(err?.message || "Failed to sign up");
    } finally {
      setSending(false);
    }
  };

  const resendConfirmation = async () => {
    if (!isEmailValid) {
      setMessage("Enter a valid email to resend confirmation");
      return;
    }
    setResendSending(true);
    setMessage(null);
    try {
      const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      } as any);
      if (error) throw error;
      setMessage("Confirmation email resent. Please check your inbox.");
    } catch (err: any) {
      console.error("resend confirmation error", err);
      setMessage(err?.message || "Failed to resend confirmation email");
    } finally {
      setResendSending(false);
    }
  };

  const sendMagicLink = async () => {
    if (!isEmailValid) {
      setMessage("Enter a valid email to send magic link");
      return;
    }
    setResendSending(true);
    setMessage(null);
    try {
      const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      });
      if (error) throw error;
      setMessage("Magic sign-in link sent. Please check your inbox.");
    } catch (err: any) {
      console.error("magic link error", err);
      setMessage(err?.message || "Failed to send magic link");
    } finally {
      setResendSending(false);
    }
  };

  // Email/password: sign in
  const signInWithPassword = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setSending(true);
    setMessage(null);
    try {
      if (!isEmailValid) throw new Error("Enter a valid email address");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      try {
        document.cookie = "recent_auth=1; Max-Age=900; Path=/; SameSite=Lax";
      } catch {}
      // If profile has no full_name but user metadata has, upsert it once
      try {
        const uid = data.user?.id;
        const metaName = (data.user as any)?.user_metadata?.full_name as string | undefined;
        if (uid && metaName) {
          const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
          if (!prof?.full_name) {
            await supabase.from("profiles").upsert({ id: uid, full_name: metaName }, { onConflict: "id" });
          }
        }
      } catch {}
      window.location.href = "/dashboard";
      try { localStorage.setItem("ajopay_last_email", email); } catch {}
    } catch (err: any) {
      setMessage(err?.message || "Failed to sign in");
    } finally {
      setSending(false);
    }
  };

  // Forgot password: send reset email
  const sendResetPasswordEmail = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    setSending(true);
    setMessage(null);
    try {
      if (!isEmailValid) throw new Error("Enter the email to reset password for");
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
      if (error) throw error;
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to send reset email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center px-4">
      <div className="relative w-full max-w-2xl h-32 sm:h-40 md:h-48 mb-6">
        <Image src="/aj2.png" alt="Ajopay" fill sizes="(max-width:768px) 100vw, 720px" className="object-contain drop-shadow-xl" priority />
      </div>
      <div className="relative w-full max-w-sm space-y-6 rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)] p-6 sm:p-8">
        {/* subtle sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_40%,transparent_60%)]">
          <div className="absolute -top-8 left-0 right-0 h-24 bg-gradient-to-b from-white/30 to-transparent dark:from-white/6" />
        </div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        {reauth && (
          <div className="text-xs p-2 rounded border border-yellow-500/40 bg-yellow-500/10">
            For security, please sign in again to continue.
          </div>
        )}
        {/* Password-only auth */}

        <form onSubmit={isSignup ? signUpWithPassword : signInWithPassword} className="space-y-3">
          {isSignup && (
            <div className="grid gap-2">
              <label htmlFor="full_name" className="text-sm opacity-80">Full name</label>
              <input
                id="full_name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/5 dark:bg-white/5"
              />
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="email_pw" className="text-sm opacity-80">Email</label>
            <input
              id="email_pw"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/5 dark:bg-white/5 ${email && !isEmailValid ? "!border-red-500" : ""}`}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="pw" className="text-sm opacity-80">Password</label>
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
          {isSignup && (
            <div className="grid gap-2">
              <label htmlFor="pw2" className="text-sm opacity-80">Confirm password</label>
              <input
                id="pw2"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/5 dark:bg-white/5"
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={() => setIsSignup((v) => !v)} className="underline">
              {isSignup ? "Already have an account? Sign in" : "Create an account"}
            </button>
            {!isSignup && (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/reset-password";
                }}
                className="underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <button disabled={sending || !canSubmitPassword} className="w-full h-10 rounded bg-foreground text-background disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? (isSignup ? "Creating…" : "Signing in…") : (isSignup ? "Create account" : "Sign in")}
          </button>
        </form>

        {pendingConfirm && (
          <div className="space-y-2">
            <div className="text-xs opacity-80">Didn't receive the email?</div>
            <div className="grid sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={resendSending}
                className="h-9 rounded bg-white/80 text-neutral-900 disabled:opacity-60"
              >
                {resendSending ? "Resending…" : "Resend confirmation"}
              </button>
              <button
                type="button"
                onClick={sendMagicLink}
                disabled={resendSending}
                className="h-9 rounded border border-white/40"
              >
                Send magic link
              </button>
            </div>
          </div>
        )}

        {message && <p className="text-sm opacity-80">{message}</p>}
      </div>
    </div>
  );
}
