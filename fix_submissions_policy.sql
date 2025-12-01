-- Fix RLS policy for submissions table

-- Enable RLS (idempotent)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;

-- Create policies
-- 1. Allow users to view their own submissions
CREATE POLICY "Users can view their own submissions"
ON submissions FOR SELECT
USING (auth.uid() = user_id);

-- 2. Allow users to insert their own submissions
CREATE POLICY "Users can insert their own submissions"
ON submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON submissions TO authenticated;
