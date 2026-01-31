package com.codearena.controller;

import com.codearena.dto.CreateRoomRequest;
import com.codearena.dto.JoinRoomRequest;
import com.codearena.dto.RoomResponse;
import com.codearena.dto.StartRoomRequest;
import com.codearena.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private static final Logger log = LoggerFactory.getLogger(RoomController.class);

    private final RoomService roomService;

    /**
     * Create a new room
     * POST /api/rooms
     */
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @RequestBody CreateRoomRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestHeader(value = "X-Username", required = false) String headerUsername,
            @RequestParam(value = "userId", required = false) String paramUserId,
            @RequestParam(value = "username", required = false) String paramUsername) {

        String userId = headerUserId != null ? headerUserId : paramUserId;
        String username = headerUsername != null ? headerUsername : paramUsername;

        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (username == null || username.isEmpty()) {
            username = "User";
        }

        RoomResponse room = roomService.createRoom(userId, username, request);
        return ResponseEntity.ok(room);
    }

    /**
     * Join a random room
     * POST /api/rooms/random-join
     */
    @PostMapping("/random-join")
    public ResponseEntity<RoomResponse> randomJoinRoom(
            @RequestBody(required = false) CreateRoomRequest preferences,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestHeader(value = "X-Username", required = false) String headerUsername,
            @RequestParam(value = "userId", required = false) String paramUserId,
            @RequestParam(value = "username", required = false) String paramUsername) {

        String userId = headerUserId != null ? headerUserId : paramUserId;
        String username = headerUsername != null ? headerUsername : paramUsername;

        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (username == null || username.isEmpty()) {
            username = "User";
        }

        RoomResponse room = roomService.randomJoinRoom(userId, username, preferences);
        return ResponseEntity.ok(room);
    }

    /**
     * Join an existing room
     * POST /api/rooms/{id}/join
     */
    @PostMapping("/{id}/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @PathVariable String id,
            @RequestBody JoinRoomRequest request) {

        if (request.getUserId() == null || request.getUserId().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String username = request.getUsername();
        if (username == null || username.isEmpty()) {
            username = "User";
        }

        RoomResponse room = roomService.joinRoom(id, request.getUserId(), username);
        return ResponseEntity.ok(room);
    }

    /**
     * Leave a room
     * POST /api/rooms/{id}/leave
     */
    @PostMapping("/{id}/leave")
    public ResponseEntity<Map<String, Object>> leaveRoom(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String userId = request.get("userId");
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        roomService.leaveRoom(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Delete a room (creator only)
     * DELETE /api/rooms/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRoom(
            @PathVariable String id,
            @RequestParam(value = "userId", required = false) String paramUserId,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId) {

        String userId = headerUserId != null ? headerUserId : paramUserId;
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        roomService.deleteRoom(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Get room details
     * GET /api/rooms/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoomDetails(@PathVariable String id) {
        RoomResponse room = roomService.getRoomDetails(id);
        return ResponseEntity.ok(room);
    }

    /**
     * Update ready status
     * PATCH /api/rooms/{id}/ready
     */
    @PatchMapping("/{id}/ready")
    public ResponseEntity<Map<String, Object>> updateReadyStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String userId = (String) request.get("userId");
        Boolean isReady = (Boolean) request.get("isReady");

        if (userId == null || userId.isEmpty() || isReady == null) {
            return ResponseEntity.badRequest().build();
        }

        roomService.updateReadyStatus(id, userId, isReady);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Start a room (creator only)
     * POST /api/rooms/{id}/start
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<RoomResponse> startRoom(
            @PathVariable String id,
            @RequestBody StartRoomRequest request) {

        log.info("=== START ROOM REQUEST: roomId={}, request={} ===", id, request);

        String userId = request.getUserId();
        if (userId == null || userId.isEmpty()) {
            log.warn("startRoom: userId is null or empty");
            return ResponseEntity.badRequest().build();
        }

        RoomResponse room = roomService.startRoom(id, userId);
        log.info("=== START ROOM SUCCESS: roomId={}, status={} ===", id, room.getStatus());
        return ResponseEntity.ok(room);
    }

    /**
     * Get user's active rooms
     * GET /api/rooms/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RoomResponse>> getUserRooms(@PathVariable String userId) {
        List<RoomResponse> rooms = roomService.getUserRooms(userId);
        return ResponseEntity.ok(rooms);
    }

    /**
     * Get all public rooms
     * GET /api/rooms/public
     */
    @GetMapping("/public")
    public ResponseEntity<List<RoomResponse>> getPublicRooms() {
        List<RoomResponse> rooms = roomService.getPublicRooms();
        return ResponseEntity.ok(rooms);
    }
}
