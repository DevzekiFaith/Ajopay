-- User Commission System Migration
-- This migration creates tables for users to earn real money from app activities

-- Enable necessary extensions
create extension if not exists pgcrypto;

-- User commissions table - tracks all commission earnings
create table if not exists public.user_commissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  commission_type text not null check (commission_type in (
    'daily_checkin', 'save_activity', 'streak_milestone', 'goal_complete', 
    'badge_earned', 'referral_bonus', 'circle_creation', 'challenge_complete',
    'social_engagement', 'level_up'
  )),
  amount_kobo bigint not null check (amount_kobo > 0),
  description text not null,
  source_id uuid, -- references the activity that earned the commission (goal_id, badge_id, etc.)
  source_type text, -- 'goal', 'badge', 'streak', 'referral', etc.
  status text not null check (status in ('pending', 'paid', 'cancelled')) default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- User rewards table - tracks claimable rewards
create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  reward_type text not null check (reward_type in (
    'daily_bonus', 'streak_bonus', 'achievement_bonus', 'referral_bonus',
    'challenge_bonus', 'social_bonus', 'level_bonus'
  )),
  amount_kobo bigint not null check (amount_kobo > 0),
  title text not null,
  description text,
  claimed_at timestamptz,
  expires_at timestamptz,
  is_claimed boolean default false,
  created_at timestamptz default now()
);

-- User referral system
create table if not exists public.user_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade not null,
  referral_code text not null,
  status text not null check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  commission_earned_kobo bigint default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(referred_id) -- Each user can only be referred once
);

-- User activity tracking for commission calculations
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null check (activity_type in (
    'daily_checkin', 'save_money', 'create_goal', 'complete_goal', 'earn_badge',
    'join_circle', 'create_circle', 'join_challenge', 'complete_challenge',
    'refer_friend', 'social_post', 'level_up'
  )),
  activity_data jsonb, -- stores additional data about the activity
  commission_eligible boolean default true,
  created_at timestamptz default now()
);

-- Commission payout history
create table if not exists public.commission_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  total_amount_kobo bigint not null,
  commission_count integer not null,
  payout_method text not null check (payout_method in ('wallet_credit', 'bank_transfer')),
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- Add referral_code to profiles table if not exists
alter table public.profiles 
add column if not exists referral_code text unique,
add column if not exists total_commissions_earned_kobo bigint default 0,
add column if not exists total_commissions_paid_kobo bigint default 0,
add column if not exists last_commission_payout timestamptz;

-- Generate referral codes for existing users
update public.profiles 
set referral_code = upper(substring(md5(id::text) from 1 for 8))
where referral_code is null;

-- Enable RLS on new tables
alter table public.user_commissions enable row level security;
alter table public.user_rewards enable row level security;
alter table public.user_referrals enable row level security;
alter table public.user_activities enable row level security;
alter table public.commission_payouts enable row level security;

-- RLS Policies for user_commissions
create policy "Users can view own commissions" on public.user_commissions
  for select using (user_id = auth.uid());

create policy "System can insert commissions" on public.user_commissions
  for insert with check (true);

create policy "System can update commission status" on public.user_commissions
  for update using (true);

-- RLS Policies for user_rewards
create policy "Users can view own rewards" on public.user_rewards
  for select using (user_id = auth.uid());

create policy "Users can claim own rewards" on public.user_rewards
  for update using (user_id = auth.uid());

create policy "System can insert rewards" on public.user_rewards
  for insert with check (true);

-- RLS Policies for user_referrals
create policy "Users can view own referrals" on public.user_referrals
  for select using (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "System can manage referrals" on public.user_referrals
  for all using (true);

-- RLS Policies for user_activities
create policy "Users can view own activities" on public.user_activities
  for select using (user_id = auth.uid());

create policy "System can insert activities" on public.user_activities
  for insert with check (true);

-- RLS Policies for commission_payouts
create policy "Users can view own payouts" on public.commission_payouts
  for select using (user_id = auth.uid());

create policy "System can manage payouts" on public.commission_payouts
  for all using (true);

-- Function to award commission
create or replace function public.award_commission(
  p_user_id uuid,
  p_commission_type text,
  p_amount_kobo bigint,
  p_description text,
  p_source_id uuid default null,
  p_source_type text default null
) returns uuid language plpgsql as $$
declare
  commission_id uuid;
begin
  -- Insert commission
  insert into public.user_commissions (
    user_id, commission_type, amount_kobo, description, source_id, source_type
  ) values (
    p_user_id, p_commission_type, p_amount_kobo, p_description, p_source_id, p_source_type
  ) returning id into commission_id;
  
  -- Update user's total commissions earned
  update public.profiles 
  set total_commissions_earned_kobo = total_commissions_earned_kobo + p_amount_kobo
  where id = p_user_id;
  
  -- Log activity
  insert into public.user_activities (user_id, activity_type, activity_data)
  values (p_user_id, 'commission_earned', jsonb_build_object(
    'commission_id', commission_id,
    'amount_kobo', p_amount_kobo,
    'type', p_commission_type
  ));
  
  return commission_id;
end;
$$;

-- Function to create reward
create or replace function public.create_reward(
  p_user_id uuid,
  p_reward_type text,
  p_amount_kobo bigint,
  p_title text,
  p_description text default null,
  p_expires_at timestamptz default null
) returns uuid language plpgsql as $$
declare
  reward_id uuid;
begin
  insert into public.user_rewards (
    user_id, reward_type, amount_kobo, title, description, expires_at
  ) values (
    p_user_id, p_reward_type, p_amount_kobo, p_title, p_description, p_expires_at
  ) returning id into reward_id;
  
  return reward_id;
end;
$$;

-- Function to claim reward
create or replace function public.claim_reward(p_reward_id uuid) returns boolean language plpgsql as $$
declare
  reward_record record;
  commission_id uuid;
begin
  -- Get reward details
  select * into reward_record from public.user_rewards where id = p_reward_id;
  
  if not found or reward_record.is_claimed or reward_record.user_id != auth.uid() then
    return false;
  end if;
  
  -- Check if expired
  if reward_record.expires_at is not null and reward_record.expires_at < now() then
    return false;
  end if;
  
  -- Mark as claimed
  update public.user_rewards 
  set is_claimed = true, claimed_at = now()
  where id = p_reward_id;
  
  -- Award commission
  select public.award_commission(
    reward_record.user_id,
    'reward_claim',
    reward_record.amount_kobo,
    'Claimed reward: ' || reward_record.title,
    p_reward_id,
    'reward'
  ) into commission_id;
  
  return true;
end;
$$;

-- Function to process daily check-in
create or replace function public.process_daily_checkin(p_user_id uuid) returns boolean language plpgsql as $$
declare
  last_checkin date;
  streak_days integer := 0;
  commission_amount bigint;
begin
  -- Check if already checked in today
  select max(created_at::date) into last_checkin
  from public.user_activities 
  where user_id = p_user_id and activity_type = 'daily_checkin';
  
  if last_checkin = current_date then
    return false; -- Already checked in today
  end if;
  
  -- Calculate streak
  if last_checkin = current_date - interval '1 day' then
    -- Continue streak
    select count(*) into streak_days
    from public.user_activities 
    where user_id = p_user_id 
    and activity_type = 'daily_checkin'
    and created_at::date >= current_date - interval '30 days'
    and created_at::date <= current_date;
  else
    -- New streak
    streak_days := 1;
  end if;
  
  -- Log check-in activity
  insert into public.user_activities (user_id, activity_type, activity_data)
  values (p_user_id, 'daily_checkin', jsonb_build_object('streak_days', streak_days));
  
  -- Award commission based on streak
  commission_amount := 50 + (streak_days * 10); -- Base 50 + 10 per streak day
  if commission_amount > 500 then commission_amount := 500; end if; -- Cap at 500
  
  perform public.award_commission(
    p_user_id,
    'daily_checkin',
    commission_amount,
    'Daily check-in bonus (Streak: ' || streak_days || ' days)'
  );
  
  -- Award streak milestone bonuses
  if streak_days = 7 then
    perform public.award_commission(
      p_user_id,
      'streak_milestone',
      1000,
      '7-day streak milestone bonus'
    );
  elsif streak_days = 30 then
    perform public.award_commission(
      p_user_id,
      'streak_milestone',
      5000,
      '30-day streak milestone bonus'
    );
  end if;
  
  return true;
end;
$$;

-- Function to process goal completion
create or replace function public.process_goal_completion(
  p_user_id uuid,
  p_goal_id uuid,
  p_goal_title text,
  p_target_amount bigint
) returns boolean language plpgsql as $$
declare
  commission_amount bigint;
begin
  -- Calculate commission based on goal size
  commission_amount := greatest(500, p_target_amount / 100); -- 1% of goal or minimum 500
  if commission_amount > 10000 then commission_amount := 10000; end if; -- Cap at 10,000
  
  -- Award commission
  perform public.award_commission(
    p_user_id,
    'goal_complete',
    commission_amount,
    'Goal completion bonus: ' || p_goal_title,
    p_goal_id,
    'goal'
  );
  
  -- Log activity
  insert into public.user_activities (user_id, activity_type, activity_data)
  values (p_user_id, 'complete_goal', jsonb_build_object(
    'goal_id', p_goal_id,
    'goal_title', p_goal_title,
    'target_amount', p_target_amount
  ));
  
  return true;
end;
$$;

-- Function to process badge earning
create or replace function public.process_badge_earning(
  p_user_id uuid,
  p_badge_name text,
  p_badge_rarity text
) returns boolean language plpgsql as $$
declare
  commission_amount bigint;
begin
  -- Calculate commission based on badge rarity
  case p_badge_rarity
    when 'common' then commission_amount := 200;
    when 'rare' then commission_amount := 500;
    when 'epic' then commission_amount := 1000;
    when 'legendary' then commission_amount := 2000;
    else commission_amount := 200;
  end case;
  
  -- Award commission
  perform public.award_commission(
    p_user_id,
    'badge_earned',
    commission_amount,
    'Badge earned: ' || p_badge_name,
    null,
    'badge'
  );
  
  -- Log activity
  insert into public.user_activities (user_id, activity_type, activity_data)
  values (p_user_id, 'earn_badge', jsonb_build_object(
    'badge_name', p_badge_name,
    'badge_rarity', p_badge_rarity
  ));
  
  return true;
end;
$$;

-- Create indexes for performance
create index if not exists idx_user_commissions_user_id on public.user_commissions(user_id);
create index if not exists idx_user_commissions_type on public.user_commissions(commission_type);
create index if not exists idx_user_commissions_status on public.user_commissions(status);
create index if not exists idx_user_commissions_created_at on public.user_commissions(created_at);

create index if not exists idx_user_rewards_user_id on public.user_rewards(user_id);
create index if not exists idx_user_rewards_claimed on public.user_rewards(is_claimed);
create index if not exists idx_user_rewards_expires_at on public.user_rewards(expires_at);

create index if not exists idx_user_referrals_referrer on public.user_referrals(referrer_id);
create index if not exists idx_user_referrals_referred on public.user_referrals(referred_id);
create index if not exists idx_user_referrals_code on public.user_referrals(referral_code);

create index if not exists idx_user_activities_user_id on public.user_activities(user_id);
create index if not exists idx_user_activities_type on public.user_activities(activity_type);
create index if not exists idx_user_activities_created_at on public.user_activities(created_at);

-- Grant necessary permissions
grant select, insert, update on public.user_commissions to authenticated;
grant select, insert, update on public.user_rewards to authenticated;
grant select, insert, update on public.user_referrals to authenticated;
grant select, insert on public.user_activities to authenticated;
grant select on public.commission_payouts to authenticated;

grant execute on function public.award_commission to authenticated;
grant execute on function public.create_reward to authenticated;
grant execute on function public.claim_reward to authenticated;
grant execute on function public.process_daily_checkin to authenticated;
grant execute on function public.process_goal_completion to authenticated;
grant execute on function public.process_badge_earning to authenticated;


