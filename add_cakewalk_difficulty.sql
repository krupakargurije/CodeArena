-- Add CAKEWALK as a valid difficulty level
-- Run this in Supabase SQL Editor BEFORE running cleanup_and_seed_problems.sql

-- Step 1: Drop the existing difficulty constraint
ALTER TABLE problems 
DROP CONSTRAINT IF EXISTS problems_difficulty_check;

-- Step 2: Add new constraint that includes CAKEWALK
ALTER TABLE problems 
ADD CONSTRAINT problems_difficulty_check 
CHECK (difficulty IN ('CAKEWALK', 'EASY', 'MEDIUM', 'HARD'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'problems'::regclass 
AND conname = 'problems_difficulty_check';
