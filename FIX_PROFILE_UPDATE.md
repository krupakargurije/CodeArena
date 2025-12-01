# CORRECT SQL - Create Profile Row

## Run This Exact SQL in Supabase

```sql
-- Create profiles for all users who don't have one
INSERT INTO profiles (id, username, email, rating, problems_solved)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
    u.email,
    1200 as rating,
    0 as problems_solved
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

## Check If Profile Exists

Run this to see if your profile was created:

```sql
SELECT id, username, email, name, bio, avatar_url 
FROM profiles 
ORDER BY created_at DESC;
```

## If Profile Exists But Save Still Fails

The issue might be with RLS (Row Level Security) policies. Run this to check:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## Add Missing UPDATE Policy

If the UPDATE policy is missing, run this:

```sql
-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

## Test Query

Try updating manually to see if it works:

```sql
-- Replace 'your-user-id' with your actual user ID
UPDATE profiles 
SET name = 'Test Name', bio = 'Test Bio'
WHERE id = (SELECT id FROM auth.users LIMIT 1);
```

If this works, the issue is with the RLS policy.
