package com.codearena.monitoring.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Operational incident record representing system disruptions, dependency outages,
 * elevated error rates, or performance degradation.
 */
@Entity
@Table(name = "incidents", indexes = {
        @Index(name = "idx_incidents_key", columnList = "incidentKey"),
        @Index(name = "idx_incidents_status", columnList = "status"),
        @Index(name = "idx_incidents_severity", columnList = "severity"),
        @Index(name = "idx_incidents_last_seen", columnList = "lastSeenAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique deterministic key for deduplicating repeated active occurrences (e.g. JUDGE0_DOWN). */
    @Column(nullable = false, length = 100)
    private String incidentKey;

    /** Short title describing the incident. */
    @Column(nullable = false, length = 255)
    private String title;

    /** Detailed diagnostic description of the incident. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Component affected (e.g. DATABASE, JUDGE0, BACKEND_API, WEBSOCKET, SUBMISSION_PIPELINE). */
    @Column(nullable = false, length = 100)
    private String component;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Severity severity = Severity.WARNING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Status status = Status.OPEN;

    /** When the incident was first detected. */
    @Column(nullable = false)
    private Instant firstSeenAt;

    /** Most recent timestamp when the alert condition was re-observed. */
    @Column(nullable = false)
    private Instant lastSeenAt;

    /** Number of continuous occurrences observed before resolution. */
    @Column(nullable = false)
    private Integer occurrenceCount = 1;

    /** Timestamp when an administrator acknowledged the incident. */
    private Instant acknowledgedAt;

    /** Username or ID of the administrator who acknowledged the incident. */
    @Column(length = 100)
    private String acknowledgedBy;

    /** Timestamp when the incident was marked resolved. */
    private Instant resolvedAt;

    /** Username or ID of the administrator who marked the incident resolved, or "SYSTEM (Auto-recovered)". */
    @Column(length = 100)
    private String resolvedBy;

    /** Human-readable explanation of the fix or recovery notes. */
    @Column(columnDefinition = "TEXT")
    private String resolutionNote;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (firstSeenAt == null) firstSeenAt = now;
        if (lastSeenAt == null) lastSeenAt = now;
        if (occurrenceCount == null) occurrenceCount = 1;
        if (status == null) status = Status.OPEN;
        if (severity == null) severity = Severity.WARNING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum Severity {
        INFO, WARNING, CRITICAL
    }

    public enum Status {
        OPEN, ACKNOWLEDGED, RESOLVED
    }
}
