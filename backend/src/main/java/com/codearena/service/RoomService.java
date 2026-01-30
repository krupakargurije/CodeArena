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

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private static final String ROOM_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int ROOM_ID_LENGTH = 6;
    private final Random random = new Random();

    public RoomService(RoomRepository roomRepository,
            RoomParticipantRepository participantRepository,
            ProblemRepository problemRepository) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.problemRepository = problemRepository;
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
     * Join an existing room
     */
    @Transactional
    public RoomResponse joinRoom(String roomId, String userId, String username) {
        roomId = roomId.toUpperCase();

        Room room = roomRepository.findByIdWithParticipants(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.getStatus() != Room.RoomStatus.WAITING) {
            throw new RuntimeException("Room is not available to join");
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
}
