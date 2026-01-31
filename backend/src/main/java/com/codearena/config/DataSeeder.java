package com.codearena.config;

import com.codearena.entity.Problem;
import com.codearena.entity.TestCase;
import com.codearena.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProblemRepository problemRepository;
    private final com.codearena.repository.UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (problemRepository.count() == 0) {
            seedProblems();
        }

        // Bootstrap Super Admin
        try {
            userRepository.findByEmail("krupakargurija177@gmail.com").ifPresent(user -> {
                if (!user.getRoles().contains("ROLE_ADMIN")) {
                    user.getRoles().add("ROLE_ADMIN");
                    userRepository.save(user);
                    System.out.println(">>> SUPER ADMIN GRANTED TO: " + user.getEmail());
                }
            });
        } catch (Exception e) {
            System.err.println(">>> Failed to bootstrap super admin: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void seedProblems() {
        List<Problem> problems = new ArrayList<>();

        // Problem 1: Two Sum
        Problem twoSum = new Problem();
        twoSum.setTitle("Two Sum");
        twoSum.setDescription(
                "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.");
        twoSum.setDifficulty(Problem.Difficulty.EASY);
        twoSum.setTags(List.of("Array", "Hash Table"));
        twoSum.setInputFormat(
                "First line contains an integer T, number of test cases.\nEach test case contains two lines:\n1. Array size N and target K\n2. N space-separated integers");
        twoSum.setOutputFormat("Space separated indices (0-indexed) of the two numbers.");
        twoSum.setConstraints("2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9");
        twoSum.setSampleInput("1\n4 9\n2 7 11 15");
        twoSum.setSampleOutput("0 1");
        twoSum.setExplanation("Because nums[0] + nums[1] == 9, we return 0 1.");

        List<TestCase> tsTests = new ArrayList<>();
        tsTests.add(createTestCase(twoSum, "9\n2 7 11 15", "0 1", true));
        tsTests.add(createTestCase(twoSum, "6\n3 2 4", "1 2", false));
        tsTests.add(createTestCase(twoSum, "6\n3 3", "0 1", false));
        twoSum.setTestCases(tsTests);
        problems.add(twoSum);

        // Problem 2: Reverse String
        Problem reverseString = new Problem();
        reverseString.setTitle("Reverse String");
        reverseString.setDescription(
                "Write a function that reverses a string. The input string is given as an array of characters `s`.");
        reverseString.setDifficulty(Problem.Difficulty.EASY);
        reverseString.setTags(List.of("String", "Two Pointers"));
        reverseString.setInputFormat("A single line containing the string S");
        reverseString.setOutputFormat("The reversed string");
        reverseString.setConstraints("1 <= s.length <= 10^5");
        reverseString.setSampleInput("hello");
        reverseString.setSampleOutput("olleh");
        reverseString.setExplanation("Reverse of hello is olleh");

        List<TestCase> rsTests = new ArrayList<>();
        rsTests.add(createTestCase(reverseString, "hello", "olleh", true));
        rsTests.add(createTestCase(reverseString, "Hannah", "hannaH", false));
        reverseString.setTestCases(rsTests);
        problems.add(reverseString);

        problemRepository.saveAll(problems);
        System.out.println(">>> Database seeded with " + problems.size() + " problems.");
    }

    private TestCase createTestCase(Problem problem, String input, String expected, boolean isSample) {
        TestCase tc = new TestCase();
        tc.setProblem(problem);
        tc.setInput(input);
        tc.setExpectedOutput(expected);
        tc.setIsSample(isSample);
        return tc;
    }
}
