# URGENT: Fix Profile Save - Add Database Columns

## The Problem
Your profile updates aren't saving because the `profiles` table is missing the new columns: `name`, `bio`, and `avatar_url`.

**Error in console:** `PGRST116 - Cannot coerce the result to a single JSON object`

## The Solution - Run This SQL in Supabase

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run This SQL

```sql
-- Add the missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text;
```

### Step 3: Click "Run" Button

That's it! After running this SQL, your profile updates will work.

## Verify It Worked

After running the SQL:
1. Go back to http://localhost:3000/profile
2. Click "Edit Profile"
3. Enter your name and bio
4. Click "Save Changes"
5. It should now save successfully!

## For Profile Picture Upload

You also need to create the storage bucket:

### Step 1: Go to Storage
1. In Supabase dashboard, click **Storage** in left sidebar
2. Click **New bucket**

### Step 2: Create Bucket
- **Name:** `avatars`
- **Public bucket:** ✅ Check this box
- **File size limit:** `5242880` (5MB in bytes)
- **Allowed MIME types:** `image/jpeg,image/png,image/gif,image/webp`

### Step 3: Click "Create bucket"

## That's All!

Once you complete these 2 steps:
1. ✅ Run the SQL to add columns
2. ✅ Create the avatars storage bucket

Everything will work:
- Profile name and bio will save
- Profile pictures will upload
- Changes will appear in navbar

---

**Quick Test After Setup:**
1. Edit your profile and add name/bio
2. Upload a profile picture
3. Click Save
4. Refresh the page
5. Your changes should persist!
