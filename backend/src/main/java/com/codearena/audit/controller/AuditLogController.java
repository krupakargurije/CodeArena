package com.codearena.audit.controller;

import com.codearena.audit.entity.AuditLog;
import com.codearena.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * Controller for querying audit logs.
 * Accessible only to administrators (ROLE_ADMIN).
 * Append-only by design: no PUT, PATCH, or DELETE endpoints are provided.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Get paginated audit logs with optional filters.
     *
     * @param action     Optional filter by action type (e.g. GRANT_ADMIN, CREATE_PROBLEM)
     * @param actorId    Optional filter by actor ID
     * @param entityType Optional filter by entity type (e.g. USER, PROBLEM)
     * @param entityId   Optional filter by entity ID
     * @param from       Optional filter start timestamp (ISO-8601)
     * @param to         Optional filter end timestamp (ISO-8601)
     * @param page       Page index (0-based, default 0)
     * @param size       Page size (default 20, max 100)
     * @return Paginated list of AuditLog records
     */
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLog> logs = auditLogService.getAuditLogs(
                action, actorId, entityType, entityId, from, to, page, size
        );
        return ResponseEntity.ok(logs);
    }

    /**
     * Get a specific audit log record by its ID.
     *
     * @param id The audit log record ID
     * @return The AuditLog record or 404 Not Found
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> getAuditLogById(@PathVariable Long id) {
        return auditLogService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
