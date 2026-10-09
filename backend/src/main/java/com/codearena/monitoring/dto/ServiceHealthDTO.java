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
public class ServiceHealthDTO {
    private String serviceName;
    private String component; // BACKEND, DATABASE, JUDGE0, WEBSOCKET
    private String status; // UP, DEGRADED, DOWN, UNKNOWN
    private Long responseTimeMs;
    private Instant lastCheckTime;
    private Instant lastSuccessfulCheck;
    private Instant lastFailureTime;
    private String message;
    private Map<String, Object> details;
}
