-- Setup Firebase Storage for user settings
-- Run this in your Supabase SQL Editor

-- Create storage bucket for user settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-settings',
  'user-settings', 
  false,
  1048576, -- 1MB limit
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the user-settings bucket
CREATE POLICY "Users can upload their own settings" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view their own settings" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can update their own settings" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own settings" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create notifications table if it doesn't exist (for real-time updates)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON public.notifications(event);








