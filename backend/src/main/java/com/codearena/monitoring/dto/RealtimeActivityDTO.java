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
public class RealtimeActivityDTO {
    private int activeWebsocketSessions;
    private int activeRooms;
    private int inProgressContests;
    private double httpRequestsPerSecond;
    private double submissionsThroughputPerMinute;
    private long jvmMemoryUsedMb;
    private long jvmMemoryMaxMb;
    private double jvmMemoryUtilizationPercent;
    private int dbPoolActiveConnections;
    private int dbPoolMaxConnections;
    private Instant timestamp;
}
