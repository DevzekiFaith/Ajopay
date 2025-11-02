"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { formatTrialTimeRemaining } from "@/lib/subscription";

interface TrialStatusProps {
  onUpgrade: () => void;
}

export function TrialStatus({ onUpgrade }: TrialStatusProps) {
  const { subscriptionStatus, isTrialActive, trialEndsAt } = useSubscription();
  const [showDetails, setShowDetails] = useState(false);

  if (!subscriptionStatus || !isTrialActive || !trialEndsAt) {
    return null;
  }

  const timeRemaining = formatTrialTimeRemaining(trialEndsAt);
  const isExpiringSoon = timeRemaining.includes('1 day') || timeRemaining.includes('Trial expired');

  return (
    <div className="relative">
      {/* Trial Status Badge */}
      <motion.button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          isExpiringSoon 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Crown className="h-4 w-4" />
        <span className="hidden sm:inline">Trial: {timeRemaining}</span>
        <span className="sm:hidden">{timeRemaining}</span>
        {isExpiringSoon && <Clock className="h-4 w-4 animate-pulse" />}
      </motion.button>

      {/* Trial Details Dropdown */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">King Elite Trial</h3>
                <p className="text-sm text-gray-600">{timeRemaining}</p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isExpiringSoon 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {isExpiringSoon ? 'Expiring Soon' : 'Active'}
                </span>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Trial Features:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Unlimited goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Savings circles</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Gamification</span>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade Now - ₦1,200
            </Button>

            {/* Close Button */}
            <button
              onClick={() => setShowDetails(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}












