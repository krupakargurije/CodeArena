package com.codearena.service;

import com.codearena.dto.SubmissionRequest;
import com.codearena.dto.SubmissionResponse;
import com.codearena.entity.Problem;
import com.codearena.entity.Submission;
import com.codearena.entity.TestCase;
import com.codearena.entity.User;
import com.codearena.repository.ProblemRepository;
import com.codearena.repository.SubmissionRepository;
import com.codearena.repository.UserRepository;
import com.codearena.repository.RoomParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final CodeRunnerService codeRunnerService;
    private final RoomService roomService;
    private final RoomParticipantRepository roomParticipantRepository;

    @Transactional
    public SubmissionResponse submitCode(SubmissionRequest request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setCode(request.getCode());
        submission.setLanguage(request.getLanguage());
        submission.setStatus(Submission.Status.PENDING);

        submission = submissionRepository.save(submission);

        // Run code against test cases
        List<TestCase> testCases = problem.getTestCases();
        int passed = 0;
        int total = testCases.size();

        submission.setStatus(Submission.Status.RUNNING);
        submissionRepository.save(submission);

        for (TestCase testCase : testCases) {
            CodeRunnerService.ExecutionResult result = codeRunnerService.executeCode(
                    request.getCode(),
                    request.getLanguage(),
                    testCase.getInput());

            // If there was a runtime/compilation error, fail immediately
            if (result.getStatus() == Submission.Status.RUNTIME_ERROR
                    || result.getStatus() == Submission.Status.COMPILATION_ERROR) {
                submission.setStatus(result.getStatus());
                submission.setErrorMessage(result.getErrorMessage());
                submission.setExecutionTime(result.getExecutionTime());
                submission.setMemoryUsed(result.getMemoryUsed());
                break;
            }

            // Compare actual output with expected output
            String actualOutput = normalizeOutput(result.getOutput());
            String expectedOutput = normalizeOutput(testCase.getExpectedOutput());

            if (!actualOutput.equals(expectedOutput)) {
                submission.setStatus(Submission.Status.WRONG_ANSWER);
                submission.setErrorMessage(
                        "Wrong Answer on test case " + (passed + 1) +
                                "\nExpected: " + expectedOutput +
                                "\nGot: " + actualOutput);
                submission.setExecutionTime(result.getExecutionTime());
                submission.setMemoryUsed(result.getMemoryUsed());
                break;
            }

            passed++;
            submission.setExecutionTime(result.getExecutionTime());
            submission.setMemoryUsed(result.getMemoryUsed());
        }

        submission.setTestCasesPassed(passed);
        submission.setTotalTestCases(total);

        if (passed == total && submission.getStatus() == Submission.Status.RUNNING) {
            submission.setStatus(Submission.Status.ACCEPTED);

            // Update problem stats
            problem.setTotalSubmissions(problem.getTotalSubmissions() + 1);
            problem.setAcceptedSubmissions(problem.getAcceptedSubmissions() + 1);

            // Update user stats if first time solving
            List<Submission> previousAccepted = submissionRepository.findByUserIdAndProblemId(
                    user.getId(), problem.getId())
                    .stream().filter(s -> s.getStatus() == Submission.Status.ACCEPTED)
                    .toList();

            if (previousAccepted.isEmpty()) { // Only this submission (it's the first one)
                user.setProblemsSolved(user.getProblemsSolved() + 1);

                // Calculate rating based on difficulty AND execution time
                int ratingDetails = getRatingIncrease(problem.getDifficulty(), submission.getExecutionTime());
                user.setRating(user.getRating() + ratingDetails);
                userRepository.save(user);
                System.out.println("Rating Updated: +" + ratingDetails + " for user " + user.getUsername());
            }

            // CHECK FOR ROOM COMPLETION
            // Find if this user is in an active room for this problem
            // Use findActiveRoomsByUserId to ensure we only check currently joined rooms
            System.out.println("Checking for active room for user: " + user.getId());
            roomParticipantRepository.findActiveRoomsByUserId(user.getId()).stream()
                    .map(participant -> participant.getRoom())
                    .filter(room -> room.getStatus() == com.codearena.entity.Room.RoomStatus.ACTIVE)
                    .filter(room -> String.valueOf(room.getProblemId()).equals(String.valueOf(problem.getId())))
                    .findFirst()
                    .ifPresent(room -> {
                        System.out.println("Completing room: " + room.getId());
                        roomService.completeRoom(room.getId(), user.getId());
                    });
        } else if (submission.getStatus() == Submission.Status.RUNNING) {
            submission.setStatus(Submission.Status.WRONG_ANSWER);
            problem.setTotalSubmissions(problem.getTotalSubmissions() + 1);
        }

        problemRepository.save(problem);
        submission = submissionRepository.save(submission);

        return toResponse(submission);
    }

    public List<SubmissionResponse> getUserSubmissions(String userId) {
        return submissionRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SubmissionResponse getSubmission(Long id) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        return toResponse(submission);
    }

    private int getRatingIncrease(Problem.Difficulty difficulty, int executionTime) {
        int basePoints = switch (difficulty) {
            case CAKEWALK -> 10;
            case EASY -> 20;
            case MEDIUM -> 40;
            case HARD -> 70;
        };

        int maxBonus = switch (difficulty) {
            case CAKEWALK -> 5;
            case EASY -> 10;
            case MEDIUM -> 20;
            case HARD -> 30;
        };

        double multiplier = 0.0;
        if (executionTime < 20)
            multiplier = 1.0; // Ultra fast
        else if (executionTime < 50)
            multiplier = 0.75; // Fast
        else if (executionTime < 100)
            multiplier = 0.5; // Good

        return basePoints + (int) (maxBonus * multiplier);
    }

    /**
     * Normalize output for comparison: trim, normalize line endings, trim each
     * line.
     */
    private String normalizeOutput(String output) {
        if (output == null)
            return "";
        return output
                .trim()
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .lines()
                .map(String::trim)
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");
    }

    private SubmissionResponse toResponse(Submission submission) {
        return new SubmissionResponse(
                submission.getId(),
                submission.getUser().getId(),
                submission.getUser().getUsername(),
                submission.getProblem().getId(),
                submission.getProblem().getTitle(),
                submission.getLanguage(),
                submission.getStatus(),
                submission.getErrorMessage(),
                submission.getExecutionTime(),
                submission.getMemoryUsed(),
                submission.getTestCasesPassed(),
                submission.getTotalTestCases(),
                submission.getSubmittedAt());
    }
}
