package com.codearena.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemOverviewDTO {
    private String status; // UP, DEGRADED, DOWN
    private long uptimeSeconds;
    private String uptimeFormatted;
    private double apiAvailabilityPercent;
    private String databaseStatus;
    private String judge0Status;
    private long totalSubmissions;
    private double submissionFailureRatePercent;
    private double apiErrorRatePercent;
    private double latencyP50Ms;
    private double latencyP95Ms;
    private double latencyP99Ms;
    private int activeWebsocketSessions;
    private int activeRooms;
    private int activeIncidentsCount;
    private Instant lastUpdated;
}
