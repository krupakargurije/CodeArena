# Fix: Create Your Profile Row in Database

## The Issue
The columns exist, but your user doesn't have a row in the `profiles` table yet.

## The Fix - Run This SQL

Go back to **Supabase SQL Editor** and run this:

```sql
-- First, let's see your user ID
SELECT id, email FROM auth.users;
```

**Copy your user ID from the result**, then run this (replace `YOUR_USER_ID_HERE` with your actual ID):

```sql
-- Insert your profile (replace YOUR_USER_ID_HERE with your actual user ID)
INSERT INTO profiles (id, username, email, rating, problems_solved)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'Nobita', split_part(email, '@', 1)) as username,
    email,
    1200 as rating,
    0 as problems_solved
FROM auth.users
WHERE id = 'Nobita'
ON CONFLICT (id) DO NOTHING;
```

**OR, if you want to create profiles for ALL users who don't have one:**

```sql
-- Create profiles for all users who don't have one yet
INSERT INTO profiles (id, username, email, rating, problems_solved)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'Nobita', split_part(u.email, '@', 1)) as username,
    u.email,
    1200 as rating,
    0 as problems_solved
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

## After Running the SQL

1. Refresh your profile page
2. Click "Edit Profile"
3. Add your name and bio
4. Click "Save Changes"
5. ✅ It should work now!

## Verify It Worked

Run this to check:
```sql
SELECT * FROM profiles WHERE email = 'your-email@example.com';
```

You should see your profile row with all the columns including `name`, `bio`, and `avatar_url`.
