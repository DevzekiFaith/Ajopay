"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { AjoPaySpinnerCompact } from "@/components/ui/AjoPaySpinner";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const plan = searchParams.get('plan');
  const amount = searchParams.get('amount');
  const amountKobo = searchParams.get('amount_kobo');

  const planDetails = {
    free: { 
      name: "Foundation", 
      price: "₦0", 
      features: [
        "Basic savings wallet",
        "Daily contribution streaks", 
        "Basic savings goals (3 goals limit)",
        "Join savings circles",
        "Basic gamification",
        "Email support"
      ] 
    },
    king: { 
      name: "Royal Elite", 
      price: "₦1,200", 
      features: [
        "Everything in Free",
        "Unlimited savings goals",
        "Advanced gamification & badges",
        "Peer challenges & competitions", 
        "Create & manage savings circles",
        "Personal health dashboard",
        "Advanced analytics & insights",
        "Crypto wallet integration",
        "Real-time notifications & sounds",
        "Priority customer support",
        "Export data & reports"
      ] 
    }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails] || planDetails.king;

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, check if user is authenticated
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        // User not authenticated, redirect to sign-in with payment info
        const redirectUrl = `/sign-in?plan=${plan}&amount=${amount}&amount_kobo=${amountKobo}&redirectTo=/payment&newUser=true`;
        router.push(redirectUrl);
        return;
      }

      const user = await userResponse.json();
      
      // Initialize payment
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_kobo: parseInt(amountKobo || '50000'),
          user_id: user.id,
          email: user.email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center p-2 shadow-lg">
            <Image
              src="/aj1.png"
              alt="AjoPay Logo"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Secure payment powered by Paystack</p>
        </div>

        {/* Plan Details */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-6 border border-orange-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{currentPlan.name}</h2>
          <div className="text-3xl font-black text-orange-600 mb-4">{currentPlan.price}</div>
          <div className="space-y-2">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-700">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Plan</span>
            <span className="font-semibold">{currentPlan.name}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Amount</span>
            <span className="font-semibold">{currentPlan.price}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-xl text-orange-600">{currentPlan.price}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <motion.button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <AjoPaySpinnerCompact size="sm" className="text-white" />
              <span>Processing...</span>
            </div>
          ) : (
            plan === 'king' ? `Pay ${currentPlan.price} & Become King` : `Pay ${currentPlan.price} & Start Saving`
          )}
        </motion.button>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span>Your payment is secure and encrypted</span>
          </div>
        </div>

        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ← Back to Plans
        </motion.button>
      </motion.div>
    </div>
  );
}
