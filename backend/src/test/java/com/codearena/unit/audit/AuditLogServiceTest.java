package com.codearena.unit.audit;

import com.codearena.audit.entity.AuditLog;
import com.codearena.audit.repository.AuditLogRepository;
import com.codearena.audit.service.AuditLogService;
import com.codearena.problems.entity.Problem;
import com.codearena.profile.entity.User;
import com.codearena.profile.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    private ObjectMapper objectMapper;
    private AuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        auditLogService = new AuditLogService(auditLogRepository, userRepository, objectMapper);
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("recordEvent persists audit log with actor from SecurityContext")
    void recordEvent_withAuthenticatedAdmin_shouldCaptureActor() {
        // Arrange
        String actorId = "admin-uuid-1234";
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        actorId, "password", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );

        User profile = new User();
        profile.setId(actorId);
        profile.setUsername("admin_boss");
        when(userRepository.findById(actorId)).thenReturn(Optional.of(profile));

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> before = Map.of("is_admin", false);
        Map<String, Object> after = Map.of("is_admin", true);

        // Act
        AuditLog result = auditLogService.recordEvent(
                "GRANT_ADMIN", "USER", "user-uuid-999", before, after, "Elevating user to admin"
        );

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getActorId()).isEqualTo(actorId);
        assertThat(result.getActorUsername()).isEqualTo("admin_boss");
        assertThat(result.getAction()).isEqualTo("GRANT_ADMIN");
        assertThat(result.getEntityType()).isEqualTo("USER");
        assertThat(result.getEntityId()).isEqualTo("user-uuid-999");
        assertThat(result.getReason()).isEqualTo("Elevating user to admin");
        assertThat(result.getCorrelationId()).isNotBlank();
        assertThat(result.getBeforeState()).contains("\"is_admin\":false");
        assertThat(result.getAfterState()).contains("\"is_admin\":true");
    }

    @Test
    @DisplayName("Sensitive fields (passwords, tokens, api keys) are stripped from snapshots")
    void sanitizeAndSerialize_shouldStripSensitiveFields() {
        Map<String, Object> state = new HashMap<>();
        state.put("id", "user-1");
        state.put("username", "testuser");
        state.put("password", "supersecret123");
        state.put("passwordHash", "hashedval");
        state.put("token", "jwt.token.here");
        state.put("apiKey", "supabase-key");
        state.put("email", "test@codearena.com");

        String serialized = auditLogService.sanitizeAndSerialize(state);

        assertThat(serialized).contains("\"username\":\"testuser\"");
        assertThat(serialized).contains("\"email\":\"test@codearena.com\"");
        assertThat(serialized).doesNotContain("supersecret123");
        assertThat(serialized).doesNotContain("password");
        assertThat(serialized).doesNotContain("jwt.token.here");
        assertThat(serialized).doesNotContain("supabase-key");
    }

    @Test
    @DisplayName("snapshotProblem creates clean snapshot of problem fields")
    void snapshotProblem_shouldIncludeProblemFields() {
        Problem problem = new Problem();
        problem.setId(42L);
        problem.setTitle("Two Sum");
        problem.setDifficulty(Problem.Difficulty.EASY);
        problem.setTags(List.of("Array", "Hash Table"));
        problem.setDescription("Find two numbers that add to target");
        problem.setInputFormat("array and target");
        problem.setOutputFormat("indices");
        problem.setTotalSubmissions(100);
        problem.setAcceptedSubmissions(50);
        problem.setAcceptanceRate(50.0);

        Map<String, Object> snapshot = auditLogService.snapshotProblem(problem);

        assertThat(snapshot.get("id")).isEqualTo(42L);
        assertThat(snapshot.get("title")).isEqualTo("Two Sum");
        assertThat(snapshot.get("difficulty")).isEqualTo("EASY");
        assertThat(snapshot.get("tags")).isEqualTo(List.of("Array", "Hash Table"));
        assertThat(snapshot.get("acceptanceRate")).isEqualTo(50.0);
    }

    @Test
    @DisplayName("snapshotUser creates clean snapshot excluding password")
    void snapshotUser_shouldIncludeSafeUserFields() {
        User user = new User();
        user.setId("user-100");
        user.setUsername("coder123");
        user.setEmail("coder@example.com");
        user.setPassword("secret_hash");
        user.setRoles(Set.of("ROLE_USER", "ROLE_ADMIN"));
        user.setRating(1500);
        user.setProblemsSolved(25);

        Map<String, Object> snapshot = auditLogService.snapshotUser(user);

        assertThat(snapshot.get("id")).isEqualTo("user-100");
        assertThat(snapshot.get("username")).isEqualTo("coder123");
        assertThat(snapshot.get("email")).isEqualTo("coder@example.com");
        assertThat(snapshot.get("rating")).isEqualTo(1500);
        assertThat(snapshot).doesNotContainKey("password");
    }

    @Test
    @DisplayName("getAuditLogs clamps page size to MAX_PAGE_SIZE and bounds negative page")
    void getAuditLogs_shouldEnforceBoundedPagination() {
        when(auditLogRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        auditLogService.getAuditLogs(null, null, null, null, null, null, -5, 500);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(auditLogRepository).findAll(any(org.springframework.data.jpa.domain.Specification.class), captor.capture());

        Pageable pageable = captor.getValue();
        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isEqualTo(100); // Clamped to MAX_PAGE_SIZE
    }
}
