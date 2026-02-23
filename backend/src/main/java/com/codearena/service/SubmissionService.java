package com.codearena.service;

import com.codearena.dto.SubmissionRequest;
import com.codearena.dto.SubmissionResponse;
import com.codearena.entity.Problem;
import com.codearena.entity.Submission;
import com.codearena.entity.User;
import com.codearena.repository.ProblemRepository;
import com.codearena.repository.SubmissionRepository;
import com.codearena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    @Value("${judge0.api.url:https://ce.judge0.com}")
    private String judge0Url;

    // ─── In-Memory Test Case Cache ───
    private static final ConcurrentHashMap<Long, TestCaseBundle> testCaseCache = new ConcurrentHashMap<>();

    public static void invalidateCache(Long problemId) {
        testCaseCache.remove(problemId);
        System.out.println("[Cache] Invalidated test case cache for problem " + problemId);
    }

    private static class TestCaseBundle {
        final Map<String, String> inputs;
        final Map<String, String> expectedOutputs;

        TestCaseBundle(Map<String, String> inputs, Map<String, String> expectedOutputs) {
            this.inputs = inputs;
            this.expectedOutputs = expectedOutputs;
        }
    }

    @Transactional
    public SubmissionResponse submitCode(SubmissionRequest request, String username) {
        // Note: 'username' here is actually the Supabase user UUID (JWT subject)
        User user = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        // Just queue it — return immediately
        Submission submission = new Submission();
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setCode(request.getCode());
        submission.setLanguage(request.getLanguage());
        submission.setStatus(Submission.Status.PENDING);
        submission.setTestCasesPassed(0);
        submission.setTotalTestCases(0);

        Submission saved = submissionRepository.save(submission);
        System.out.println("[Queue] Submission " + saved.getId() + " queued as PENDING");

        return mapToResponse(saved);
    }

    /**
     * Called by the background worker to actually execute the submission.
     */
    @Transactional
    public void processSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        submission.setStatus(Submission.Status.RUNNING);
        submissionRepository.save(submission);

        Problem problem = submission.getProblem();
        User user = submission.getUser();

        try {
            if (problem.getTestCasesUrl() != null && !problem.getTestCasesUrl().isEmpty()) {
                evaluateUsingZip(submission, problem.getTestCasesUrl());
            } else {
                evaluateSingleTest(submission, problem.getSampleInput(), problem.getSampleOutput());
            }
        } catch (Exception e) {
            submission.setStatus(Submission.Status.RUNTIME_ERROR);
            submission.setErrorMessage("Failed to execute: " + e.getMessage());
            submission.setTestCasesPassed(0);
            submission.setTotalTestCases(1);
            submission.setExecutionTime(0);
        }

        submissionRepository.save(submission);

        // Update statistics
        if (submission.getStatus() == Submission.Status.ACCEPTED) {
            if (!hasUserSolvedProblem(user, problem)) {
                user.setProblemsSolved(user.getProblemsSolved() + 1);
                user.setRating(user.getRating() + 10);
                userRepository.save(user);
            }
            problem.setAcceptedSubmissions(problem.getAcceptedSubmissions() + 1);
        }
        problem.setTotalSubmissions(problem.getTotalSubmissions() + 1);
        if (problem.getTotalSubmissions() > 0) {
            problem.setAcceptanceRate((double) problem.getAcceptedSubmissions() / problem.getTotalSubmissions() * 100);
        }
        problemRepository.save(problem);

        System.out.println("[Worker] Submission " + submissionId + " processed → " + submission.getStatus());
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getUserSubmissions(String userId) {
        return submissionRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(Long id) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        return mapToResponse(submission);
    }

    // ─── ZIP Evaluation ───

    private void evaluateUsingZip(Submission submission, String zipUrl) throws Exception {
        Long problemId = submission.getProblem().getId();

        // Check cache first
        TestCaseBundle bundle = testCaseCache.get(problemId);
        if (bundle == null) {
            System.out.println("[Cache] MISS for problem " + problemId + " — downloading ZIP");
            bundle = downloadAndExtractZip(zipUrl);
            testCaseCache.put(problemId, bundle);
        } else {
            System.out.println("[Cache] HIT for problem " + problemId + " — using cached test cases");
        }

        Map<String, String> inputs = bundle.inputs;
        Map<String, String> expectedOutputs = bundle.expectedOutputs;

        int totalCases = inputs.size();
        String code = submission.getCode();
        String language = submission.getLanguage();

        // Run ALL test cases in parallel
        List<String> keys = new ArrayList<>(inputs.keySet());
        List<CompletableFuture<JudgeResult>> futures = keys.stream()
                .map(key -> CompletableFuture.supplyAsync(() -> runAgainstJudge0(code, language, inputs.get(key))))
                .collect(Collectors.toList());

        // Wait for all to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // Evaluate results in order
        int passedCases = 0;
        double maxTime = 0;
        Submission.Status finalStatus = Submission.Status.ACCEPTED;
        String failedInput = null;
        String failedExpected = null;
        String failedActual = null;
        String errorMsg = null;

        for (int i = 0; i < keys.size(); i++) {
            String key = keys.get(i);
            JudgeResult result = futures.get(i).get();
            String expected = expectedOutputs.get(key);

            if (result.time > maxTime)
                maxTime = result.time;

            if (result.statusEnum == Submission.Status.COMPILATION_ERROR
                    || result.statusEnum == Submission.Status.RUNTIME_ERROR) {
                finalStatus = result.statusEnum;
                errorMsg = result.stderr;
                break;
            }

            if (matches(result.stdout, expected)) {
                passedCases++;
            } else {
                finalStatus = Submission.Status.WRONG_ANSWER;
                failedInput = inputs.get(key);
                failedExpected = expected;
                failedActual = result.stdout;
                break;
            }
        }

        submission.setStatus(finalStatus);
        submission.setExecutionTime((int) maxTime);
        submission.setTestCasesPassed(passedCases);
        submission.setTotalTestCases(totalCases);
        if (failedInput != null)
            submission.setFailedTestCaseInput(failedInput);
        if (failedExpected != null)
            submission.setExpectedOutput(failedExpected);
        if (failedActual != null)
            submission.setActualOutput(failedActual);
        if (errorMsg != null)
            submission.setErrorMessage(errorMsg);
    }

    // ─── Single Test Fallback ───

    private void evaluateSingleTest(Submission submission, String input, String expected) {
        JudgeResult result = runAgainstJudge0(submission.getCode(), submission.getLanguage(), input);
        submission.setExecutionTime((int) result.time);
        if (result.statusEnum == Submission.Status.COMPILATION_ERROR
                || result.statusEnum == Submission.Status.RUNTIME_ERROR) {
            submission.setStatus(result.statusEnum);
            submission.setTestCasesPassed(0);
            submission.setErrorMessage(result.stderr);
        } else if (matches(result.stdout, expected)) {
            submission.setStatus(Submission.Status.ACCEPTED);
            submission.setTestCasesPassed(1);
        } else {
            submission.setStatus(Submission.Status.WRONG_ANSWER);
            submission.setTestCasesPassed(0);
            submission.setFailedTestCaseInput(input);
            submission.setExpectedOutput(expected);
            submission.setActualOutput(result.stdout);
        }
        submission.setTotalTestCases(1);
    }

    // ─── Judge0 Interaction ───

    @SuppressWarnings("unchecked")
    private JudgeResult runAgainstJudge0(String code, String language, String input) {
        int languageId = mapLanguage(language);
        String submitUrl = judge0Url + "/submissions?base64_encoded=false&wait=true";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("source_code", code);
        body.put("language_id", languageId);
        body.put("stdin", input);

        RestTemplate rt = new RestTemplate();
        ResponseEntity<Map<String, Object>> response = rt.exchange(
                submitUrl, HttpMethod.POST, new HttpEntity<>(body, headers),
                (Class<Map<String, Object>>) (Class<?>) Map.class);
        Map<String, Object> respBody = response.getBody();

        JudgeResult result = new JudgeResult();
        if (respBody != null) {
            Map<String, Object> statusObj = (Map<String, Object>) respBody.get("status");
            int statusCode = (int) statusObj.get("id");

            if (statusCode == 3)
                result.statusEnum = Submission.Status.ACCEPTED;
            else if (statusCode == 6)
                result.statusEnum = Submission.Status.COMPILATION_ERROR;
            else
                result.statusEnum = Submission.Status.RUNTIME_ERROR;

            result.stdout = (String) respBody.get("stdout");
            result.stderr = (String) respBody.get("stderr");
            Object timeObj = respBody.get("time");
            result.time = timeObj != null ? Double.parseDouble(timeObj.toString()) * 1000 : 0.0;
        }
        return result;
    }

    // ─── Helpers ───

    private boolean matches(String actual, String expected) {
        if (expected == null)
            expected = "";
        if (actual == null)
            actual = "";
        return actual.trim().equals(expected.trim());
    }

    private TestCaseBundle downloadAndExtractZip(String zipUrl) throws Exception {
        RestTemplate rt = new RestTemplate();
        byte[] zipBytes = rt.getForObject(zipUrl, byte[].class);
        if (zipBytes == null)
            throw new RuntimeException("Failed to download zip from " + zipUrl);

        Map<String, String> inputs = new TreeMap<>();
        Map<String, String> expectedOutputs = new TreeMap<>();

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory())
                    continue;
                String name = entry.getName();
                if (name.contains("/"))
                    name = name.substring(name.lastIndexOf('/') + 1);

                String content = readZipEntry(zis);
                // Strip sample_ prefix (used to mark sample test cases in admin UI)
                if (name.startsWith("sample_"))
                    name = name.substring(7);
                if (name.endsWith(".in")) {
                    inputs.put(name.substring(0, name.length() - 3), content);
                } else if (name.endsWith(".out")) {
                    expectedOutputs.put(name.substring(0, name.length() - 4), content);
                }
                zis.closeEntry();
            }
        }
        return new TestCaseBundle(inputs, expectedOutputs);
    }

    private String readZipEntry(ZipInputStream zis) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[1024];
        int count;
        while ((count = zis.read(data, 0, 1024)) != -1) {
            buffer.write(data, 0, count);
        }
        return buffer.toString("UTF-8");
    }

    private int mapLanguage(String lang) {
        switch (lang.toLowerCase()) {
            case "python":
                return 71;
            case "javascript":
                return 63;
            case "java":
                return 62;
            case "cpp":
                return 54;
            default:
                return 71;
        }
    }

    private boolean hasUserSolvedProblem(User user, Problem problem) {
        return submissionRepository.findByUserId(user.getId()).stream()
                .anyMatch(s -> s.getProblem().getId().equals(problem.getId())
                        && s.getStatus() == Submission.Status.ACCEPTED);
    }

    private SubmissionResponse mapToResponse(Submission s) {
        return new SubmissionResponse(
                s.getId(),
                s.getUser().getId(),
                s.getUser().getUsername(),
                s.getProblem().getId(),
                s.getProblem().getTitle(),
                s.getLanguage(),
                s.getStatus(),
                s.getErrorMessage(),
                s.getExecutionTime(),
                s.getMemoryUsed(),
                s.getTestCasesPassed(),
                s.getTotalTestCases(),
                s.getFailedTestCaseInput(),
                s.getExpectedOutput(),
                s.getActualOutput(),
                s.getSubmittedAt());
    }

    private static class JudgeResult {
        Submission.Status statusEnum = Submission.Status.RUNTIME_ERROR;
        String stdout = "";
        String stderr = "";
        double time = 0.0;
    }
}
