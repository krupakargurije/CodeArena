package com.codearena.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiPerformanceDTO {
    private long totalRequests;
    private long status2xx;
    private long status4xx;
    private long status5xx;
    private Map<String, Long> statusCodeDistribution;

    private double errorRate4xx;
    private double errorRate5xx;
    private double errorRate5xxPercent;

    private double requestsPerSecond;
    private double requestsPerMinute;

    private double p50LatencyMs;
    private double p95LatencyMs;
    private double p99LatencyMs;
    private double maxLatencyMs;
    private double avgLatencyMs;

    private List<SlowEndpointDTO> slowEndpoints;

    // JVM Metrics in Bytes (for standard formatters)
    private long jvmHeapUsedBytes;
    private long jvmHeapMaxBytes;
    private long jvmHeapCommittedBytes;
    private long jvmHeapFreeBytes;

    // JVM Metrics in Megabytes (for backward compatibility)
    private long jvmMemoryUsedMb;
    private long jvmMemoryMaxMb;
    private long jvmMemoryFreeMb;
    private double jvmMemoryUsagePercent;

    private int activeThreads;
    private int jvmThreadsActive;
    private long uptimeSeconds;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlowEndpointDTO {
        private String method;
        private String path;
        private String uriPattern;
        private long requestCount;
        private double avgLatencyMs;
        private double avgDurationMs;
        private double maxLatencyMs;
        private double maxDurationMs;
        private double p95DurationMs;
        private long errorCount5xx;
    }
}
