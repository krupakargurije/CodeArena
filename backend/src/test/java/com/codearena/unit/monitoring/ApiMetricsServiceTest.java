package com.codearena.unit.monitoring;

import com.codearena.monitoring.dto.ApiPerformanceDTO;
import com.codearena.monitoring.service.ApiMetricsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class ApiMetricsServiceTest {

    private ApiMetricsService metricsService;

    @BeforeEach
    void setUp() {
        metricsService = new ApiMetricsService();
    }

    @Test
    @DisplayName("ApiMetricsService correctly calculates status code distribution and error rates")
    void recordRequest_shouldUpdateStatusCodeCounters() {
        metricsService.recordRequest("GET", "/api/problems", 200, 15.0);
        metricsService.recordRequest("GET", "/api/problems/1", 200, 25.0);
        metricsService.recordRequest("POST", "/api/auth/login", 401, 10.0);
        metricsService.recordRequest("GET", "/api/admin/users", 500, 100.0);

        ApiPerformanceDTO perf = metricsService.getPerformanceMetrics();

        assertThat(perf.getTotalRequests()).isEqualTo(4);
        assertThat(perf.getStatus2xx()).isEqualTo(2);
        assertThat(perf.getStatus4xx()).isEqualTo(1);
        assertThat(perf.getStatus5xx()).isEqualTo(1);
        assertThat(perf.getErrorRate5xxPercent()).isEqualTo(25.0);
    }

    @Test
    @DisplayName("ApiMetricsService normalizes path variables to prevent high cardinality")
    void recordRequest_shouldNormalizeDynamicPathVariables() {
        metricsService.recordRequest("GET", "/api/problems/101", 200, 10.0);
        metricsService.recordRequest("GET", "/api/problems/202", 200, 20.0);
        metricsService.recordRequest("GET", "/api/problems/303", 200, 30.0);

        ApiPerformanceDTO perf = metricsService.getPerformanceMetrics();

        assertThat(perf.getSlowEndpoints()).hasSize(1);
        assertThat(perf.getSlowEndpoints().get(0).getUriPattern()).isEqualTo("/api/problems/{id}");
        assertThat(perf.getSlowEndpoints().get(0).getRequestCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("ApiMetricsService accurately computes latency percentiles")
    void recordRequest_shouldComputeAccuratePercentiles() {
        for (int i = 1; i <= 100; i++) {
            metricsService.recordRequest("GET", "/api/problems", 200, (double) i);
        }

        ApiPerformanceDTO perf = metricsService.getPerformanceMetrics();

        assertThat(perf.getP50LatencyMs()).isEqualTo(50.0);
        assertThat(perf.getP95LatencyMs()).isEqualTo(95.0);
        assertThat(perf.getP99LatencyMs()).isEqualTo(99.0);
    }
}
