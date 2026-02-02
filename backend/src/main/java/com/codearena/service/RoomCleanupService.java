package com.codearena.service;

import com.codearena.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class RoomCleanupService {

    private final RoomRepository roomRepository;

    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void cleanupExpiredRooms() {
        // Expiry time: 1 hour 15 minutes = 75 minutes
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(75);

        long deletedCount = roomRepository.deleteByCreatedAtBefore(cutoffTime);

        if (deletedCount > 0) {
            log.info("Cleaned up {} expired rooms created before {}", deletedCount, cutoffTime);
        }
    }
}
