"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { canUserPerformAction } from '@/lib/subscription';
import type { SubscriptionStatus } from '@/lib/subscription';

export function useSubscription() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Get current user
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (!user?.id) {
        setSubscriptionStatus(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/subscription/status?userId=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setSubscriptionStatus(data.subscription);
        } else {
          setError(data.error || 'Failed to load subscription status');
        }
      } catch (err) {
        console.error('Error loading subscription status:', err);
        setError('Failed to load subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptionStatus();
  }, [user?.id]);

  const checkActionPermission = async (actionType: string) => {
    if (!user?.id) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    try {
      const result = await canUserPerformAction(user.id, actionType as any);
      return result;
    } catch (err) {
      console.error('Error checking action permission:', err);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  };

  const refreshSubscriptionStatus = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/subscription/status?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscriptionStatus(data.subscription);
      }
    } catch (err) {
      console.error('Error refreshing subscription status:', err);
    }
  };

  return {
    subscriptionStatus,
    isLoading,
    error,
    checkActionPermission,
    refreshSubscriptionStatus,
    isTrialActive: subscriptionStatus?.trial_active || false,
    isSubscriptionActive: subscriptionStatus?.subscription_active || false,
    hasActiveAccess: subscriptionStatus?.trial_active || subscriptionStatus?.subscription_active || false,
    trialEndsAt: subscriptionStatus?.trial_ends_at || null
  };
}
