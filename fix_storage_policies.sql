-- Fix storage bucket policies for user-settings bucket
-- This script sets up proper RLS policies for the user-settings storage bucket

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own settings" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own settings" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own settings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own settings" ON storage.objects;

-- Create policies for user-settings bucket
-- Policy 1: Users can view their own settings files
CREATE POLICY "Users can view their own settings" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can upload their own settings files
CREATE POLICY "Users can upload their own settings" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own settings files
CREATE POLICY "Users can update their own settings" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own settings files
CREATE POLICY "Users can delete their own settings" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-settings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
