-- CORRECTED SEED PROBLEMS DATA
-- Run this in Supabase SQL Editor

-- 1. Insert Problems
INSERT INTO problems (title, description, difficulty, tags, sample_input, sample_output)
VALUES 
(
    'Two Sum', 
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 
    'EASY', 
    ARRAY['Array', 'Hash Table'],
    'nums = [2,7,11,15], target = 9',
    '[0,1]'
),
(
    'Palindrome Number', 
    'Given an integer x, return true if x is a palindrome, and false otherwise.', 
    'EASY', 
    ARRAY['Math'],
    'x = 121',
    'true'
),
(
    'Longest Substring Without Repeating Characters', 
    'Given a string s, find the length of the longest substring without repeating characters.', 
    'MEDIUM', 
    ARRAY['String', 'Sliding Window'],
    's = "abcabcbb"',
    '3'
);

-- 2. Insert Test Cases (linking to the problems we just created)
-- We use a DO block to dynamically find the IDs
DO $$
DECLARE
    p_two_sum_id bigint;
    p_palindrome_id bigint;
    p_longest_id bigint;
BEGIN
    -- Get IDs
    SELECT id INTO p_two_sum_id FROM problems WHERE title = 'Two Sum' LIMIT 1;
    SELECT id INTO p_palindrome_id FROM problems WHERE title = 'Palindrome Number' LIMIT 1;
    SELECT id INTO p_longest_id FROM problems WHERE title = 'Longest Substring Without Repeating Characters' LIMIT 1;

    -- Insert Test Cases for Two Sum
    IF p_two_sum_id IS NOT NULL THEN
        INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
        (p_two_sum_id, 'nums = [2,7,11,15], target = 9', '[0,1]', true),
        (p_two_sum_id, 'nums = [3,2,4], target = 6', '[1,2]', false),
        (p_two_sum_id, 'nums = [3,3], target = 6', '[0,1]', false);
    END IF;

    -- Insert Test Cases for Palindrome Number
    IF p_palindrome_id IS NOT NULL THEN
        INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
        (p_palindrome_id, '121', 'true', true),
        (p_palindrome_id, '-121', 'false', true),
        (p_palindrome_id, '10', 'false', false);
    END IF;

    -- Insert Test Cases for Longest Substring
    IF p_longest_id IS NOT NULL THEN
        INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
        (p_longest_id, '"abcabcbb"', '3', true),
        (p_longest_id, '"bbbbb"', '1', true),
        (p_longest_id, '"pwwkew"', '3', false);
    END IF;
END $$;
