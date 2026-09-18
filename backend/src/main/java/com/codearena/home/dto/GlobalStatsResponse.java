package com.codearena.home.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalStatsResponse {
    private long activeRooms;
    private long activePlayers;
    private long totalUsers;
}
