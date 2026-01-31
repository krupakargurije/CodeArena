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

    @Transactional
    public SubmissionResponse submitCode(SubmissionRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

            if (result.getStatus() != Submission.Status.ACCEPTED) {
                submission.setStatus(result.getStatus());
                submission.setErrorMessage(result.getErrorMessage());
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
                    .map(List::of)
                    .orElse(List.of())
                    .stream().filter(s -> s.getStatus() == Submission.Status.ACCEPTED)
                    .toList();

            if (previousAccepted.size() == 1) { // Only this submission
                user.setProblemsSolved(user.getProblemsSolved() + 1);
                user.setRating(user.getRating() + getRatingIncrease(problem.getDifficulty()));
                userRepository.save(user);
            }
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

    private int getRatingIncrease(Problem.Difficulty difficulty) {
        return switch (difficulty) {
            case CAKEWALK -> 5;
            case EASY -> 10;
            case MEDIUM -> 25;
            case HARD -> 50;
        };
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
