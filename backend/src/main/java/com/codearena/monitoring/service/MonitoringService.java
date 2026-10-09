package com.codearena.monitoring.service;

import com.codearena.monitoring.dto.*;
import com.codearena.rooms.entity.Room;
import com.codearena.rooms.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Main coordinator service for CodeArena observability, aggregation, and monitoring endpoints.
 */
@Service
@RequiredArgsConstructor
public class MonitoringService {

    private static final Logger log = LoggerFactory.getLogger(MonitoringService.class);

    private final HealthCheckService healthCheckService;
    private final ApiMetricsService apiMetricsService;
    private final SubmissionAnalyticsService submissionAnalyticsService;
    private final WebSocketActivityTracker webSocketActivityTracker;
    private final IncidentService incidentService;
    private final RoomRepository roomRepository;

    private final AtomicBoolean isEvaluating = new AtomicBoolean(false);

    /**
     * Periodic background evaluation task running every 30 seconds.
     * Evaluates dependency health probes and API metrics to automatically trigger or resolve incidents.
     */
    @Scheduled(fixedDelay = 30000, initialDelay = 10000)
    public void runPeriodicAlertEvaluation() {
        if (!isEvaluating.compareAndSet(false, true)) {
            log.debug("Previous alert evaluation still in progress, skipping cycle.");
            return;
        }
        try {
            List<ServiceHealthDTO> services = healthCheckService.getAllServiceHealth();
            ApiPerformanceDTO perf = apiMetricsService.getPerformanceMetrics();
            incidentService.evaluateAlertConditions(services, perf.getErrorRate5xxPercent(), perf.getP95LatencyMs(), perf.getTotalRequests());
        } catch (Exception e) {
            log.warn("Periodic alert evaluation failed: {}", e.getMessage());
        } finally {
            isEvaluating.set(false);
        }
    }

    @Transactional
    public SystemOverviewDTO getSystemOverview() {
        List<ServiceHealthDTO> services = healthCheckService.getAllServiceHealth();
        String overallStatus = healthCheckService.determineOverallStatus(services);

        ApiPerformanceDTO perf = apiMetricsService.getPerformanceMetrics();
        SubmissionAnalyticsDTO subs = submissionAnalyticsService.getAnalytics("24h");

        // Run alert condition evaluation with sample volume awareness
        incidentService.evaluateAlertConditions(services, perf.getErrorRate5xxPercent(), perf.getP95LatencyMs(), perf.getTotalRequests());

        int activeIncidents = incidentService.countActiveIncidents();
        int activeWsSessions = webSocketActivityTracker.getActiveSessionCount();
        int activeRooms = (int) roomRepository.count();

        String dbStatus = services.stream()
                .filter(s -> "DATABASE".equals(s.getComponent()))
                .map(ServiceHealthDTO::getStatus)
                .findFirst().orElse("UNKNOWN");

        String judge0Status = services.stream()
                .filter(s -> "JUDGE0".equals(s.getComponent()))
                .map(ServiceHealthDTO::getStatus)
                .findFirst().orElse("UNKNOWN");

        long uptimeSec = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        String formattedUptime = formatUptime(uptimeSec);

        // Availability % calculation (100 - errorRate5xx)
        double availability = Math.max(0.0, Math.min(100.0, 100.0 - perf.getErrorRate5xxPercent()));

        return SystemOverviewDTO.builder()
                .status(overallStatus)
                .uptimeSeconds(uptimeSec)
                .uptimeFormatted(formattedUptime)
                .apiAvailabilityPercent(Math.round(availability * 100.0) / 100.0)
                .databaseStatus(dbStatus)
                .judge0Status(judge0Status)
                .totalSubmissions(subs.getTotalSubmissions())
                .submissionFailureRatePercent(subs.getPlatformFailureRatePercent())
                .apiErrorRatePercent(perf.getErrorRate5xxPercent())
                .latencyP50Ms(perf.getP50LatencyMs())
                .latencyP95Ms(perf.getP95LatencyMs())
                .latencyP99Ms(perf.getP99LatencyMs())
                .activeWebsocketSessions(activeWsSessions)
                .activeRooms(activeRooms)
                .activeIncidentsCount(activeIncidents)
                .lastUpdated(Instant.now())
                .build();
    }

    public List<ServiceHealthDTO> getServicesHealth() {
        return healthCheckService.getAllServiceHealth();
    }

    public Judge0HealthDTO getJudge0Operations() {
        return submissionAnalyticsService.getJudge0Operations();
    }

    public SubmissionAnalyticsDTO getSubmissionAnalytics(String range) {
        return submissionAnalyticsService.getAnalytics(range);
    }

    public ApiPerformanceDTO getApiPerformance() {
        return apiMetricsService.getPerformanceMetrics();
    }

    public RealtimeActivityDTO getRealtimeActivity() {
        int activeWsSessions = webSocketActivityTracker.getActiveSessionCount();
        List<Room> inProgress = roomRepository.findByStatus(Room.RoomStatus.ACTIVE);
        int totalRooms = (int) roomRepository.count();

        double rps = apiMetricsService.getRequestRatePerSecond();

        Runtime rt = Runtime.getRuntime();
        long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long maxMb = rt.maxMemory() / (1024 * 1024);
        double memPercent = maxMb > 0 ? (double) usedMb / maxMb * 100.0 : 0.0;

        return RealtimeActivityDTO.builder()
                .activeWebsocketSessions(activeWsSessions)
                .activeRooms(totalRooms)
                .inProgressContests(inProgress.size())
                .httpRequestsPerSecond(Math.round(rps * 100.0) / 100.0)
                .submissionsThroughputPerMinute(Math.round((rps * 0.1) * 100.0) / 100.0)
                .jvmMemoryUsedMb(usedMb)
                .jvmMemoryMaxMb(maxMb)
                .jvmMemoryUtilizationPercent(Math.round(memPercent * 10.0) / 10.0)
                .dbPoolActiveConnections(1) // Base pool active
                .dbPoolMaxConnections(10) // Hikari default in application.yml
                .timestamp(Instant.now())
                .build();
    }

    private String formatUptime(long seconds) {
        long days = seconds / (24 * 3600);
        long hours = (seconds % (24 * 3600)) / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;

        if (days > 0) {
            return String.format("%dd %dh %dm", days, hours, minutes);
        } else if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, secs);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, secs);
        } else {
            return String.format("%ds", secs);
        }
    }
}
