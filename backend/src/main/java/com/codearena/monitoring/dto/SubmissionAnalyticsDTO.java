package com.codearena.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionAnalyticsDTO {
    private String timeRange; // 1h, 24h, 7d, 30d, all
    private Instant startTime;
    private Instant endTime;
    private long totalSubmissions;
    private long acceptedSubmissions;
    private long wrongAnswerSubmissions;
    private long timeLimitExceeded;
    private long memoryLimitExceeded;
    private long compilationErrors;
    private long runtimeErrors;
    private long platformErrors;
    private double acceptanceRatePercent;
    private double platformFailureRatePercent;
    private double avgExecutionTimeMs;
    private Map<String, Long> languageBreakdown;
    private List<TimeSeriesPoint> timeSeries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesPoint {
        private String timestamp; // ISO or label
        private long total;
        private long accepted;
        private long failed;
        private double avgLatencyMs;
    }
}
