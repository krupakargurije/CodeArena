-- Migration: Add profile enhancement fields
-- Run this in your Supabase SQL Editor

-- STEP 1: Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- STEP 2: Create storage bucket for avatars
-- Go to Supabase Dashboard > Storage > New Bucket
-- Bucket name: avatars
-- Bucket settings:
--   ✓ Public bucket (Allow anyone to read objects without authorization)
--   ✓ File size limit: 5242880 (5MB in bytes)
--   ✓ Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- STEP 3: After creating the bucket, run these storage policies in SQL Editor

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
