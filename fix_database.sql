-- Run this SQL in your Supabase SQL Editor to fix the 400 errors

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON public.profiles USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_business_name ON public.profiles (business_name);

-- Update RLS policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Add comments to document the changes
COMMENT ON COLUMN public.profiles.settings IS 'User preferences and settings stored as JSON';
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique referral code for commission tracking';
COMMENT ON COLUMN public.profiles.business_name IS 'Business name for business accounts';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';






