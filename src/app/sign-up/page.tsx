"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearCachesOnly } from "@/lib/cache-clear";
import Image from "next/image";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Clear caches when sign-up page loads (especially for subscription flow)
  useEffect(() => {
    const clearCachesOnLoad = async () => {
      console.log('📝 Sign-up page loaded, clearing caches to ensure fresh data');
      await clearCachesOnly();
    };
    clearCachesOnLoad();
  }, []);

  // Handle payment success redirect
  useEffect(() => {
    const handlePaymentSuccess = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = urlParams.get('payment') === 'success';
      const redirectTo = urlParams.get('redirectTo');
      
      if (isPaymentSuccess && redirectTo) {
        console.log('💰 Payment success detected on sign-up page, will redirect after sign-up');
        // Store the redirect info for after successful sign-up
        sessionStorage.setItem('payment_success_redirect', redirectTo);
      }
    };
    
    handlePaymentSuccess();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Process referral code if provided
        if (referralCode.trim()) {
          try {
            await supabase.from("referral_codes").insert({
              user_id: data.user.id,
              code: referralCode.trim().toUpperCase(),
            });
          } catch (referralError) {
            console.warn("Failed to process referral code:", referralError);
          }
        }

        // Create user profile
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
        });
        // Check if this is a payment success sign-up
        const paymentSuccessRedirect = sessionStorage.getItem('payment_success_redirect');
        if (paymentSuccessRedirect) {
          console.log('💰 Payment success sign-up completed, redirecting to:', paymentSuccessRedirect);
          sessionStorage.removeItem('payment_success_redirect');
          // Clear caches before redirecting to ensure fresh data
          await clearCachesOnly();
          router.push(paymentSuccessRedirect);
          return;
        }
        
        // Check if this is a trial sign-up
        const plan = searchParams.get('plan');
        const amount = searchParams.get('amount');
        const redirectTo = searchParams.get('redirectTo');
        
        if (plan === 'king_elite_trial' && data.user) {
          // This is a trial sign-up, create trial subscription and redirect to dashboard
          console.log('🎯 Trial sign-up completed, creating trial subscription');
          
          // Create trial subscription
          try {
            const response = await fetch('/api/subscription/create-trial', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.user.id })
            });
            
            if (response.ok) {
              console.log('✅ Trial subscription created successfully');
              router.push('/dashboard?trial=true');
            } else {
              console.error('❌ Failed to create trial subscription');
              router.push('/dashboard');
            }
          } catch (error) {
            console.error('❌ Error creating trial subscription:', error);
            router.push('/dashboard');
          }
        } else if (plan && amount && redirectTo === '/payment') {
          // This is a subscription sign-up, redirect to payment page
          console.log('💳 Subscription sign-up completed, redirecting to payment');
          // Use the new subscription amount of ₦4,250
          const subscriptionAmount = plan === 'king_elite' ? '4250' : amount;
          router.push(`/payment?plan=${plan}&amount=${subscriptionAmount}&amount_kobo=${parseInt(subscriptionAmount) * 100}`);
        } else {
          // Regular sign-up, redirect to plan selection
          router.push("/?newUser=true");
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 pt-20 bg-gradient-to-br from-purple-50 to-white dark:from-[#0a0218] dark:to-[#0b0614] relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <form onSubmit={onSubmit} className="relative w-full max-w-md mx-auto rounded-3xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-neutral-900/70 backdrop-blur-2xl p-8 sm:p-10 shadow-[8px_8px_32px_rgba(0,0,0,0.18),_-8px_-8px_32px_rgba(255,255,255,0.08)] transition-all">
        {/* Morphism sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_40%,transparent_60%)]">
          <div className="absolute -top-8 left-0 right-0 h-24 bg-gradient-to-b from-white/40 to-transparent dark:from-white/8" />
        </div>
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/aj2.png"
              alt="Ajopay Logo"
              width={60}
              height={60}
              className="rounded-xl shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-500 bg-clip-text text-transparent">Create Account</h1>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            {searchParams.get('payment') === 'success' 
              ? '🎉 Payment successful! Complete your account setup to access your dashboard.' 
              : 'Start digitizing microfinance contributions with Ajopay.'
            }
          </p>
        </div>

        <div className="space-y-5">
          {/* Full Name */}
          <div className="grid gap-2">
            <label htmlFor="fullName" className="text-sm text-gray-700 dark:text-gray-200">Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full border-none rounded-xl px-4 py-3 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
            />
          </div>

          {/* Referral Code */}
          <div className="grid gap-2">
            <label htmlFor="referralCode" className="text-sm text-gray-700 dark:text-gray-200">Referral Code (Optional)</label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="FRIEND123"
              className="w-full border-none rounded-xl px-4 py-3 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500">Get ₦500 bonus for you and your referrer!</p>
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-200">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border-none rounded-xl px-4 py-3 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
            />
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-200">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-none rounded-xl px-4 py-3 pr-12 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="grid gap-2">
            <label htmlFor="confirmPassword" className="text-sm text-gray-700 dark:text-gray-200">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-none rounded-xl px-4 py-3 pr-12 bg-white shadow-inner dark:bg-[#23233a] focus:outline-none focus:ring-2 focus:ring-purple-400/40 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <a href="/sign-in" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
