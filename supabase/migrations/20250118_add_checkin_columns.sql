-- Add check-in tracking columns to profiles table
-- This is a simple migration to add daily check-in functionality

-- Add check-in columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_checkin date,
ADD COLUMN IF NOT EXISTS checkin_streak integer DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_checkin ON public.profiles(last_checkin);
CREATE INDEX IF NOT EXISTS idx_profiles_checkin_streak ON public.profiles(checkin_streak);
