package com.codearena.monitoring.service;

import com.codearena.monitoring.dto.ApiPerformanceDTO;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * In-memory rolling metric aggregator for API traffic, error rates, response latencies,
 * and endpoint-level performance monitoring.
 *
 * <p>Designed with strictly bounded cardinality: UUIDs and dynamic numeric path variables
 * are normalized to generic templates (e.g. /api/problems/{id}) to prevent memory leaks.</p>
 */
@Service
public class ApiMetricsService {

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong status2xx = new AtomicLong(0);
    private final AtomicLong status4xx = new AtomicLong(0);
    private final AtomicLong status5xx = new AtomicLong(0);

    /** Reservoir sampling for percentile calculations (bounded to 5,000 recent samples). */
    private static final int MAX_LATENCY_SAMPLES = 5000;
    private final ConcurrentLinkedDeque<Double> recentLatencies = new ConcurrentLinkedDeque<>();

    /** Sliding window for request rate (timestamp in millis of recent requests, up to 10,000). */
    private final ConcurrentLinkedDeque<Long> recentRequestTimestamps = new ConcurrentLinkedDeque<>();
    private static final int MAX_RATE_WINDOW_MS = 60_000; // 1 minute

    /** Normalized endpoint metrics map (bounded to 100 endpoints). */
    private final ConcurrentHashMap<String, EndpointMetrics> endpointMetricsMap = new ConcurrentHashMap<>();
    private static final int MAX_ENDPOINTS = 100;

    // Normalization patterns
    private static final Pattern UUID_PATTERN = Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    private static final Pattern NUMERIC_ID_PATTERN = Pattern.compile("/\\d+");

    public void recordRequest(String method, String rawUri, int statusCode, double durationMs) {
        totalRequests.incrementAndGet();

        if (statusCode >= 200 && statusCode < 400) {
            status2xx.incrementAndGet();
        } else if (statusCode >= 400 && statusCode < 500) {
            status4xx.incrementAndGet();
        } else if (statusCode >= 500) {
            status5xx.incrementAndGet();
        }

        // Record latency sample
        recentLatencies.addLast(durationMs);
        while (recentLatencies.size() > MAX_LATENCY_SAMPLES) {
            recentLatencies.pollFirst();
        }

        // Record timestamp for rate calculation
        long now = System.currentTimeMillis();
        recentRequestTimestamps.addLast(now);
        while (!recentRequestTimestamps.isEmpty() && now - recentRequestTimestamps.peekFirst() > MAX_RATE_WINDOW_MS) {
            recentRequestTimestamps.pollFirst();
        }

        // Record endpoint statistics with normalized path
        String normalizedUri = normalizeUri(rawUri);
        String endpointKey = (method != null ? method.toUpperCase() : "GET") + " " + normalizedUri;

        if (endpointMetricsMap.size() < MAX_ENDPOINTS || endpointMetricsMap.containsKey(endpointKey)) {
            endpointMetricsMap.computeIfAbsent(endpointKey, k -> new EndpointMetrics(method, normalizedUri))
                    .record(durationMs, statusCode);
        }
    }

    public ApiPerformanceDTO getPerformanceMetrics() {
        long total = totalRequests.get();
        long c2xx = status2xx.get();
        long c4xx = status4xx.get();
        long c5xx = status5xx.get();

        double errorRate4xx = total > 0 ? (double) c4xx / total * 100.0 : 0.0;
        double errorRate5xx = total > 0 ? (double) c5xx / total * 100.0 : 0.0;

        Map<String, Long> statusDist = new LinkedHashMap<>();
        statusDist.put("2xx", c2xx);
        statusDist.put("4xx", c4xx);
        statusDist.put("5xx", c5xx);

        // Calculate request rate (requests in last minute / 60)
        long now = System.currentTimeMillis();
        while (!recentRequestTimestamps.isEmpty() && now - recentRequestTimestamps.peekFirst() > MAX_RATE_WINDOW_MS) {
            recentRequestTimestamps.pollFirst();
        }
        double rps = (double) recentRequestTimestamps.size() / 60.0;
        double rpm = (double) recentRequestTimestamps.size();

        // Calculate percentiles and max latency from the same population
        List<Double> sortedLatencies = new ArrayList<>(recentLatencies);
        Collections.sort(sortedLatencies);

        double p50 = computePercentile(sortedLatencies, 50.0);
        double p95 = computePercentile(sortedLatencies, 95.0);
        double p99 = computePercentile(sortedLatencies, 99.0);
        double avg = sortedLatencies.isEmpty() ? 0.0 : sortedLatencies.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double max = sortedLatencies.isEmpty() ? 0.0 : sortedLatencies.get(sortedLatencies.size() - 1);

        // Slow endpoints
        List<ApiPerformanceDTO.SlowEndpointDTO> slowEndpoints = endpointMetricsMap.values().stream()
                .map(EndpointMetrics::toDTO)
                .sorted(Comparator.comparingDouble(ApiPerformanceDTO.SlowEndpointDTO::getAvgLatencyMs).reversed())
                .limit(15)
                .collect(Collectors.toList());

        // JVM Metrics in Bytes & Megabytes
        Runtime runtime = Runtime.getRuntime();
        long totalBytes = runtime.totalMemory();
        long freeBytes = runtime.freeMemory();
        long maxBytes = runtime.maxMemory();
        long usedBytes = totalBytes - freeBytes;

        long totalMemMb = totalBytes / (1024 * 1024);
        long freeMemMb = freeBytes / (1024 * 1024);
        long maxMemMb = maxBytes / (1024 * 1024);
        long usedMemMb = usedBytes / (1024 * 1024);
        double memUsagePercent = maxBytes > 0 ? (double) usedBytes / maxBytes * 100.0 : 0.0;

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        int activeThreads = ManagementFactory.getThreadMXBean().getThreadCount();

        return ApiPerformanceDTO.builder()
                .totalRequests(total)
                .status2xx(c2xx)
                .status4xx(c4xx)
                .status5xx(c5xx)
                .statusCodeDistribution(statusDist)
                .errorRate4xx(Math.round(errorRate4xx * 100.0) / 100.0)
                .errorRate5xx(Math.round(errorRate5xx * 100.0) / 100.0)
                .errorRate5xxPercent(Math.round(errorRate5xx * 100.0) / 100.0)
                .requestsPerSecond(Math.round(rps * 100.0) / 100.0)
                .requestsPerMinute(Math.round(rpm * 10.0) / 10.0)
                .p50LatencyMs(Math.round(p50 * 10.0) / 10.0)
                .p95LatencyMs(Math.round(p95 * 10.0) / 10.0)
                .p99LatencyMs(Math.round(p99 * 10.0) / 10.0)
                .maxLatencyMs(Math.round(max * 10.0) / 10.0)
                .avgLatencyMs(Math.round(avg * 10.0) / 10.0)
                .slowEndpoints(slowEndpoints)
                .jvmHeapUsedBytes(usedBytes)
                .jvmHeapMaxBytes(maxBytes)
                .jvmHeapCommittedBytes(totalBytes)
                .jvmHeapFreeBytes(freeBytes)
                .jvmMemoryUsedMb(usedMemMb)
                .jvmMemoryMaxMb(maxMemMb)
                .jvmMemoryFreeMb(freeMemMb)
                .jvmMemoryUsagePercent(Math.round(memUsagePercent * 10.0) / 10.0)
                .activeThreads(activeThreads)
                .jvmThreadsActive(activeThreads)
                .uptimeSeconds(uptimeSeconds)
                .build();
    }

    public double getP95Latency() {
        List<Double> sortedLatencies = new ArrayList<>(recentLatencies);
        Collections.sort(sortedLatencies);
        return computePercentile(sortedLatencies, 95.0);
    }

    public double getErrorRate5xx() {
        long total = totalRequests.get();
        long c5xx = status5xx.get();
        return total > 0 ? (double) c5xx / total * 100.0 : 0.0;
    }

    public double getRequestRatePerSecond() {
        long now = System.currentTimeMillis();
        while (!recentRequestTimestamps.isEmpty() && now - recentRequestTimestamps.peekFirst() > MAX_RATE_WINDOW_MS) {
            recentRequestTimestamps.pollFirst();
        }
        return (double) recentRequestTimestamps.size() / 60.0;
    }

    private double computePercentile(List<Double> sortedList, double percentile) {
        if (sortedList.isEmpty()) return 0.0;
        int index = (int) Math.ceil((percentile / 100.0) * sortedList.size()) - 1;
        index = Math.max(0, Math.min(index, sortedList.size() - 1));
        return sortedList.get(index);
    }

    private String normalizeUri(String uri) {
        if (uri == null || uri.isEmpty()) return "/";
        // Remove query parameters first
        int queryIdx = uri.indexOf('?');
        String cleanUri = (queryIdx != -1) ? uri.substring(0, queryIdx) : uri;
        
        String normalized = UUID_PATTERN.matcher(cleanUri).replaceAll("{id}");
        normalized = NUMERIC_ID_PATTERN.matcher(normalized).replaceAll("/{id}");
        return normalized;
    }

    private static class EndpointMetrics {
        private final String method;
        private final String uriPattern;
        private final AtomicLong count = new AtomicLong(0);
        private final AtomicLong errorCount5xx = new AtomicLong(0);
        private final AtomicLong totalDurationMicros = new AtomicLong(0);
        private final AtomicLong maxDurationMicros = new AtomicLong(0);
        private final ConcurrentLinkedDeque<Double> samples = new ConcurrentLinkedDeque<>();

        public EndpointMetrics(String method, String uriPattern) {
            this.method = method;
            this.uriPattern = uriPattern;
        }

        public void record(double durationMs, int statusCode) {
            count.incrementAndGet();
            if (statusCode >= 500) {
                errorCount5xx.incrementAndGet();
            }
            long micros = (long) (durationMs * 1000);
            totalDurationMicros.addAndGet(micros);
            maxDurationMicros.accumulateAndGet(micros, Math::max);

            samples.addLast(durationMs);
            while (samples.size() > 100) {
                samples.pollFirst();
            }
        }

        public ApiPerformanceDTO.SlowEndpointDTO toDTO() {
            long c = count.get();
            double avgMs = c > 0 ? (totalDurationMicros.get() / 1000.0) / c : 0.0;
            double maxMs = maxDurationMicros.get() / 1000.0;

            List<Double> s = new ArrayList<>(samples);
            Collections.sort(s);
            double p95 = s.isEmpty() ? avgMs : s.get(Math.min((int) (s.size() * 0.95), s.size() - 1));

            return ApiPerformanceDTO.SlowEndpointDTO.builder()
                    .method(method != null ? method.toUpperCase() : "GET")
                    .path(uriPattern)
                    .uriPattern(uriPattern)
                    .requestCount(c)
                    .avgLatencyMs(Math.round(avgMs * 10.0) / 10.0)
                    .avgDurationMs(Math.round(avgMs * 10.0) / 10.0)
                    .maxLatencyMs(Math.round(maxMs * 10.0) / 10.0)
                    .maxDurationMs(Math.round(maxMs * 10.0) / 10.0)
                    .p95DurationMs(Math.round(p95 * 10.0) / 10.0)
                    .errorCount5xx(errorCount5xx.get())
                    .build();
        }
    }
}
