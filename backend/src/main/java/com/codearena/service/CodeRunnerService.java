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
    private static final String PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

    public CodeRunnerService() {
        this.restTemplate = new RestTemplate();
    }

    public ExecutionResult executeCode(String code, String language, String input) {
        try {
            // Map language to Piston format
            String pistonLang = mapLanguage(language);
            String version = "*"; // Use latest available

            // Prepare Request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("language", pistonLang);
            requestBody.put("version", version);

            List<Map<String, String>> files = new ArrayList<>();
            Map<String, String> file = new HashMap<>();
            file.put("content", code);
            files.add(file);
            requestBody.put("files", files);

            if (input != null && !input.isEmpty()) {
                requestBody.put("stdin", input);
            }

            // Execute Request
            ResponseEntity<Map> response = restTemplate.postForEntity(PISTON_API_URL, requestBody, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody == null || !response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("API Execution Failed");
            }

            // Parse Response
            Map<String, Object> run = (Map<String, Object>) responseBody.get("run");
            String stdout = (String) run.get("stdout");
            String stderr = (String) run.get("stderr");
            Integer exitCode = (Integer) run.get("code");

            ExecutionResult result = new ExecutionResult();
            result.setOutput(stdout != null ? stdout.trim() : "");
            // Piston doesn't always return time inside the 'run' object in a standardized
            // way across versions,
            // but usually it's there. We'll default to 0 if missing.
            result.setExecutionTime(0);
            result.setMemoryUsed(0);

            if (exitCode != 0) {
                // Runtime or Compilation Error
                result.setStatus(Submission.Status.RUNTIME_ERROR);
                result.setErrorMessage(stderr);
            } else {
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

    private String mapLanguage(String lang) {
        if (lang == null)
            return "python";
        lang = lang.toLowerCase();
        if (lang.contains("python"))
            return "python";
        if (lang.contains("java"))
            return "java";
        if (lang.contains("c++") || lang.contains("cpp"))
            return "c++";
        if (lang.contains("c") && !lang.contains("++"))
            return "c";
        if (lang.contains("script") || lang.contains("js"))
            return "javascript";
        return lang;
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
