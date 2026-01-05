-- Fix Room Joining Issue - RLS Policy Update
-- This migration fixes the issue where users cannot join rooms because they can't view them
-- Run this in Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view rooms they're in" ON rooms;

-- Create a new policy that allows users to view:
-- 1. Rooms in 'waiting' status (so they can join)
-- 2. Rooms they're already participants in (so they can see their active rooms)
CREATE POLICY "Users can view accessible rooms"
ON rooms FOR SELECT
TO authenticated
USING (
    status = 'waiting' OR
    id IN (
        SELECT room_id FROM room_participants 
        WHERE user_id = auth.uid() AND left_at IS NULL
    )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'rooms';
