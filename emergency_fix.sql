-- Emergency Fix for 400 Bad Request Errors
-- Run this in your Supabase SQL Editor immediately

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON public.profiles USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_business_name ON public.profiles (business_name);

-- 3. Add constraints for role column
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin'));

-- 4. Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 5. Create user-settings storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-settings', 'user-settings', false, 1048576, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage policies for user-settings bucket
CREATE POLICY "user_settings_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-settings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user_settings_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-settings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user_settings_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-settings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user_settings_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-settings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Add comments to document the fix
COMMENT ON COLUMN public.profiles.settings IS 'User preferences and settings stored as JSON - added to fix 400 errors';
COMMENT ON COLUMN public.profiles.role IS 'User role: customer or admin - added to fix 42703 error';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name';
COMMENT ON COLUMN public.profiles.email IS 'User email address';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.business_name IS 'Business name for business accounts';
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique referral code for commission tracking';
