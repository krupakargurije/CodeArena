package com.codearena.service;

import com.codearena.entity.Submission;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CodeRunnerService {

    private final RestTemplate restTemplate;
    private static final String JUDGE0_API_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

    public CodeRunnerService() {
        this.restTemplate = new RestTemplate();
    }

    public ExecutionResult executeCode(String code, String language, String input) {
        try {
            // Map language to Judge0 format ID
            int languageId = mapLanguageToJudge0(language);

            // Prepare Request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("language_id", languageId);
            requestBody.put("source_code", code);

            if (input != null && !input.isEmpty()) {
                requestBody.put("stdin", input);
            }

            // Execute Request
            ResponseEntity<Map> response = restTemplate.postForEntity(JUDGE0_API_URL, requestBody, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody == null || !response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("API Execution Failed. Status: " + response.getStatusCode());
            }

            // Parse Response from Judge0
            Map<String, Object> statusObj = (Map<String, Object>) responseBody.get("status");
            Integer statusId = statusObj != null ? (Integer) statusObj.get("id") : null;

            String stdout = (String) responseBody.get("stdout");
            String stderr = (String) responseBody.get("stderr");
            String compileOutput = (String) responseBody.get("compile_output");
            String message = (String) responseBody.get("message");

            String timeStr = (String) responseBody.get("time");
            Integer memory = (Integer) responseBody.get("memory");

            ExecutionResult result = new ExecutionResult();
            result.setOutput(stdout != null ? stdout.trim() : "");

            // Judge0 returns time as a string like "0.021" seconds. We convert to
            // milliseconds.
            if (timeStr != null && !timeStr.isEmpty()) {
                try {
                    result.setExecutionTime((int) (Double.parseDouble(timeStr) * 1000));
                } catch (NumberFormatException e) {
                    result.setExecutionTime(0);
                }
            } else {
                result.setExecutionTime(0);
            }

            result.setMemoryUsed(memory != null ? memory : 0);

            if (statusId == null) {
                result.setStatus(Submission.Status.RUNTIME_ERROR);
                result.setErrorMessage("Unknown status from Judge0");
            } else if (statusId == 6) { // Compilation Error
                result.setStatus(Submission.Status.COMPILATION_ERROR);
                result.setErrorMessage(
                        compileOutput != null ? compileOutput : (message != null ? message : "Compilation Error"));
            } else if (statusId >= 7 && statusId <= 12) { // Runtime Errors
                result.setStatus(Submission.Status.RUNTIME_ERROR);
                result.setErrorMessage(stderr != null ? stderr : (message != null ? message : "Runtime Error"));
            } else if (statusId == 5) { // Time Limit Exceeded
                result.setStatus(Submission.Status.RUNTIME_ERROR);
                result.setErrorMessage("Time Limit Exceeded");
            } else { // Accepted (or Wrong Answer which will be decided by SubmissionService)
                // Code ran successfully — NOT yet validated against expected output.
                // SubmissionService will compare output and decide ACCEPTED vs WRONG_ANSWER.
                result.setStatus(Submission.Status.PENDING);
            }

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            ExecutionResult error = new ExecutionResult();
            error.setStatus(Submission.Status.RUNTIME_ERROR);
            error.setErrorMessage("Execution Error: " + e.getMessage());
            return error;
        }
    }

    private int mapLanguageToJudge0(String lang) {
        if (lang == null)
            return 71; // Default to Python
        lang = lang.toLowerCase();
        if (lang.contains("python"))
            return 71; // Python (3.8.1)
        if (lang.contains("java") && !lang.contains("script"))
            return 62; // Java (OpenJDK 13.0.1)
        if (lang.contains("c++") || lang.contains("cpp"))
            return 54; // C++ (GCC 9.2.0)
        if (lang.contains("script") || lang.contains("js"))
            return 63; // JavaScript (Node.js 12.14.0)
        return 71; // Default fallback
    }

    public static class ExecutionResult {
        private Submission.Status status;
        private String output;
        private String errorMessage;
        private Integer executionTime = 0;
        private Integer memoryUsed = 0;

        // Getters and Setters
        public Submission.Status getStatus() {
            return status;
        }

        public void setStatus(Submission.Status status) {
            this.status = status;
        }

        public String getOutput() {
            return output;
        }

        public void setOutput(String output) {
            this.output = output;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public Integer getExecutionTime() {
            return executionTime;
        }

        public void setExecutionTime(Integer executionTime) {
            this.executionTime = executionTime;
        }

        public Integer getMemoryUsed() {
            return memoryUsed;
        }

        public void setMemoryUsed(Integer memoryUsed) {
            this.memoryUsed = memoryUsed;
        }
    }
}
