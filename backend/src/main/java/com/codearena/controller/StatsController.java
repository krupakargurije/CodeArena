package com.codearena.controller;

import com.codearena.repository.RoomParticipantRepository;
import com.codearena.repository.RoomRepository;
import com.codearena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, Long>> getGlobalStats() {
        Map<String, Long> stats = new HashMap<>();

        long activeRooms = roomRepository.count();
        long activePlayers = roomParticipantRepository.countByLeftAtIsNull();
        long totalUsers = userRepository.count();

        stats.put("activeRooms", activeRooms);
        stats.put("activePlayers", activePlayers);
        stats.put("totalUsers", totalUsers);

        return ResponseEntity.ok(stats);
    }
}
