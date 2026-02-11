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
    public ResponseEntity<?> grantAdminPermission(@RequestBody com.codearena.dto.GrantAdminRequest request) {
        try {
            System.out.println("Grant admin request received for: " + request.getEmail());
            Map<String, Object> user = adminService.grantAdminPermission(request.getEmail());
            System.out.println("Grant admin successful for: " + request.getEmail());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.err.println("Grant admin failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/users/revoke-admin")
    public ResponseEntity<Map<String, Object>> revokeAdminPermission(
            @RequestBody com.codearena.dto.GrantAdminRequest request) {
        Map<String, Object> user = adminService.revokeAdminPermission(request.getEmail());
        return ResponseEntity.ok(user);
    }
}
