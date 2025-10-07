-- Fix user_connections table and add missing RLS policies
-- Run this in your Supabase SQL Editor

-- Ensure user_connections table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  friend_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'blocked')) not null default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Enable RLS on user_connections table
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_connections_select_own" ON public.user_connections;
DROP POLICY IF EXISTS "user_connections_insert_own" ON public.user_connections;
DROP POLICY IF EXISTS "user_connections_update_own" ON public.user_connections;
DROP POLICY IF EXISTS "user_connections_delete_own" ON public.user_connections;

-- Create RLS policies for user_connections
-- Users can select connections where they are either the sender or receiver
CREATE POLICY "user_connections_select_own" ON public.user_connections
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Users can insert connections where they are the sender
CREATE POLICY "user_connections_insert_own" ON public.user_connections
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update connections where they are the receiver (to accept/reject)
CREATE POLICY "user_connections_update_own" ON public.user_connections
  FOR UPDATE USING (
    auth.uid() = friend_id
  ) WITH CHECK (
    auth.uid() = friend_id
  );

-- Users can delete their own connections
CREATE POLICY "user_connections_delete_own" ON public.user_connections
  FOR DELETE USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Create indexes for performance (without IF NOT EXISTS for Supabase compatibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_connections_user_id') THEN
        CREATE INDEX idx_user_connections_user_id ON public.user_connections(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_connections_friend_id') THEN
        CREATE INDEX idx_user_connections_friend_id ON public.user_connections(friend_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_connections_status') THEN
        CREATE INDEX idx_user_connections_status ON public.user_connections(status);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.user_connections IS 'Friend connections and requests between users';
COMMENT ON COLUMN public.user_connections.user_id IS 'User who sent the friend request';
COMMENT ON COLUMN public.user_connections.friend_id IS 'User who received the friend request';
COMMENT ON COLUMN public.user_connections.status IS 'Status of the connection: pending, accepted, or blocked';
