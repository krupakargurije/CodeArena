package com.codearena.service;

import com.codearena.entity.Submission;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class CodeRunnerService {

    private final Random random = new Random();

    /**
     * Mock code execution service
     * In production, this would run code in a sandboxed Docker container
     */
    public ExecutionResult executeCode(String code, String language, String input) {
        // Simulate execution delay
        try {
            Thread.sleep(random.nextInt(1000) + 500); // 500-1500ms
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Mock execution results
        ExecutionResult result = new ExecutionResult();

        // 70% chance of success
        if (random.nextDouble() < 0.7) {
            result.setStatus(Submission.Status.ACCEPTED);
            result.setOutput("Correct output");
        } else {
            // Random failure types
            double failType = random.nextDouble();
            if (failType < 0.5) {
                result.setStatus(Submission.Status.WRONG_ANSWER);
                result.setOutput("Wrong output");
            } else if (failType < 0.7) {
                result.setStatus(Submission.Status.RUNTIME_ERROR);
                result.setErrorMessage("NullPointerException at line 10");
            } else if (failType < 0.85) {
                result.setStatus(Submission.Status.TIME_LIMIT_EXCEEDED);
                result.setErrorMessage("Time limit exceeded");
            } else {
                result.setStatus(Submission.Status.COMPILATION_ERROR);
                result.setErrorMessage("Syntax error at line 5");
            }
        }

        result.setExecutionTime(random.nextInt(1000) + 100); // 100-1100ms
        result.setMemoryUsed(random.nextInt(50000) + 10000); // 10-60 MB in KB

        return result;
    }

    public static class ExecutionResult {
        private Submission.Status status;
        private String output;
        private String errorMessage;
        private Integer executionTime;
        private Integer memoryUsed;

        // Getters and setters
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
