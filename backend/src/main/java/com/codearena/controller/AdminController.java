package com.codearena.controller;

import com.codearena.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
// TODO: Add proper authentication - temporarily disabled for testing
// @PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/admins")
    public ResponseEntity<List<Map<String, Object>>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }

    @PostMapping("/users/grant-admin")
    public ResponseEntity<?> grantAdminPermission(@RequestParam String email) {
        try {
            System.out.println("Grant admin request received for: " + email);
            Map<String, Object> user = adminService.grantAdminPermission(email);
            System.out.println("Grant admin successful for: " + email);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.err.println("Grant admin failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/users/revoke-admin")
    public ResponseEntity<Map<String, Object>> revokeAdminPermission(@RequestParam String email) {
        Map<String, Object> user = adminService.revokeAdminPermission(email);
        return ResponseEntity.ok(user);
    }
}
