-- Function to add settings column if it doesn't exist
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION add_settings_column_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add settings column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN settings JSONB DEFAULT '{}';
    CREATE INDEX IF NOT EXISTS idx_profiles_settings ON public.profiles USING GIN (settings);
    RAISE NOTICE 'Settings column added to profiles table';
  ELSE
    RAISE NOTICE 'Settings column already exists';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_settings_column_if_not_exists() TO authenticated;

-- Also add the column directly (in case the function approach doesn't work)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON public.profiles USING GIN (settings);

