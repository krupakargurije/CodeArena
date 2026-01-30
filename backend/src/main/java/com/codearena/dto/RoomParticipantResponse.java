package com.codearena.dto;

import com.codearena.entity.RoomParticipant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomParticipantResponse {
    private Long id;
    private String userId;
    private String username;
    private LocalDateTime joinedAt;
    private Boolean isReady;

    public static RoomParticipantResponse fromEntity(RoomParticipant participant) {
        RoomParticipantResponse response = new RoomParticipantResponse();
        response.setId(participant.getId());
        response.setUserId(participant.getUserId());
        response.setUsername(participant.getUsername());
        response.setJoinedAt(participant.getJoinedAt());
        response.setIsReady(participant.getIsReady());
        return response;
    }
}
