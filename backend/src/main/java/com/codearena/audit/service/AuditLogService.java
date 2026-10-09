package com.codearena.audit.service;

import com.codearena.audit.entity.AuditLog;
import com.codearena.audit.repository.AuditLogRepository;
import com.codearena.problems.entity.Problem;
import com.codearena.profile.entity.User;
import com.codearena.profile.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service for recording and querying audit log events.
 *
 * <p>Actor identity is always derived server-side from the SecurityContext.
 * Sensitive fields (passwords, tokens, secrets) are stripped from snapshots.
 * Audit records are append-only and cannot be modified or deleted through application APIs.</p>
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /** Maximum page size to prevent unbounded queries. */
    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE_SIZE = 20;

    /** Fields that must never appear in audit snapshots. */
    private static final Set<String> SENSITIVE_FIELDS = Set.of(
            "password", "passwordhash", "password_hash",
            "token", "accesstoken", "access_token",
            "refreshtoken", "refresh_token",
            "secret", "apikey", "api_key",
            "jwt", "credential", "credentials"
    );

    /**
     * Record an audit event within the current transaction.
     *
     * @param action     Action type (e.g. GRANT_ADMIN, REVOKE_ADMIN, CREATE_PROBLEM)
     * @param entityType Entity type (e.g. USER, PROBLEM)
     * @param entityId   ID of the affected entity
     * @param before     Map of entity state before the change (may be null)
     * @param after      Map of entity state after the change (may be null)
     * @param reason     Optional human-readable reason
     * @return the persisted AuditLog record
     */
    @Transactional
    public AuditLog recordEvent(String action, String entityType, String entityId,
                                Map<String, Object> before, Map<String, Object> after,
                                String reason) {

        // Derive actor from server-side SecurityContext — never trust frontend
        String actorId = "SYSTEM";
        String actorUsername = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            Object principal = auth.getPrincipal();
            if (principal instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) principal;
                actorId = userDetails.getUsername(); // This is the user's UUID or username
                actorUsername = actorId;
                try {
                    Optional<User> u = userRepository.findById(actorId);
                    if (u.isPresent()) {
                        actorUsername = u.get().getUsername();
                    }
                } catch (Exception e) {
                    log.debug("Could not resolve username for actorId: {}", actorId);
                }
            } else if (principal instanceof String && !"anonymousUser".equals(principal)) {
                actorId = (String) principal;
                actorUsername = actorId;
            }
        }

        AuditLog auditLog = new AuditLog();
        auditLog.setActorId(actorId);
        auditLog.setActorUsername(actorUsername);
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setBeforeState(sanitizeAndSerialize(before));
        auditLog.setAfterState(sanitizeAndSerialize(after));
        auditLog.setTimestamp(Instant.now());
        auditLog.setReason(reason);
        auditLog.setCorrelationId(UUID.randomUUID().toString());

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("Audit event recorded: id={}, action={}, entityType={}, entityId={}, actor={}({})",
                saved.getId(), action, entityType, entityId, actorUsername, actorId);

        return saved;
    }

    /**
     * Retrieve a single audit log entry by ID.
     */
    @Transactional(readOnly = true)
    public Optional<AuditLog> getById(Long id) {
        return auditLogRepository.findById(id);
    }

    /**
     * Retrieve paginated and filtered audit log entries.
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(String action, String actorId, String entityType,
                                       String entityId, Instant from, Instant to,
                                       int page, int size) {
        // Enforce bounded pagination
        if (size <= 0) size = DEFAULT_PAGE_SIZE;
        if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE;
        if (page < 0) page = 0;

        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp"));

        org.springframework.data.jpa.domain.Specification<AuditLog> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action.trim()));
            }
            if (actorId != null && !actorId.isBlank()) {
                String trimmedActor = actorId.trim();
                predicates.add(cb.or(
                        cb.equal(root.get("actorId"), trimmedActor),
                        cb.equal(root.get("actorUsername"), trimmedActor)
                ));
            }
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType.trim()));
            }
            if (entityId != null && !entityId.isBlank()) {
                predicates.add(cb.equal(root.get("entityId"), entityId.trim()));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), to));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return auditLogRepository.findAll(spec, pageable);
    }

    /**
     * Create a safe, allowlisted snapshot of a User entity for audit purposes.
     * Excludes passwords, tokens, and other sensitive fields.
     */
    public Map<String, Object> snapshotUser(User user) {
        if (user == null) return null;
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", user.getId());
        snapshot.put("username", user.getUsername());
        snapshot.put("email", user.getEmail());
        snapshot.put("roles", user.getRoles() != null ? new ArrayList<>(user.getRoles()) : Collections.emptyList());
        snapshot.put("rating", user.getRating());
        snapshot.put("problemsSolved", user.getProblemsSolved());
        snapshot.put("bio", user.getBio());
        snapshot.put("country", user.getCountry());
        snapshot.put("organization", user.getOrganization());
        // Excludes: password
        return snapshot;
    }

    /**
     * Create a safe snapshot of a Problem entity for audit purposes.
     */
    public Map<String, Object> snapshotProblem(Problem problem) {
        if (problem == null) return null;
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", problem.getId());
        snapshot.put("title", problem.getTitle());
        snapshot.put("difficulty", problem.getDifficulty() != null ? problem.getDifficulty().name() : null);
        snapshot.put("tags", problem.getTags() != null ? new ArrayList<>(problem.getTags()) : Collections.emptyList());
        snapshot.put("description", problem.getDescription());
        snapshot.put("inputFormat", problem.getInputFormat());
        snapshot.put("outputFormat", problem.getOutputFormat());
        snapshot.put("constraints", problem.getConstraints());
        snapshot.put("sampleInput", problem.getSampleInput());
        snapshot.put("sampleOutput", problem.getSampleOutput());
        snapshot.put("explanation", problem.getExplanation());
        snapshot.put("testCasesUrl", problem.getTestCasesUrl());
        snapshot.put("totalSubmissions", problem.getTotalSubmissions());
        snapshot.put("acceptedSubmissions", problem.getAcceptedSubmissions());
        snapshot.put("acceptanceRate", problem.getAcceptanceRate());
        return snapshot;
    }

    /**
     * Create a safe snapshot from a generic Map (such as Supabase user profile map).
     */
    public Map<String, Object> snapshotMap(Map<String, Object> map) {
        if (map == null) return null;
        Map<String, Object> snapshot = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!SENSITIVE_FIELDS.contains(entry.getKey().toLowerCase().replace("_", ""))) {
                snapshot.put(entry.getKey(), entry.getValue());
            }
        }
        return snapshot;
    }

    /**
     * Serialize a map to JSON, stripping sensitive fields recursively.
     * Returns null if the map is null or serialization fails.
     */
    public String sanitizeAndSerialize(Map<String, Object> data) {
        if (data == null) return null;
        Map<String, Object> sanitized = sanitizeMap(data);
        try {
            return objectMapper.writeValueAsString(sanitized);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit snapshot", e);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> sanitizeMap(Map<String, Object> map) {
        if (map == null) return null;
        Map<String, Object> sanitized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = entry.getKey();
            String normalizedKey = key.toLowerCase().replace("_", "").replace("-", "");
            if (SENSITIVE_FIELDS.contains(normalizedKey)) {
                continue;
            }
            Object value = entry.getValue();
            if (value instanceof Map) {
                sanitized.put(key, sanitizeMap((Map<String, Object>) value));
            } else if (value instanceof Collection) {
                sanitized.put(key, sanitizeCollection((Collection<?>) value));
            } else {
                sanitized.put(key, value);
            }
        }
        return sanitized;
    }

    @SuppressWarnings("unchecked")
    private List<Object> sanitizeCollection(Collection<?> collection) {
        if (collection == null) return null;
        List<Object> sanitizedList = new ArrayList<>();
        for (Object item : collection) {
            if (item instanceof Map) {
                sanitizedList.add(sanitizeMap((Map<String, Object>) item));
            } else if (item instanceof Collection) {
                sanitizedList.add(sanitizeCollection((Collection<?>) item));
            } else {
                sanitizedList.add(item);
            }
        }
        return sanitizedList;
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
