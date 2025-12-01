-- Fix RLS policy for problems table

-- Enable RLS (idempotent)
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Problems are viewable by everyone" ON problems;
DROP POLICY IF EXISTS "Public read access" ON problems;

-- Create the policy again
CREATE POLICY "Problems are viewable by everyone" 
ON problems FOR SELECT 
USING (true);

-- Grant access to anon and authenticated roles (just in case)
GRANT SELECT ON problems TO anon, authenticated;
