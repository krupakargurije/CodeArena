-- Clean up duplicate problems and reset with correct data
-- Run this in Supabase SQL Editor

-- Step 1: Delete all rooms and related data first (to avoid foreign key constraint violations)
DELETE FROM room_participants;
DELETE FROM rooms;

-- Step 2: Delete all submissions that reference problems
DELETE FROM submissions;

-- Step 3: Delete all test cases
DELETE FROM test_cases;

-- Step 4: Now we can safely delete all problems
DELETE FROM problems;

-- Step 5: Reset the ID sequence to start from 1
ALTER SEQUENCE problems_id_seq RESTART WITH 1;

-- Now run the seed_problems.sql file content below:
-- (This ensures you get a clean slate with exactly 20 problems)

-- CAKEWALK PROBLEMS (5)
INSERT INTO problems (title, description, difficulty, tags, acceptance_rate, input_format, output_format, constraints, sample_input, sample_output, explanation) VALUES
(
    'Hello World',
    'Write a program that prints "Hello, World!" to the console.',
    'CAKEWALK',
    ARRAY['Cakewalk', 'Basics', 'I/O'],
    95.5,
    'No input required',
    'Print "Hello, World!" to the console',
    'None',
    '',
    'Hello, World!',
    'Simply print the string "Hello, World!" exactly as shown.'
),
(
    'Print Number',
    'Write a program that reads an integer from input and prints it.',
    'CAKEWALK',
    ARRAY['Cakewalk', 'Basics', 'I/O'],
    94.2,
    'A single integer N',
    'Print the integer N',
    '-10^9 ≤ N ≤ 10^9',
    '42',
    '42',
    'Read the input number and print it as output.'
),
(
    'Add Two Numbers',
    'Write a program that reads two integers and prints their sum.',
    'CAKEWALK',
    ARRAY['Cakewalk', 'Basics', 'Math'],
    93.8,
    'Two space-separated integers A and B',
    'Print the sum A + B',
    '-10^9 ≤ A, B ≤ 10^9',
    '5 7',
    '12',
    'Read two numbers, add them together, and print the result.'
),
(
    'Even or Odd',
    'Write a program that determines if a given number is even or odd.',
    'CAKEWALK',
    ARRAY['Cakewalk', 'Basics', 'Math'],
    92.5,
    'A single integer N',
    'Print "Even" if N is even, "Odd" if N is odd',
    '1 ≤ N ≤ 10^9',
    '4',
    'Even',
    'A number is even if it is divisible by 2, otherwise it is odd.'
),
(
    'Maximum of Two Numbers',
    'Write a program that finds the maximum of two given numbers.',
    'CAKEWALK',
    ARRAY['Cakewalk', 'Basics', 'Math'],
    91.7,
    'Two space-separated integers A and B',
    'Print the larger of the two numbers',
    '-10^9 ≤ A, B ≤ 10^9',
    '10 25',
    '25',
    'Compare the two numbers and print the larger one.'
);

-- EASY PROBLEMS (5)
INSERT INTO problems (title, description, difficulty, tags, acceptance_rate, input_format, output_format, constraints, sample_input, sample_output, explanation) VALUES
(
    'Reverse a String',
    'Write a program that reverses a given string.',
    'EASY',
    ARRAY['String', 'Two Pointers'],
    87.3,
    'A single string S',
    'Print the reversed string',
    '1 ≤ |S| ≤ 1000',
    'hello',
    'olleh',
    'Reverse the order of characters in the string.'
),
(
    'Palindrome Check',
    'Write a program that checks if a given string is a palindrome (reads the same forwards and backwards).',
    'EASY',
    ARRAY['String', 'Two Pointers'],
    85.6,
    'A single string S',
    'Print "Yes" if palindrome, "No" otherwise',
    '1 ≤ |S| ≤ 1000',
    'racecar',
    'Yes',
    'A palindrome reads the same forwards and backwards. Compare characters from both ends.'
),
(
    'Count Vowels',
    'Write a program that counts the number of vowels (a, e, i, o, u) in a given string.',
    'EASY',
    ARRAY['String'],
    84.2,
    'A single string S (lowercase letters only)',
    'Print the count of vowels',
    '1 ≤ |S| ≤ 1000',
    'programming',
    '3',
    'Count occurrences of a, e, i, o, u in the string. In "programming" there are: o, a, i = 3 vowels.'
),
(
    'Factorial',
    'Write a program that calculates the factorial of a given number N (N!).',
    'EASY',
    ARRAY['Math', 'Recursion'],
    82.9,
    'A single integer N',
    'Print N! (factorial of N)',
    '0 ≤ N ≤ 20',
    '5',
    '120',
    'Factorial of 5 is 5 × 4 × 3 × 2 × 1 = 120'
),
(
    'Sum of Array',
    'Write a program that calculates the sum of all elements in an array.',
    'EASY',
    ARRAY['Array', 'Math'],
    88.5,
    'First line: N (size of array)\nSecond line: N space-separated integers',
    'Print the sum of all elements',
    '1 ≤ N ≤ 1000\n-10^9 ≤ array[i] ≤ 10^9',
    '5\n1 2 3 4 5',
    '15',
    'Sum all elements: 1 + 2 + 3 + 4 + 5 = 15'
);

-- MEDIUM PROBLEMS (5)
INSERT INTO problems (title, description, difficulty, tags, acceptance_rate, input_format, output_format, constraints, sample_input, sample_output, explanation) VALUES
(
    'Two Sum',
    'Given an array of integers and a target value, find two numbers that add up to the target. Return their indices.',
    'MEDIUM',
    ARRAY['Array', 'Hash Table'],
    49.2,
    'First line: N (size of array)\nSecond line: N space-separated integers\nThird line: target value',
    'Print two space-separated indices (0-indexed) of the numbers that add up to target',
    '2 ≤ N ≤ 10^4\n-10^9 ≤ array[i] ≤ 10^9\nExactly one solution exists',
    '4\n2 7 11 15\n9',
    '0 1',
    'nums[0] + nums[1] = 2 + 7 = 9, so return indices 0 and 1'
),
(
    'Valid Parentheses',
    'Given a string containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if brackets are closed in the correct order.',
    'MEDIUM',
    ARRAY['Stack', 'String'],
    42.5,
    'A single string S containing only brackets',
    'Print "Valid" if valid, "Invalid" otherwise',
    '1 ≤ |S| ≤ 10^4',
    '({[]})',
    'Valid',
    'Every opening bracket has a corresponding closing bracket in the correct order.'
),
(
    'Longest Substring Without Repeating Characters',
    'Given a string, find the length of the longest substring without repeating characters.',
    'MEDIUM',
    ARRAY['String', 'Sliding Window', 'Hash Table'],
    38.7,
    'A single string S',
    'Print the length of the longest substring without repeating characters',
    '0 ≤ |S| ≤ 5 × 10^4',
    'abcabcbb',
    '3',
    'The answer is "abc", with length 3.'
),
(
    'Binary Search',
    'Given a sorted array and a target value, return the index of the target if found. If not found, return -1.',
    'MEDIUM',
    ARRAY['Array', 'Binary Search'],
    55.3,
    'First line: N (size of array)\nSecond line: N space-separated sorted integers\nThird line: target value',
    'Print the index of target (0-indexed), or -1 if not found',
    '1 ≤ N ≤ 10^4\n-10^9 ≤ array[i] ≤ 10^9\nArray is sorted in ascending order',
    '5\n1 3 5 7 9\n7',
    '3',
    'The target 7 is found at index 3.'
),
(
    'Merge Two Sorted Arrays',
    'Given two sorted arrays, merge them into a single sorted array.',
    'MEDIUM',
    ARRAY['Array', 'Two Pointers'],
    46.8,
    'First line: N (size of first array)\nSecond line: N space-separated sorted integers\nThird line: M (size of second array)\nFourth line: M space-separated sorted integers',
    'Print the merged sorted array as space-separated integers',
    '0 ≤ N, M ≤ 1000\n-10^9 ≤ array[i] ≤ 10^9',
    '3\n1 3 5\n3\n2 4 6',
    '1 2 3 4 5 6',
    'Merge both arrays maintaining sorted order.'
);

-- HARD PROBLEMS (5)
INSERT INTO problems (title, description, difficulty, tags, acceptance_rate, input_format, output_format, constraints, sample_input, sample_output, explanation) VALUES
(
    'Median of Two Sorted Arrays',
    'Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).',
    'HARD',
    ARRAY['Binary Search', 'Divide and Conquer'],
    35.2,
    'First line: N (size of first array)\nSecond line: N space-separated sorted integers\nThird line: M (size of second array)\nFourth line: M space-separated sorted integers',
    'Print the median as a decimal number (2 decimal places)',
    '0 ≤ N, M ≤ 1000\n-10^6 ≤ array[i] ≤ 10^6',
    '2\n1 3\n1\n2',
    '2.00',
    'The merged array is [1,2,3] and median is 2.'
),
(
    'Longest Valid Parentheses',
    'Given a string containing just the characters ''('' and '')'', find the length of the longest valid (well-formed) parentheses substring.',
    'HARD',
    ARRAY['String', 'Dynamic Programming', 'Stack'],
    32.8,
    'A single string S containing only ''('' and '')''',
    'Print the length of the longest valid parentheses substring',
    '0 ≤ |S| ≤ 3 × 10^4',
    '(()',
    '2',
    'The longest valid parentheses substring is "()" with length 2.'
),
(
    'Trapping Rain Water',
    'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    'HARD',
    ARRAY['Array', 'Two Pointers', 'Dynamic Programming'],
    28.5,
    'First line: N (number of bars)\nSecond line: N space-separated non-negative integers representing heights',
    'Print the total amount of water trapped',
    '1 ≤ N ≤ 2 × 10^4\n0 ≤ height[i] ≤ 10^5',
    '12\n0 1 0 2 1 0 1 3 2 1 2 1',
    '6',
    'Water can be trapped between the bars. Total water = 6 units.'
),
(
    'N-Queens',
    'The n-queens puzzle is the problem of placing n queens on an n×n chessboard such that no two queens attack each other. Given an integer n, return the number of distinct solutions.',
    'HARD',
    ARRAY['Backtracking', 'Recursion'],
    25.7,
    'A single integer N',
    'Print the number of distinct solutions',
    '1 ≤ N ≤ 9',
    '4',
    '2',
    'There are 2 distinct solutions for 4-queens problem.'
),
(
    'Word Ladder',
    'Given two words (beginWord and endWord), and a dictionary word list, find the length of shortest transformation sequence from beginWord to endWord. Only one letter can be changed at a time and each transformed word must exist in the word list.',
    'HARD',
    ARRAY['BFS', 'Hash Table', 'String'],
    31.4,
    'First line: beginWord\nSecond line: endWord\nThird line: N (number of words in dictionary)\nNext N lines: one word per line',
    'Print the length of shortest transformation sequence, or 0 if no sequence exists',
    '1 ≤ |word| ≤ 10\n1 ≤ N ≤ 5000\nAll words have the same length\nAll words contain only lowercase letters',
    'hit\nhot\n6\nhot\ndot\ndog\nlot\nlog\ncog',
    '5',
    'One shortest transformation is "hit" -> "hot" -> "dot" -> "dog" -> "cog", which is 5 words long.'
);

-- Verify the cleanup and new data
SELECT 
    difficulty, 
    COUNT(*) as count,
    STRING_AGG(title, ', ' ORDER BY id) as titles
FROM problems
GROUP BY difficulty
ORDER BY 
    CASE difficulty
        WHEN 'EASY' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'HARD' THEN 3
    END;

-- Show total count
SELECT COUNT(*) as total_problems FROM problems;
