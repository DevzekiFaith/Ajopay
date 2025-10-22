"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserSubscriptionStatus, formatTrialTimeRemaining } from "@/lib/subscription";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface TrialRestrictionProps {
  userId: string;
  onUpgrade: () => void;
  onClose?: () => void;
}

export function TrialRestriction({ userId, onUpgrade, onClose }: TrialRestrictionProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_subscription_status', {
          user_uuid: userId
        });

        if (error) {
          console.error('Error loading subscription status:', error);
        } else {
          setSubscriptionStatus(data);
        }
      } catch (error) {
        console.error('Error loading subscription status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadSubscriptionStatus();
    }
  }, [userId, supabase]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus || subscriptionStatus.subscription_active) {
    return null; // Don't show if user has active subscription
  }

  const isTrialExpired = !subscriptionStatus.trial_active;
  const timeRemaining = subscriptionStatus.trial_ends_at 
    ? formatTrialTimeRemaining(subscriptionStatus.trial_ends_at)
    : 'Unknown';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
        >
          <Card className="relative overflow-hidden">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                {isTrialExpired ? (
                  <Clock className="h-8 w-8 text-white" />
                ) : (
                  <Crown className="h-8 w-8 text-white" />
                )}
              </div>
              
              <CardTitle className="text-2xl font-bold">
                {isTrialExpired ? 'Trial Expired' : 'Trial Active'}
              </CardTitle>
              
              <p className="text-gray-600 mt-2">
                {isTrialExpired 
                  ? 'Your 4-day trial has ended. Upgrade to continue using all features.'
                  : `Your trial ends in ${timeRemaining}. Upgrade now to unlock all features!`
                }
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Trial Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Trial Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isTrialExpired 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {isTrialExpired ? 'Expired' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-medium">Time Remaining:</span>
                  <span className="text-sm text-gray-600">{timeRemaining}</span>
                </div>
              </div>

              {/* Features Locked */}
              {isTrialExpired && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Features Currently Locked:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Making contributions</li>
                    <li>• Creating savings goals</li>
                    <li>• Joining savings circles</li>
                    <li>• Advanced analytics</li>
                    <li>• Gamification features</li>
                  </ul>
                </div>
              )}

              {/* Upgrade Button */}
              <Button
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 rounded-xl"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Upgrade to King Elite - ₦1,200
              </Button>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">King Elite Benefits:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ Unlimited savings goals</li>
                  <li>✓ Advanced gamification & badges</li>
                  <li>✓ Peer challenges & competitions</li>
                  <li>✓ Create & manage savings circles</li>
                  <li>✓ Personal health dashboard</li>
                  <li>✓ Advanced analytics & insights</li>
                  <li>✓ Priority customer support</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}








