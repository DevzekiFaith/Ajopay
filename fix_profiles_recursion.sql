-- Fix infinite recursion in profiles RLS policy
-- Run this in your Supabase SQL Editor

-- Drop all existing profiles policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_agent_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_self" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_self" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow reading profiles by email for friend search (without recursion)
CREATE POLICY "profiles_select_by_email" ON public.profiles
  FOR SELECT USING (true);

-- Add missing columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON public.profiles USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code);

-- Add comments
COMMENT ON COLUMN public.profiles.settings IS 'User preferences and settings stored as JSON';
COMMENT ON COLUMN public.profiles.email IS 'User email address';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.business_name IS 'Business name for business accounts';
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique referral code for commission tracking';
