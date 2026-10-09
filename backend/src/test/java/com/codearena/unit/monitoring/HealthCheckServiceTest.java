package com.codearena.unit.monitoring;

import com.codearena.monitoring.dto.ServiceHealthDTO;
import com.codearena.monitoring.service.HealthCheckService;
import com.codearena.monitoring.service.WebSocketActivityTracker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import javax.sql.DataSource;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class HealthCheckServiceTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private WebSocketActivityTracker webSocketActivityTracker;

    private HealthCheckService healthCheckService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        healthCheckService = new HealthCheckService(dataSource, webSocketActivityTracker);
    }

    @Test
    @DisplayName("Overall status is UP when all services are UP")
    void determineOverallStatus_allUp_returnsUp() {
        List<ServiceHealthDTO> services = List.of(
                createService("BACKEND", "UP"),
                createService("DATABASE", "UP"),
                createService("JUDGE0", "UP"),
                createService("WEBSOCKET", "UP")
        );

        String status = healthCheckService.determineOverallStatus(services);
        assertThat(status).isEqualTo("UP");
    }

    @Test
    @DisplayName("Overall status is DEGRADED when Judge0 is DOWN but core DB and Backend are UP")
    void determineOverallStatus_judge0Down_returnsDegraded() {
        List<ServiceHealthDTO> services = List.of(
                createService("BACKEND", "UP"),
                createService("DATABASE", "UP"),
                createService("JUDGE0", "DOWN"),
                createService("WEBSOCKET", "UP")
        );

        String status = healthCheckService.determineOverallStatus(services);
        assertThat(status).isEqualTo("DEGRADED");
    }

    @Test
    @DisplayName("Overall status is DOWN when Database is DOWN")
    void determineOverallStatus_databaseDown_returnsDown() {
        List<ServiceHealthDTO> services = List.of(
                createService("BACKEND", "UP"),
                createService("DATABASE", "DOWN"),
                createService("JUDGE0", "UP"),
                createService("WEBSOCKET", "UP")
        );

        String status = healthCheckService.determineOverallStatus(services);
        assertThat(status).isEqualTo("DOWN");
    }

    @Test
    @DisplayName("Overall status is DOWN when Backend is DOWN")
    void determineOverallStatus_backendDown_returnsDown() {
        List<ServiceHealthDTO> services = List.of(
                createService("BACKEND", "DOWN"),
                createService("DATABASE", "UP"),
                createService("JUDGE0", "UP"),
                createService("WEBSOCKET", "UP")
        );

        String status = healthCheckService.determineOverallStatus(services);
        assertThat(status).isEqualTo("DOWN");
    }

    @Test
    @DisplayName("Overall status is DEGRADED when any service is DEGRADED")
    void determineOverallStatus_serviceDegraded_returnsDegraded() {
        List<ServiceHealthDTO> services = List.of(
                createService("BACKEND", "UP"),
                createService("DATABASE", "UP"),
                createService("JUDGE0", "DEGRADED"),
                createService("WEBSOCKET", "UP")
        );

        String status = healthCheckService.determineOverallStatus(services);
        assertThat(status).isEqualTo("DEGRADED");
    }

    private ServiceHealthDTO createService(String component, String status) {
        return ServiceHealthDTO.builder()
                .serviceName(component)
                .component(component)
                .status(status)
                .responseTimeMs(10L)
                .lastCheckTime(Instant.now())
                .message("Status: " + status)
                .build();
    }
}
