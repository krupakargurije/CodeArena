package com.codearena.home.service;

import com.codearena.home.dto.GlobalStatsResponse;
import com.codearena.profile.repository.UserRepository;
import com.codearena.rooms.repository.RoomParticipantRepository;
import com.codearena.rooms.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final UserRepository userRepository;

    public GlobalStatsResponse getGlobalStatsDto() {
        long activeRooms = roomRepository.count();
        long activePlayers = roomParticipantRepository.countByLeftAtIsNull();
        long totalUsers = userRepository.count();

        return GlobalStatsResponse.builder()
                .activeRooms(activeRooms)
                .activePlayers(activePlayers)
                .totalUsers(totalUsers)
                .build();
    }

    public Map<String, Long> getGlobalStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("activeRooms", roomRepository.count());
        stats.put("activePlayers", roomParticipantRepository.countByLeftAtIsNull());
        stats.put("totalUsers", userRepository.count());
        return stats;
    }
}
