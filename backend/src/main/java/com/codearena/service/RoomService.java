package com.codearena.service;

import com.codearena.dto.CreateRoomRequest;
import com.codearena.dto.RoomResponse;
import com.codearena.entity.Problem;
import com.codearena.entity.Room;
import com.codearena.entity.RoomParticipant;
import com.codearena.repository.ProblemRepository;
import com.codearena.repository.RoomParticipantRepository;
import com.codearena.repository.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private static final Logger log = LoggerFactory.getLogger(RoomService.class);

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final ProblemRepository problemRepository;
    private final RestTemplate restTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private static final String ROOM_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int ROOM_ID_LENGTH = 6;
    private final Random random = new Random();

    public RoomService(RoomRepository roomRepository,
            RoomParticipantRepository participantRepository,
            ProblemRepository problemRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.problemRepository = problemRepository;
        this.messagingTemplate = messagingTemplate;
        this.restTemplate = new RestTemplate();
    }

    private HttpHeaders createSupabaseHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseKey);
        headers.set("Authorization", "Bearer " + supabaseKey);
        return headers;
    }

    /**
     * Fetch all problem IDs from Supabase
     */
    private List<Long> fetchProblemIdsFromSupabase() {
        String url = supabaseUrl + "/rest/v1/problems?select=id";
        HttpEntity<String> entity = new HttpEntity<>(createSupabaseHeaders());

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    List.class);

            List<Map<String, Object>> problems = response.getBody();
            if (problems == null || problems.isEmpty()) {
                return List.of();
            }

            return problems.stream()
                    .map(p -> ((Number) p.get("id")).longValue())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to fetch problems from Supabase: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Generate a unique 6-character room ID
     */
    private String generateRoomId() {
        StringBuilder sb = new StringBuilder(ROOM_ID_LENGTH);
        for (int i = 0; i < ROOM_ID_LENGTH; i++) {
            sb.append(ROOM_ID_CHARS.charAt(random.nextInt(ROOM_ID_CHARS.length())));
        }
        return sb.toString();
    }

    /**
     * Create a new room
     */
    @Transactional
    public RoomResponse createRoom(String userId, String username, CreateRoomRequest request) {
        // Generate unique room ID
        String roomId;
        do {
            roomId = generateRoomId();
        } while (roomRepository.existsById(roomId));

        Room room = new Room();
        room.setId(roomId);
        room.setCreatedBy(userId);
        room.setProblemId(request.getProblemId());
        room.setProblemSelectionMode(
                Room.ProblemSelectionMode.valueOf(request.getProblemSelectionMode().toUpperCase()));
        room.setMaxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : 4);
        room.setIsPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false);
        room.setStatus(Room.RoomStatus.WAITING);

        room = roomRepository.save(room);

        // Add creator as first participant
        RoomParticipant participant = new RoomParticipant();
        participant.setRoom(room);
        participant.setUserId(userId);
        participant.setUsername(username);
        participant.setIsReady(false);
        participantRepository.save(participant);

        // Fetch with participants for response
        Room savedRoom = roomRepository.findByIdWithParticipants(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found after creation"));

        return RoomResponse.fromEntity(savedRoom);
    }

    /**
     * Complete a room
     */
    @Transactional
    public void completeRoom(String roomId, String winnerId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.getStatus() == Room.RoomStatus.COMPLETED) {
            return; // Already completed
        }

        room.setStatus(Room.RoomStatus.COMPLETED);
        room.setWinnerId(winnerId);
        roomRepository.save(room);

        // Notify participants
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/status",
                Map.of("status", "COMPLETED", "winnerId", winnerId));
    }

    /**
     * Join an existing room
     */
    @Transactional
    public RoomResponse joinRoom(String roomId, String userId, String username) {
        roomId = roomId.toUpperCase();

        Room room = roomRepository.findByIdWithParticipants(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.getStatus() == Room.RoomStatus.COMPLETED) {
            throw new RuntimeException("Room has already ended");
        }

        // Check if already joined
        if (participantRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)) {
            return RoomResponse.fromEntity(room);
        }

        // Check if room is full
        long activeCount = participantRepository.countByRoomIdAndLeftAtIsNull(roomId);
        if (activeCount >= room.getMaxParticipants()) {
            throw new RuntimeException("Room is full");
        }

        // Add participant
        RoomParticipant participant = new RoomParticipant();
        participant.setRoom(room);
        participant.setUserId(userId);
        participant.setUsername(username);
        participant.setIsReady(false);
        participantRepository.save(participant);

        // Refresh room data
        Room updatedRoom = roomRepository.findByIdWithParticipants(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Clear empty flag if it was set
        if (updatedRoom.getLastEmptyAt() != null) {
            updatedRoom.setLastEmptyAt(null);
            updatedRoom = roomRepository.save(updatedRoom);
        }

        return RoomResponse.fromEntity(updatedRoom);
    }

    /**
     * Leave a room
     */
    @Transactional
    public void leaveRoom(String roomId, String userId) {
        roomId = roomId.toUpperCase();

        RoomParticipant participant = participantRepository
                .findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)
                .orElseThrow(() -> new RuntimeException("Participant not found in room"));

        participant.setLeftAt(LocalDateTime.now());
        participantRepository.save(participant);

        // Check if room is empty
        long activeCount = participantRepository.countByRoomIdAndLeftAtIsNull(roomId);
        if (activeCount == 0) {
            Room room = roomRepository.findById(roomId).orElseThrow();
            room.setLastEmptyAt(LocalDateTime.now());
            roomRepository.save(room);
        }
    }

    /**
     * Delete a room (creator only, waiting status only)
     */
    @Transactional
    public void deleteRoom(String roomId, String userId) {
        roomId = roomId.toUpperCase();

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Only room creator can delete the room");
        }

        // Allow deletion regardless of status
        // if (room.getStatus() != Room.RoomStatus.WAITING) {
        // throw new RuntimeException("Cannot delete room that has already started");
        // }

        roomRepository.delete(room);
    }

    /**
     * Get room details
     */
    @Transactional(readOnly = true)
    public RoomResponse getRoomDetails(String roomId) {
        roomId = roomId.toUpperCase();

        Room room = roomRepository.findByIdWithParticipants(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        return RoomResponse.fromEntity(room);
    }

    /**
     * Update ready status
     */
    @Transactional
    public void updateReadyStatus(String roomId, String userId, Boolean isReady) {
        roomId = roomId.toUpperCase();

        RoomParticipant participant = participantRepository
                .findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)
                .orElseThrow(() -> new RuntimeException("Participant not found in room"));

        participant.setIsReady(isReady);
        participantRepository.save(participant);
    }

    /**
     * Start a room (creator only)
     */
    @Transactional
    public RoomResponse startRoom(String roomId, String userId) {
        roomId = roomId.toUpperCase();

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Only room creator can start the room");
        }

        if (room.getStatus() != Room.RoomStatus.WAITING) {
            throw new RuntimeException("Room has already started");
        }

        // If random mode, select a random problem from Supabase
        Long problemId = room.getProblemId();
        if (room.getProblemSelectionMode() == Room.ProblemSelectionMode.RANDOM) {
            log.info("Fetching problems from Supabase for random selection...");
            List<Long> problemIds = fetchProblemIdsFromSupabase();
            log.info("Found {} problems from Supabase", problemIds.size());
            if (problemIds.isEmpty()) {
                throw new RuntimeException("No problems available in the database");
            }
            problemId = problemIds.get(random.nextInt(problemIds.size()));
            log.info("Selected random problem ID: {}", problemId);
        }

        if (problemId == null) {
            throw new RuntimeException("Could not determine problem for this room");
        }

        room.setProblemId(problemId);
        room.setStatus(Room.RoomStatus.ACTIVE);
        room.setStartedAt(LocalDateTime.now());
        roomRepository.save(room);

        // Fetch updated room with problem info
        Room updatedRoom = roomRepository.findByIdWithParticipants(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        return RoomResponse.fromEntity(updatedRoom);
    }

    /**
     * Get user's active rooms
     */
    @Transactional(readOnly = true)
    public List<RoomResponse> getUserRooms(String userId) {
        List<RoomParticipant> participations = participantRepository.findActiveRoomsByUserId(userId);

        return participations.stream()
                .map(RoomParticipant::getRoom)
                .distinct()
                .map(RoomResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all available public rooms (Waiting or Active)
     */
    @Transactional(readOnly = true)
    public List<RoomResponse> getPublicRooms() {
        // Return both WAITING and ACTIVE public rooms
        // We can reuse findAvailablePublicRooms for WAITING ones, but we need ACTIVE
        // ones too.
        List<Room> rooms = roomRepository.findAll().stream()
                .filter(r -> !r.getIsPrivate())
                .filter(r -> r.getStatus() == Room.RoomStatus.WAITING || r.getStatus() == Room.RoomStatus.ACTIVE)
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt())) // Newest first
                .collect(Collectors.toList());

        return rooms.stream()
                .map(RoomResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Random join room
     */
    @Transactional
    public RoomResponse randomJoinRoom(String userId, String username, CreateRoomRequest preferences) {
        // 1. Find candidate rooms
        List<Room> availableRooms = roomRepository.findAvailablePublicRooms();

        // 2. Try to join first available
        for (Room room : availableRooms) {
            try {
                // Double check constraints
                if (room.getParticipants().size() >= room.getMaxParticipants()) {
                    continue;
                }

                return joinRoom(room.getId(), userId, username);
            } catch (Exception e) {
                // Optimistic locking or other failure, try next room
                log.warn("Failed to random join room {}: {}", room.getId(), e.getMessage());
            }
        }

        // 3. If no room found, create new one
        if (preferences == null) {
            preferences = new CreateRoomRequest();
            preferences.setProblemSelectionMode("random");
            preferences.setMaxParticipants(4);
            preferences.setIsPrivate(false);
        } else {
            // Ensure forced public
            preferences.setIsPrivate(false);
        }

        return createRoom(userId, username, preferences);
    }

    /**
     * Cleanup expired or empty rooms
     * Runs every minute
     */
    @Scheduled(fixedRate = 60000, initialDelay = 60000)
    @Transactional
    public void cleanupRooms() {
        LocalDateTime now = LocalDateTime.now();
        List<Room> rooms = roomRepository.findAll();
        int deletedCount = 0;

        for (Room room : rooms) {
            boolean shouldDelete = false;
            String reason = "";

            // Rule 1: Exceeds 3 hours duration (180 minutes)
            if (room.getStatus() == Room.RoomStatus.ACTIVE && room.getStartedAt() != null) {
                if (room.getStartedAt().plusMinutes(180).isBefore(now)) {
                    shouldDelete = true;
                    reason = "Exceeded 180 minutes duration";
                }
            }

            // Rule 2: Empty for more than 15 minutes
            // If lastEmptyAt is set, check if 15 mins have passed
            if (!shouldDelete && room.getLastEmptyAt() != null) {
                if (room.getLastEmptyAt().plusMinutes(15).isBefore(now)) {
                    // Double check if actually empty to be safe (though lastEmptyAt should be
                    // reliable)
                    long activeCount = participantRepository.countByRoomIdAndLeftAtIsNull(room.getId());
                    if (activeCount == 0) {
                        shouldDelete = true;
                        reason = "Empty for > 5 minutes";
                    } else {
                        // Inconsistency found, reset flag
                        room.setLastEmptyAt(null);
                        roomRepository.save(room);
                    }
                }
            }

            if (shouldDelete) {
                log.info("Deleting room {} - Reason: {}", room.getId(), reason);
                roomRepository.delete(room);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            log.info("Cleanup completed. Deleted {} rooms.", deletedCount);
        }
    }
}
