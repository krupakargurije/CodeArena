package com.codearena.controller;

import com.codearena.dto.UserProfileResponse;
import com.codearena.entity.User;
import com.codearena.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile(Authentication authentication) {
        // Add debug log
        org.slf4j.LoggerFactory.getLogger(UserController.class)
                .info("UserController: getCurrentUserProfile called for {}", authentication.getName());
        String username = authentication.getName();
        return ResponseEntity.ok(userService.getUserProfile(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @RequestBody User updates,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(username, updates));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserProfileResponse>> getLeaderboard() {
        return ResponseEntity.ok(userService.getLeaderboard());
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/admin/grant")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> grantAdmin(@RequestBody com.codearena.dto.GrantAdminRequest request) {
        userService.grantAdmin(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/revoke")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> revokeAdmin(@RequestBody String email) {
        userService.revokeAdmin(email);
        return ResponseEntity.ok().build();
    }
}
