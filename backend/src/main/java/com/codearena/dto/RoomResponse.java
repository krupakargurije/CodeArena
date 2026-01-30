package com.codearena.dto;

import com.codearena.entity.Room;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private String id;
    private String createdBy;
    private Long problemId;
    private String problemSelectionMode;
    private Integer maxParticipants;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime createdAt;
    private List<RoomParticipantResponse> roomParticipants;
    private ProblemInfo problems; // Match frontend naming

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProblemInfo {
        private Long id;
        private String title;
        private String difficulty;
    }

    public static RoomResponse fromEntity(Room room) {
        RoomResponse response = new RoomResponse();
        response.setId(room.getId());
        response.setCreatedBy(room.getCreatedBy());
        response.setProblemId(room.getProblemId());
        response.setProblemSelectionMode(room.getProblemSelectionMode().name().toLowerCase());
        response.setMaxParticipants(room.getMaxParticipants());
        response.setStatus(room.getStatus().name().toLowerCase());
        response.setStartedAt(room.getStartedAt());
        response.setCreatedAt(room.getCreatedAt());

        // Map participants (filter out those who left)
        if (room.getParticipants() != null) {
            response.setRoomParticipants(
                    room.getParticipants().stream()
                            .filter(p -> !p.hasLeft())
                            .map(RoomParticipantResponse::fromEntity)
                            .collect(Collectors.toList()));
        }

        // Note: Problem info is not populated here as problems are stored in Supabase
        // The frontend fetches problem details separately using problemId
        // response.setProblems() is left null - frontend uses problemId to fetch from
        // Supabase

        return response;
    }
}
