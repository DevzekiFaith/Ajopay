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
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-100 via-purple-50 to-white dark:from-[#181824] dark:via-[#23233a] dark:to-[#181824]">
      <div className="relative w-full max-w-2xl h-32 sm:h-40 md:h-48 mb-6">
        <Image src="/aj2.png" alt="Ajopay" fill sizes="(max-width:768px) 100vw, 720px" className="object-contain drop-shadow-xl" priority />
      </div>
      <div className="relative w-full max-w-sm space-y-6 rounded-3xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-[#23233a]/80 backdrop-blur-2xl shadow-[8px_8px_24px_#e0e0e0,_-8px_-8px_24px_#ffffff] dark:shadow-[8px_8px_24px_#23233a,_-8px_-8px_24px_#181824] p-8">
        {/* morphism highlight */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_40%,transparent_60%)]">
          <div className="absolute -top-8 left-0 right-0 h-24 bg-gradient-to-b from-white/40 to-transparent dark:from-white/10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">Sign in</h1>
        {reauth && (
          <div className="text-xs p-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 shadow-inner">
            For security, please sign in again to continue.
          </div>
        )}
        <form onSubmit={isSignup ? signUpWithPassword : signInWithPassword} className="space-y-4">
          {isSignup && (
            <div className="grid gap-2">
              <label htmlFor="full_name" className="text-sm text-gray-700 dark:text-gray-200">Full name</label>
              <input
                id="full_name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full border-none rounded-xl px-4 py-3 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
              />
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="email_pw" className="text-sm text-gray-700 dark:text-gray-200">Email</label>
            <input
              id="email_pw"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full border-none rounded-xl px-4 py-3 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white ${email && !isEmailValid ? "!ring-red-500" : ""}`}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="pw" className="text-sm text-gray-700 dark:text-gray-200">Password</label>
            <input
              id="pw"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              className="w-full border-none rounded-xl px-4 py-3 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
            />
          </div>
          {isSignup && (
            <div className="grid gap-2">
              <label htmlFor="pw2" className="text-sm text-gray-700 dark:text-gray-200">Confirm password</label>
              <input
                id="pw2"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                className="w-full border-none rounded-xl px-4 py-3 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs mt-2">
            <button type="button" onClick={() => setIsSignup((v) => !v)} className="underline text-purple-700 dark:text-purple-300">
              {isSignup ? "Already have an account? Sign in" : "Create an account"}
            </button>
            {!isSignup && (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/reset-password";
                }}
                className="underline text-purple-700 dark:text-purple-300"
              >
                Forgot password?
              </button>
            )}
          </div>
          <button disabled={sending || !canSubmitPassword} className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold shadow-[4px_4px_16px_#e0e0e0,_-4px_-4px_16px_#ffffff] dark:shadow-[4px_4px_16px_#23233a,_-4px_-4px_16px_#181824] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? (isSignup ? "Creating\u2026" : "Signing in\u2026") : (isSignup ? "Create account" : "Sign in")}
          </button>
        </form>
        {pendingConfirm && (
          <div className="space-y-2 mt-4">
            <div className="text-xs opacity-80">Didn't receive the email?</div>
            <div className="grid sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={resendSending}
                className="h-10 rounded-xl bg-white/90 text-purple-900 dark:bg-white/10 dark:text-white shadow-inner disabled:opacity-60"
              >
                {resendSending ? "Resending…" : "Resend confirmation"}
              </button>
              <button
                type="button"
                onClick={sendMagicLink}
                disabled={resendSending}
                className="h-10 rounded-xl border border-purple-300 dark:border-purple-700 shadow-inner"
              >
                Send magic link
              </button>
            </div>
          </div>
        )}
              {message && <p className="text-sm opacity-80 mt-2 text-center">{message}</p>}
                    </div>
                  </div>
                );
        }
