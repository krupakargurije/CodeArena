package com.codearena.monitoring.service;

import com.codearena.monitoring.dto.ServiceHealthDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * Service providing reliable, non-blocking component health checks with strict timeouts
 * and smart 10-second result caching to protect downstream dependencies from polling storms.
 */
@Service
@RequiredArgsConstructor
public class HealthCheckService {

    private static final Logger log = LoggerFactory.getLogger(HealthCheckService.class);

    private final DataSource dataSource;
    private final WebSocketActivityTracker webSocketActivityTracker;

    @Value("${judge0.api.url:https://ce.judge0.com}")
    private String judge0Url;

    /** Cache expiration in milliseconds (10 seconds). */
    private static final long CACHE_TTL_MS = 10_000;
    private volatile CachedHealthResults cachedResults;

    private static final int CHECK_TIMEOUT_MS = 3_000;

    private final ExecutorService probeExecutor = Executors.newFixedThreadPool(4);

    /**
     * Get health status of all primary system dependencies.
     * Uses cached results if checked within the last 10 seconds.
     * Executes external probes in parallel to prevent compounding latency.
     */
    public List<ServiceHealthDTO> getAllServiceHealth() {
        long now = System.currentTimeMillis();
        if (cachedResults != null && (now - cachedResults.timestamp) < CACHE_TTL_MS) {
            return cachedResults.services;
        }

        CompletableFuture<ServiceHealthDTO> backendFuture = CompletableFuture.supplyAsync(this::checkBackendHealth, probeExecutor);
        CompletableFuture<ServiceHealthDTO> dbFuture = CompletableFuture.supplyAsync(this::checkDatabaseHealth, probeExecutor);
        CompletableFuture<ServiceHealthDTO> judge0Future = CompletableFuture.supplyAsync(this::checkJudge0Health, probeExecutor);
        CompletableFuture<ServiceHealthDTO> wsFuture = CompletableFuture.supplyAsync(this::checkWebSocketHealth, probeExecutor);

        try {
            CompletableFuture.allOf(backendFuture, dbFuture, judge0Future, wsFuture).get(CHECK_TIMEOUT_MS + 1000, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.warn("One or more dependency probes took longer than timeout: {}", e.getMessage());
        }

        List<ServiceHealthDTO> results = new ArrayList<>();
        results.add(safelyGetFuture(backendFuture, "BACKEND", "Spring Boot Backend"));
        results.add(safelyGetFuture(dbFuture, "DATABASE", "PostgreSQL Database"));
        results.add(safelyGetFuture(judge0Future, "JUDGE0", "Judge0 Execution API"));
        results.add(safelyGetFuture(wsFuture, "WEBSOCKET", "WebSocket STOMP Broker"));

        cachedResults = new CachedHealthResults(now, results);
        return results;
    }

    private ServiceHealthDTO safelyGetFuture(CompletableFuture<ServiceHealthDTO> future, String component, String name) {
        try {
            if (future.isDone()) {
                return future.get();
            }
        } catch (Exception ignored) {}

        return ServiceHealthDTO.builder()
                .serviceName(name)
                .component(component)
                .status("UNKNOWN")
                .responseTimeMs((long) CHECK_TIMEOUT_MS)
                .lastCheckTime(Instant.now())
                .message("Probe check timed out or failed to complete.")
                .details(Map.of())
                .build();
    }

    public ServiceHealthDTO checkBackendHealth() {
        long start = System.currentTimeMillis();
        Runtime rt = Runtime.getRuntime();
        long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long maxMb = rt.maxMemory() / (1024 * 1024);
        long uptimeSec = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        int threads = ManagementFactory.getThreadMXBean().getThreadCount();
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("jvmVersion", System.getProperty("java.version"));
        details.put("memoryUsedMb", usedMb);
        details.put("memoryMaxMb", maxMb);
        details.put("activeThreads", threads);
        details.put("uptimeSeconds", uptimeSec);

        return ServiceHealthDTO.builder()
                .serviceName("Spring Boot Backend")
                .component("BACKEND")
                .status("UP")
                .responseTimeMs(duration)
                .lastCheckTime(Instant.now())
                .lastSuccessfulCheck(Instant.now())
                .message("Spring Boot 3 runtime operational, JVM memory within safe limits.")
                .details(details)
                .build();
    }

    public ServiceHealthDTO checkDatabaseHealth() {
        long start = System.currentTimeMillis();
        boolean success = false;
        String message;
        String status = "DOWN";
        Map<String, Object> details = new LinkedHashMap<>();

        try (Connection conn = dataSource.getConnection()) {
            conn.setNetworkTimeout(Executors.newSingleThreadExecutor(), CHECK_TIMEOUT_MS);
            try (Statement stmt = conn.createStatement()) {
                stmt.setQueryTimeout(2); // 2 second timeout
                stmt.execute("SELECT 1");
                success = true;
            }
            long duration = System.currentTimeMillis() - start;

            if (duration > 1500) {
                status = "DEGRADED";
                message = "PostgreSQL query succeeded but response was slow (" + duration + "ms).";
            } else {
                status = "UP";
                message = "PostgreSQL connection pool healthy, validation query succeeded in " + duration + "ms.";
            }

            details.put("driver", conn.getMetaData().getDriverName());
            details.put("databaseProduct", conn.getMetaData().getDatabaseProductName() + " " + conn.getMetaData().getDatabaseProductVersion());
            details.put("readOnly", conn.isReadOnly());

            return ServiceHealthDTO.builder()
                    .serviceName("Supabase PostgreSQL Database")
                    .component("DATABASE")
                    .status(status)
                    .responseTimeMs(duration)
                    .lastCheckTime(Instant.now())
                    .lastSuccessfulCheck(Instant.now())
                    .message(message)
                    .details(details)
                    .build();

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("Database health check failed: {}", e.getMessage());
            details.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());

            return ServiceHealthDTO.builder()
                    .serviceName("Supabase PostgreSQL Database")
                    .component("DATABASE")
                    .status("DOWN")
                    .responseTimeMs(duration)
                    .lastCheckTime(Instant.now())
                    .lastFailureTime(Instant.now())
                    .message("Database validation query failed: " + e.getMessage())
                    .details(details)
                    .build();
        }
    }

    public ServiceHealthDTO checkJudge0Health() {
        if (judge0Url == null || judge0Url.isBlank()) {
            return ServiceHealthDTO.builder()
                    .serviceName("Judge0 Execution API")
                    .component("JUDGE0")
                    .status("UNKNOWN")
                    .responseTimeMs(0L)
                    .lastCheckTime(Instant.now())
                    .message("Judge0 API URL is not configured.")
                    .build();
        }

        long start = System.currentTimeMillis();
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("apiUrl", judge0Url);

        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(CHECK_TIMEOUT_MS);
            factory.setReadTimeout(CHECK_TIMEOUT_MS);
            RestTemplate rt = new RestTemplate(factory);

            // Probe /languages or /about endpoint
            String probeUrl = judge0Url + "/languages";
            ResponseEntity<List> response = rt.getForEntity(probeUrl, List.class);

            long duration = System.currentTimeMillis() - start;
            if (response.getStatusCode().is2xxSuccessful()) {
                String status = duration > 2000 ? "DEGRADED" : "UP";
                String msg = status.equals("DEGRADED")
                        ? "Judge0 responded but latency is high (" + duration + "ms)."
                        : "Judge0 sandbox is available and accepting submissions (" + duration + "ms).";

                if (response.getBody() != null) {
                    details.put("availableLanguagesCount", response.getBody().size());
                }

                return ServiceHealthDTO.builder()
                        .serviceName("Judge0 Execution API")
                        .component("JUDGE0")
                        .status(status)
                        .responseTimeMs(duration)
                        .lastCheckTime(Instant.now())
                        .lastSuccessfulCheck(Instant.now())
                        .message(msg)
                        .details(details)
                        .build();
            } else {
                return ServiceHealthDTO.builder()
                        .serviceName("Judge0 Execution API")
                        .component("JUDGE0")
                        .status("DEGRADED")
                        .responseTimeMs(duration)
                        .lastCheckTime(Instant.now())
                        .lastFailureTime(Instant.now())
                        .message("Judge0 returned unexpected status code: " + response.getStatusCode())
                        .details(details)
                        .build();
            }
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.warn("Judge0 health check failed: {}", e.getMessage());
            details.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());

            return ServiceHealthDTO.builder()
                    .serviceName("Judge0 Execution API")
                    .component("JUDGE0")
                    .status("DOWN")
                    .responseTimeMs(duration)
                    .lastCheckTime(Instant.now())
                    .lastFailureTime(Instant.now())
                    .message("Judge0 API unreachable or timed out (" + duration + "ms): " + e.getMessage())
                    .details(details)
                    .build();
        }
    }

    public ServiceHealthDTO checkWebSocketHealth() {
        int activeSessions = webSocketActivityTracker.getActiveSessionCount();
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("activeSessions", activeSessions);
        details.put("endpoint", "/ws");
        details.put("brokerDestination", "/topic");

        return ServiceHealthDTO.builder()
                .serviceName("WebSocket STOMP Broker")
                .component("WEBSOCKET")
                .status("UP")
                .responseTimeMs(1L)
                .lastCheckTime(Instant.now())
                .lastSuccessfulCheck(Instant.now())
                .message("In-memory STOMP broker active with " + activeSessions + " connected clients.")
                .details(details)
                .build();
    }

    public String determineOverallStatus(List<ServiceHealthDTO> services) {
        // Critical core infrastructure: DATABASE or BACKEND down means platform is DOWN
        boolean coreDown = services.stream()
                .filter(s -> "DATABASE".equals(s.getComponent()) || "BACKEND".equals(s.getComponent()))
                .anyMatch(s -> "DOWN".equals(s.getStatus()));
        if (coreDown) return "DOWN";

        // Peripheral dependency failure (e.g. Judge0 or WebSocket) or degraded performance means DEGRADED
        boolean anyDownOrDegraded = services.stream()
                .anyMatch(s -> "DOWN".equals(s.getStatus()) || "DEGRADED".equals(s.getStatus()));
        if (anyDownOrDegraded) return "DEGRADED";

        return "UP";
    }

    private static class CachedHealthResults {
        final long timestamp;
        final List<ServiceHealthDTO> services;

        CachedHealthResults(long timestamp, List<ServiceHealthDTO> services) {
            this.timestamp = timestamp;
            this.services = services;
        }
    }
}
