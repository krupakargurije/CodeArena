package com.codearena.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {
    private Long problemId;
    private String problemSelectionMode; // "single" or "random"
    private Integer maxParticipants;
}
