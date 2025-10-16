// Subscription and Trial Management Utilities
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with error handling
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key, { auth: { persistSession: false } });
};

export interface SubscriptionStatus {
  has_subscription: boolean;
  status: 'none' | 'trial' | 'active' | 'expired' | 'cancelled';
  trial_active: boolean;
  trial_ends_at: string | null;
  subscription_active: boolean;
  plan_type?: string;
  trial_started_at?: string;
  subscription_started_at?: string;
}

export interface TrialActivity {
  activity_type: 'contribution' | 'goal_creation' | 'circle_join' | 'circle_create' | 
                 'challenge_participation' | 'gamification_feature' | 'analytics_access' |
                 'export_data' | 'advanced_notifications';
  activity_data?: Record<string, any>;
}

// Get user's subscription status
export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_user_subscription_status', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error getting subscription status:', error);
      return {
        has_subscription: false,
        status: 'none',
        trial_active: false,
        trial_ends_at: null,
        subscription_active: false
      };
    }

    return data as SubscriptionStatus;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      has_subscription: false,
      status: 'none',
      trial_active: false,
      trial_ends_at: null,
      subscription_active: false
    };
  }
}

// Check if user is in trial period
export async function isUserInTrial(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('is_user_in_trial', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error checking trial status:', error);
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Error checking trial status:', error);
    return false;
  }
}

// Check if user has active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('has_active_subscription', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Create trial subscription for new user
export async function createTrialSubscription(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 4); // 4-day trial

    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'king_elite',
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString()
      });

    if (error) {
      console.error('Error creating trial subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    return false;
  }
}

// Convert trial to paid subscription
export async function convertTrialToPaid(
  userId: string, 
  paymentReference: string, 
  amountPaidKobo: number
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        subscription_started_at: new Date().toISOString(),
        payment_reference: paymentReference,
        amount_paid_kobo: amountPaidKobo,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'trial');

    if (error) {
      console.error('Error converting trial to paid:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error converting trial to paid:', error);
    return false;
  }
}

// Track trial activity
export async function trackTrialActivity(
  userId: string, 
  activity: TrialActivity
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('user_trial_activities')
      .insert({
        user_id: userId,
        activity_type: activity.activity_type,
        activity_data: activity.activity_data || {}
      });

    if (error) {
      console.error('Error tracking trial activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error tracking trial activity:', error);
    return false;
  }
}

// Check if user can perform action (trial restrictions)
export async function canUserPerformAction(
  userId: string, 
  actionType: TrialActivity['activity_type']
): Promise<{ allowed: boolean; reason?: string; trialEndsAt?: string }> {
  try {
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    
    // If user has active subscription, allow all actions
    if (subscriptionStatus.subscription_active) {
      return { allowed: true };
    }

    // If user is in trial, allow most actions but track them
    if (subscriptionStatus.trial_active) {
      // Track the activity
      await trackTrialActivity(userId, { activity_type: actionType });
      return { 
        allowed: true,
        trialEndsAt: subscriptionStatus.trial_ends_at || undefined
      };
    }

    // If trial expired, restrict actions
    return { 
      allowed: false, 
      reason: 'Trial period expired. Please upgrade to continue using the app.',
      trialEndsAt: subscriptionStatus.trial_ends_at || undefined
    };
  } catch (error) {
    console.error('Error checking user action permission:', error);
    return { allowed: false, reason: 'Error checking permissions' };
  }
}

// Get trial days remaining
export function getTrialDaysRemaining(trialEndsAt: string): number {
  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Format trial time remaining
export function formatTrialTimeRemaining(trialEndsAt: string): string {
  const days = getTrialDaysRemaining(trialEndsAt);
  if (days === 0) {
    return 'Trial expired';
  } else if (days === 1) {
    return '1 day left';
  } else {
    return `${days} days left`;
  }
}
