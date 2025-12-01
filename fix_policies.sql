-- Enable RLS on tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Rooms policies
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
CREATE POLICY "Rooms are viewable by everyone" 
ON rooms FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON rooms;
CREATE POLICY "Authenticated users can create rooms" 
ON rooms FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Room creators can update their rooms" ON rooms;
CREATE POLICY "Room creators can update their rooms" 
ON rooms FOR UPDATE 
USING (auth.uid() = created_by);

-- Room participants policies
DROP POLICY IF EXISTS "Room participants are viewable by everyone" ON room_participants;
CREATE POLICY "Room participants are viewable by everyone" 
ON room_participants FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can join rooms" ON room_participants;
CREATE POLICY "Authenticated users can join rooms" 
ON room_participants FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own participant status" ON room_participants;
CREATE POLICY "Users can update their own participant status" 
ON room_participants FOR UPDATE 
USING (auth.uid() = user_id);
