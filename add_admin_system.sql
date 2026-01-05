-- Admin System Setup
-- Run this in Supabase SQL Editor

-- Step 1: Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Step 2: Set krupakargurija177@gmail.com as super admin
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'krupakargurija177@gmail.com';

-- Step 3: Create index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Step 4: Update RLS policies for problems table

-- Allow admins to insert problems
DROP POLICY IF EXISTS "Admins can insert problems" ON problems;
CREATE POLICY "Admins can insert problems"
ON problems FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    )
);

-- Allow admins to update problems
DROP POLICY IF EXISTS "Admins can update problems" ON problems;
CREATE POLICY "Admins can update problems"
ON problems FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    )
);

-- Allow admins to delete problems
DROP POLICY IF EXISTS "Admins can delete problems" ON problems;
CREATE POLICY "Admins can delete problems"
ON problems FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    )
);

-- Step 5: Update RLS policies for profiles table to allow admins to manage other admins

-- Allow admins to update other users' admin status
DROP POLICY IF EXISTS "Admins can update admin status" ON profiles;
CREATE POLICY "Admins can update admin status"
ON profiles FOR UPDATE
TO authenticated
USING (
    -- User can update their own profile OR user is an admin
    auth.uid() = id OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    )
);

-- Verify the setup
SELECT 
    email, 
    username, 
    is_admin 
FROM profiles 
WHERE is_admin = TRUE;
