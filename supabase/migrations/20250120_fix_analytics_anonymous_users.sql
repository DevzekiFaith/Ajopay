-- Fix analytics table to handle anonymous users
-- This migration allows the user_analytics table to work with anonymous users

-- First, let's make the user_id field nullable to allow anonymous tracking
ALTER TABLE user_analytics ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure user_id is either a valid UUID or NULL
ALTER TABLE user_analytics ADD CONSTRAINT check_user_id_format 
CHECK (user_id IS NULL OR user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Update the foreign key constraint to allow NULL values
-- We need to drop and recreate the foreign key constraint
ALTER TABLE user_analytics DROP CONSTRAINT IF EXISTS user_analytics_user_id_fkey;

-- Recreate the foreign key constraint that allows NULL values
ALTER TABLE user_analytics ADD CONSTRAINT user_analytics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to handle anonymous users
DROP POLICY IF EXISTS "Users can view their own analytics" ON user_analytics;
DROP POLICY IF EXISTS "Users can insert their own analytics" ON user_analytics;

-- Create new policies that handle both authenticated and anonymous users
CREATE POLICY "Users can view their own analytics" ON user_analytics
  FOR SELECT USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own analytics" ON user_analytics
  FOR INSERT WITH CHECK (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Service role can still manage all analytics
DROP POLICY IF EXISTS "Service role can manage all analytics" ON user_analytics;
CREATE POLICY "Service role can manage all analytics" ON user_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Add an index for anonymous users (user_id = NULL)
CREATE INDEX IF NOT EXISTS idx_user_analytics_anonymous ON user_analytics(created_at) 
WHERE user_id IS NULL;

-- Add a comment to document the change
COMMENT ON COLUMN user_analytics.user_id IS 'User ID from auth.users table, or NULL for anonymous users';
