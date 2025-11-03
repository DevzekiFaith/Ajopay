-- Subscription and Trial Management System
-- This migration creates tables for managing user subscriptions and trial periods

-- Enable necessary extensions
create extension if not exists pgcrypto;

-- User subscriptions table
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_type text not null check (plan_type in ('king_elite')),
  status text not null check (status in ('trial', 'active', 'expired', 'cancelled')) default 'trial',
  trial_started_at timestamptz default now(),
  trial_ends_at timestamptz not null,
  subscription_started_at timestamptz,
  subscription_ends_at timestamptz,
  payment_reference text,
  amount_paid_kobo integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User trial activities tracking
create table if not exists public.user_trial_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  activity_type text not null check (activity_type in (
    'contribution', 'goal_creation', 'circle_join', 'circle_create', 
    'challenge_participation', 'gamification_feature', 'analytics_access',
    'export_data', 'advanced_notifications'
  )),
  activity_data jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);
create index if not exists idx_user_trial_activities_user_id on public.user_trial_activities(user_id);
create index if not exists idx_user_trial_activities_type on public.user_trial_activities(activity_type);

-- RLS policies
alter table public.user_subscriptions enable row level security;
alter table public.user_trial_activities enable row level security;

-- Users can view their own subscription
create policy "Users can view their own subscription" on public.user_subscriptions
  for select using (auth.uid() = user_id);

-- Users can view their own trial activities
create policy "Users can view their own trial activities" on public.user_trial_activities
  for select using (auth.uid() = user_id);

-- Service role can manage all subscriptions
create policy "Service role can manage all subscriptions" on public.user_subscriptions
  for all using (auth.role() = 'service_role');

-- Service role can manage all trial activities
create policy "Service role can manage all trial activities" on public.user_trial_activities
  for all using (auth.role() = 'service_role');

-- Function to check if user is in trial period
create or replace function public.is_user_in_trial(user_uuid uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  trial_ends_at timestamptz;
begin
  select us.trial_ends_at into trial_ends_at
  from public.user_subscriptions us
  where us.user_id = user_uuid
    and us.status = 'trial'
  limit 1;
  
  if trial_ends_at is null then
    return false;
  end if;
  
  return now() < trial_ends_at;
end;
$$;

-- Function to check if user has active subscription
create or replace function public.has_active_subscription(user_uuid uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  subscription_count integer;
begin
  select count(*) into subscription_count
  from public.user_subscriptions us
  where us.user_id = user_uuid
    and us.status = 'active'
    and (us.subscription_ends_at is null or now() < us.subscription_ends_at);
  
  return subscription_count > 0;
end;
$$;

-- Function to get user subscription status
create or replace function public.get_user_subscription_status(user_uuid uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  subscription_record record;
  result jsonb;
begin
  select * into subscription_record
  from public.user_subscriptions us
  where us.user_id = user_uuid
  order by us.created_at desc
  limit 1;
  
  if subscription_record is null then
    return jsonb_build_object(
      'has_subscription', false,
      'status', 'none',
      'trial_active', false,
      'trial_ends_at', null,
      'subscription_active', false
    );
  end if;
  
  result := jsonb_build_object(
    'has_subscription', true,
    'status', subscription_record.status,
    'trial_active', subscription_record.status = 'trial' and now() < subscription_record.trial_ends_at,
    'trial_ends_at', subscription_record.trial_ends_at,
    'subscription_active', subscription_record.status = 'active' and (subscription_record.subscription_ends_at is null or now() < subscription_record.subscription_ends_at),
    'plan_type', subscription_record.plan_type,
    'trial_started_at', subscription_record.trial_started_at,
    'subscription_started_at', subscription_record.subscription_started_at
  );
  
  return result;
end;
$$;













