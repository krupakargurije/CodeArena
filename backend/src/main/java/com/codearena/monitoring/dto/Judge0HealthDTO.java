package com.codearena.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Judge0HealthDTO {
    private String status;
    private String apiUrl;
    private Long latencyMs;
    private Instant lastChecked;
    private long totalExecutions;
    private long acceptedCount;
    private long wrongAnswerCount;
    private long compilationErrors;
    private long runtimeErrors;
    private long timeLimitExceeded;
    private long memoryLimitExceeded;
    private long platformErrors;
    private double successRatePercent;
    private String queueArchitecture;
    private long pendingSubmissions;
    private Map<String, Long> supportedLanguages;
}
