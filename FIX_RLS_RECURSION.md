-- FIX RLS INFINITE RECURSION
-- Run this in Supabase SQL Editor

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON room_participants;
DROP POLICY IF EXISTS "Users can view rooms they're in" ON rooms;

-- 2. Create a SECURITY DEFINER function to check room membership
-- This function runs with admin privileges, bypassing RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_room_member(_room_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM room_participants
    WHERE room_id = _room_id
    AND user_id = auth.uid()
    AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create policies using the secure function

-- Policy for room_participants
-- Users can see rows if they are a member of that room
CREATE POLICY "Users can view participants in their rooms"
ON room_participants FOR SELECT
TO authenticated
USING (
    is_room_member(room_id)
);

-- Policy for rooms
-- Users can see rooms if they are a member
CREATE POLICY "Users can view rooms they're in"
ON rooms FOR SELECT
TO authenticated
USING (
    is_room_member(id)
);

-- 4. Ensure other policies are still correct (just in case)
-- Users can join (insert) if they are adding themselves
DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
CREATE POLICY "Users can join rooms"
ON room_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rows
DROP POLICY IF EXISTS "Users can update their own participation" ON room_participants;
CREATE POLICY "Users can update their own participation"
ON room_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
