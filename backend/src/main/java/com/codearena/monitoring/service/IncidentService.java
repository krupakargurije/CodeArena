package com.codearena.monitoring.service;

import com.codearena.monitoring.dto.IncidentDTO;
import com.codearena.monitoring.dto.ServiceHealthDTO;
import com.codearena.monitoring.entity.Incident;
import com.codearena.monitoring.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for managing operational incidents, alert condition evaluations,
 * deduplication, and lifecycle transitions.
 */
@Service
@RequiredArgsConstructor
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository incidentRepository;

    /**
     * Evaluates live health and performance metrics to generate or auto-resolve incidents.
     */
    @Transactional
    public void evaluateAlertConditions(List<ServiceHealthDTO> serviceHealths, double errorRate5xx, double p95Latency) {
        // 1. Check Database Health
        Optional<ServiceHealthDTO> dbHealth = serviceHealths.stream()
                .filter(s -> "DATABASE".equals(s.getComponent()))
                .findFirst();

        if (dbHealth.isPresent()) {
            if ("DOWN".equals(dbHealth.get().getStatus())) {
                raiseOrUpdateIncident(
                        "DATABASE_UNAVAILABLE",
                        "Supabase PostgreSQL Database Connectivity Loss",
                        "Validation query failed: " + dbHealth.get().getMessage(),
                        "DATABASE",
                        Incident.Severity.CRITICAL
                );
            } else if ("UP".equals(dbHealth.get().getStatus())) {
                autoResolveIncident("DATABASE_UNAVAILABLE", "PostgreSQL database connection restored and responsive.");
            }
        }

        // 2. Check Judge0 Health
        Optional<ServiceHealthDTO> jHealth = serviceHealths.stream()
                .filter(s -> "JUDGE0".equals(s.getComponent()))
                .findFirst();

        if (jHealth.isPresent()) {
            if ("DOWN".equals(jHealth.get().getStatus())) {
                raiseOrUpdateIncident(
                        "JUDGE0_DOWN",
                        "Judge0 Code Execution API Outage",
                        "Judge0 sandbox is unreachable: " + jHealth.get().getMessage(),
                        "JUDGE0",
                        Incident.Severity.CRITICAL
                );
            } else if ("UP".equals(jHealth.get().getStatus())) {
                autoResolveIncident("JUDGE0_DOWN", "Judge0 Execution API recovered and accepting code evaluation requests.");
            }
        }

        // 3. Check 5xx Error Rate
        if (errorRate5xx >= 5.0) {
            raiseOrUpdateIncident(
                    "HIGH_5XX_ERROR_RATE",
                    "Elevated HTTP 5xx Error Rate",
                    String.format("Server error rate has reached %.2f%% of total traffic.", errorRate5xx),
                    "BACKEND_API",
                    Incident.Severity.WARNING
            );
        } else if (errorRate5xx < 1.0) {
            autoResolveIncident("HIGH_5XX_ERROR_RATE", "HTTP 5xx error rate normalized below threshold.");
        }

        // 4. Check Latency
        if (p95Latency >= 2000.0) {
            raiseOrUpdateIncident(
                    "ELEVATED_API_LATENCY",
                    "Elevated API Response Latency",
                    String.format("p95 request latency has exceeded 2000ms (measured %.1fms).", p95Latency),
                    "BACKEND_API",
                    Incident.Severity.WARNING
            );
        } else if (p95Latency < 1000.0 && p95Latency > 0.0) {
            autoResolveIncident("ELEVATED_API_LATENCY", "API response latencies returned to normal operating range.");
        }
    }

    private final ConcurrentHashMap<String, Object> keyLocks = new ConcurrentHashMap<>();

    @Transactional
    public Incident raiseOrUpdateIncident(String incidentKey, String title, String description,
                                          String component, Incident.Severity severity) {
        Object lock = keyLocks.computeIfAbsent(incidentKey, k -> new Object());
        synchronized (lock) {
            Instant now = Instant.now();
            Optional<Incident> existingOpt = incidentRepository.findActiveByIncidentKey(incidentKey);

            if (existingOpt.isPresent()) {
                Incident existing = existingOpt.get();
                existing.setLastSeenAt(now);
                existing.setOccurrenceCount(existing.getOccurrenceCount() + 1);
                existing.setDescription(description);
                log.debug("Deduplicated active incident: key={}, count={}", incidentKey, existing.getOccurrenceCount());
                return incidentRepository.save(existing);
            }

            Incident newIncident = new Incident();
            newIncident.setIncidentKey(incidentKey);
            newIncident.setTitle(title);
            newIncident.setDescription(description);
            newIncident.setComponent(component);
            newIncident.setSeverity(severity);
            newIncident.setStatus(Incident.Status.OPEN);
            newIncident.setFirstSeenAt(now);
            newIncident.setLastSeenAt(now);
            newIncident.setOccurrenceCount(1);
            newIncident.setCreatedAt(now);
            newIncident.setUpdatedAt(now);

            Incident saved = incidentRepository.save(newIncident);
            log.warn("New operational incident opened: id={}, key={}, severity={}", saved.getId(), incidentKey, severity);
            return saved;
        }
    }

    @Transactional
    public void autoResolveIncident(String incidentKey, String note) {
        incidentRepository.findActiveByIncidentKey(incidentKey).ifPresent(incident -> {
            incident.setStatus(Incident.Status.RESOLVED);
            incident.setResolvedAt(Instant.now());
            incident.setResolvedBy("SYSTEM (Auto-recovered)");
            incident.setResolutionNote(note);
            incidentRepository.save(incident);
            log.info("Incident auto-resolved: id={}, key={}", incident.getId(), incidentKey);
        });
    }

    @Transactional
    public IncidentDTO acknowledgeIncident(Long id, String username, String note) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + id));

        if (incident.getStatus() == Incident.Status.RESOLVED) {
            throw new IllegalStateException("Cannot acknowledge a resolved incident.");
        }

        incident.setStatus(Incident.Status.ACKNOWLEDGED);
        incident.setAcknowledgedAt(Instant.now());
        incident.setAcknowledgedBy(username != null ? username : "admin");
        if (note != null && !note.isBlank()) {
            incident.setDescription(incident.getDescription() + "\n[Admin Note]: " + note.trim());
        }

        return IncidentDTO.fromEntity(incidentRepository.save(incident));
    }

    @Transactional
    public IncidentDTO resolveIncident(Long id, String username, String resolutionNote) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + id));

        incident.setStatus(Incident.Status.RESOLVED);
        incident.setResolvedAt(Instant.now());
        incident.setResolvedBy(username != null ? username : "admin");
        incident.setResolutionNote(resolutionNote != null ? resolutionNote.trim() : "Resolved by admin");

        return IncidentDTO.fromEntity(incidentRepository.save(incident));
    }

    @Transactional(readOnly = true)
    public Page<IncidentDTO> getIncidents(String statusFilter, Pageable pageable) {
        if (statusFilter != null && !statusFilter.isBlank()) {
            String upper = statusFilter.toUpperCase().trim();
            if ("ACTIVE".equals(upper)) {
                List<Incident> active = incidentRepository.findByStatusInOrderByLastSeenAtDesc(
                        List.of(Incident.Status.OPEN, Incident.Status.ACKNOWLEDGED)
                );
                // Return as PageImpl
                int start = (int) pageable.getOffset();
                int end = Math.min((start + pageable.getPageSize()), active.size());
                List<IncidentDTO> subList = start > active.size() ? List.of() :
                        active.subList(start, end).stream().map(IncidentDTO::fromEntity).collect(Collectors.toList());
                return new org.springframework.data.domain.PageImpl<>(subList, pageable, active.size());
            }

            try {
                Incident.Status st = Incident.Status.valueOf(upper);
                return incidentRepository.findByStatus(st, pageable).map(IncidentDTO::fromEntity);
            } catch (IllegalArgumentException ignored) {}
        }

        return incidentRepository.findAllByOrderByCreatedAtDesc(pageable).map(IncidentDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public int countActiveIncidents() {
        return (int) incidentRepository.countByStatusIn(List.of(Incident.Status.OPEN, Incident.Status.ACKNOWLEDGED));
    }
}
