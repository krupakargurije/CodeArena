package com.codearena.audit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Persistent audit record for administrative actions.
 * Records are append-only; no update or delete endpoints are exposed.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audit_logs_actor_id", columnList = "actorId"),
        @Index(name = "idx_audit_logs_action", columnList = "action"),
        @Index(name = "idx_audit_logs_entity_type", columnList = "entityType"),
        @Index(name = "idx_audit_logs_entity_id", columnList = "entityId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** UUID of the authenticated admin who performed the action. */
    @Column(nullable = false)
    private String actorId;

    /** Display username of the actor at the time of the action. */
    @Column(nullable = false)
    private String actorUsername;

    /** The type of action performed (e.g. GRANT_ADMIN, REVOKE_ADMIN). */
    @Column(nullable = false, length = 100)
    private String action;

    /** The type of entity affected (e.g. USER). */
    @Column(nullable = false, length = 100)
    private String entityType;

    /** The ID of the affected entity. */
    @Column(nullable = false)
    private String entityId;

    /** JSON snapshot of the entity state before the change. */
    @Column(columnDefinition = "TEXT")
    private String beforeState;

    /** JSON snapshot of the entity state after the change. */
    @Column(columnDefinition = "TEXT")
    private String afterState;

    /** Server-generated UTC timestamp. */
    @Column(nullable = false)
    private Instant timestamp;

    /** Optional reason provided by the admin. */
    @Column(length = 500)
    private String reason;

    /** Request correlation ID for tracing. */
    @Column(length = 100)
    private String correlationId;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
        if (correlationId == null) {
            correlationId = java.util.UUID.randomUUID().toString();
        }
    }
}
