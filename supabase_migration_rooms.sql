-- Multiplayer Coding Rooms Database Schema
-- Run this in Supabase SQL Editor

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY, -- 6-character unique code (e.g., "ABC123")
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    problem_id BIGINT REFERENCES problems(id),
    problem_selection_mode TEXT CHECK (problem_selection_mode IN ('single', 'random')) NOT NULL,
    max_participants INTEGER CHECK (max_participants BETWEEN 1 AND 4) NOT NULL,
    status TEXT CHECK (status IN ('waiting', 'active', 'completed')) DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);

-- 2. ROOM PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS room_participants (
    id BIGSERIAL PRIMARY KEY,
    room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_ready BOOLEAN DEFAULT FALSE,
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);

-- 3. ADD ROOM_ID TO SUBMISSIONS (if not exists)
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS room_id TEXT REFERENCES rooms(id);

-- 4. ROW LEVEL SECURITY POLICIES

-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Users can view rooms they're in
CREATE POLICY "Users can view rooms they're in"
ON rooms FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT room_id FROM room_participants 
        WHERE user_id = auth.uid() AND left_at IS NULL
    )
);

-- Users can create rooms
CREATE POLICY "Users can create rooms"
ON rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Room creators can update their rooms
CREATE POLICY "Room creators can update their rooms"
ON rooms FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Enable RLS on room_participants table
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants in their rooms
CREATE POLICY "Users can view participants in their rooms"
ON room_participants FOR SELECT
TO authenticated
USING (
    room_id IN (
        SELECT room_id FROM room_participants 
        WHERE user_id = auth.uid() AND left_at IS NULL
    )
);

-- Users can join rooms
CREATE POLICY "Users can join rooms"
ON room_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation
CREATE POLICY "Users can update their own participation"
ON room_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 5. ENABLE REALTIME (for live updates)
-- Run this to enable realtime on rooms and room_participants
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
