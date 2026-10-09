package com.codearena.integration.audit;

import com.codearena.TestFixtures;
import com.codearena.admin.service.AdminService;
import com.codearena.audit.entity.AuditLog;
import com.codearena.audit.repository.AuditLogRepository;
import com.codearena.audit.service.AuditLogService;
import com.codearena.common.config.DataSeeder;
import com.codearena.common.security.JwtTokenProvider;
import com.codearena.problems.entity.Problem;
import com.codearena.problems.repository.ProblemRepository;
import com.codearena.problems.service.ProblemService;
import com.codearena.profile.entity.User;
import com.codearena.profile.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AuditLogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private ProblemService problemService;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private DataSeeder dataSeeder;

    private User adminUser;
    private String adminToken;
    private User regularUser;
    private String regularToken;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        problemRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = TestFixtures.createUser("superadmin", "admin@codearena.com", "admin123", passwordEncoder, "ROLE_ADMIN", "ROLE_USER");
        userRepository.save(adminUser);
        adminToken = TestFixtures.generateTokenForUser(adminUser, jwtTokenProvider);

        regularUser = TestFixtures.createUser("coder", "coder@codearena.com", "pass123", passwordEncoder, "ROLE_USER");
        userRepository.save(regularUser);
        regularToken = TestFixtures.generateTokenForUser(regularUser, jwtTokenProvider);
    }

    @Test
    @DisplayName("Creating, updating, and deleting a problem creates comprehensive before/after audit entries")
    void problemLifecycle_shouldGenerateAuditLogsWithDiffs() {
        // 1. Create Problem
        Problem newProblem = TestFixtures.createProblem("Binary Tree Maximum Path Sum", Problem.Difficulty.HARD);
        Problem created = problemService.createProblem(newProblem);

        List<AuditLog> logsAfterCreate = auditLogRepository.findAll();
        assertThat(logsAfterCreate).hasSize(1);
        AuditLog createLog = logsAfterCreate.get(0);
        assertThat(createLog.getAction()).isEqualTo("CREATE_PROBLEM");
        assertThat(createLog.getEntityType()).isEqualTo("PROBLEM");
        assertThat(createLog.getEntityId()).isEqualTo(String.valueOf(created.getId()));
        assertThat(createLog.getBeforeState()).isNull();
        assertThat(createLog.getAfterState()).contains("Binary Tree Maximum Path Sum");
        assertThat(createLog.getAfterState()).contains("HARD");

        // 2. Update Problem
        Problem updateDetails = new Problem();
        updateDetails.setTitle("Binary Tree Maximum Path Sum (Updated)");
        updateDetails.setDescription("Updated problem description");
        updateDetails.setDifficulty(Problem.Difficulty.MEDIUM);
        updateDetails.setTags(List.of("tree", "dfs"));
        updateDetails.setInputFormat("Tree root");
        updateDetails.setOutputFormat("Max sum integer");
        updateDetails.setConstraints("Nodes <= 10000");
        updateDetails.setSampleInput("[1,2,3]");
        updateDetails.setSampleOutput("6");
        updateDetails.setExplanation("Path is 2 -> 1 -> 3");

        Problem updated = problemService.updateProblem(created.getId(), updateDetails);

        List<AuditLog> logsAfterUpdate = auditLogRepository.findAll();
        assertThat(logsAfterUpdate).hasSize(2);
        AuditLog updateLog = logsAfterUpdate.stream()
                .filter(l -> "UPDATE_PROBLEM".equals(l.getAction()))
                .findFirst()
                .orElseThrow();
        assertThat(updateLog.getBeforeState()).contains("Binary Tree Maximum Path Sum");
        assertThat(updateLog.getBeforeState()).contains("HARD");
        assertThat(updateLog.getAfterState()).contains("Binary Tree Maximum Path Sum (Updated)");
        assertThat(updateLog.getAfterState()).contains("MEDIUM");

        // 3. Delete Problem
        problemService.deleteProblem(created.getId());

        List<AuditLog> logsAfterDelete = auditLogRepository.findAll();
        assertThat(logsAfterDelete).hasSize(3);
        AuditLog deleteLog = logsAfterDelete.stream()
                .filter(l -> "DELETE_PROBLEM".equals(l.getAction()))
                .findFirst()
                .orElseThrow();
        assertThat(deleteLog.getBeforeState()).contains("Binary Tree Maximum Path Sum (Updated)");
        assertThat(deleteLog.getAfterState()).isNull();
    }

    @Test
    @DisplayName("GET /api/admin/audit-logs returns 200 with paginated audit logs for admin")
    void getAuditLogs_asAdmin_shouldReturnPaginatedLogs() throws Exception {
        auditLogService.recordEvent(
                "GRANT_ADMIN", "USER", "user-uuid-1",
                Map.of("is_admin", false), Map.of("is_admin", true),
                "Granted admin access"
        );
        auditLogService.recordEvent(
                "CREATE_PROBLEM", "PROBLEM", "101",
                null, Map.of("title", "Problem 101", "difficulty", "EASY"),
                "New problem created"
        );

        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].action").exists())
                .andExpect(jsonPath("$.content[0].correlationId").isNotEmpty());
    }

    @Test
    @DisplayName("GET /api/admin/audit-logs filters by action, entityType, and actorId")
    void getAuditLogs_withFilters_shouldReturnMatchingSubset() throws Exception {
        auditLogService.recordEvent(
                "GRANT_ADMIN", "USER", "user-1",
                Map.of("is_admin", false), Map.of("is_admin", true),
                "Granted admin access"
        );
        auditLogService.recordEvent(
                "REVOKE_ADMIN", "USER", "user-2",
                Map.of("is_admin", true), Map.of("is_admin", false),
                "Revoked admin access"
        );
        auditLogService.recordEvent(
                "CREATE_PROBLEM", "PROBLEM", "201",
                null, Map.of("title", "Problem 201"),
                "Problem added"
        );

        // Filter by action
        mockMvc.perform(get("/api/admin/audit-logs")
                        .param("action", "GRANT_ADMIN")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].action").value("GRANT_ADMIN"));

        // Filter by entityType
        mockMvc.perform(get("/api/admin/audit-logs")
                        .param("entityType", "PROBLEM")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].entityType").value("PROBLEM"));
    }

    @Test
    @DisplayName("GET /api/admin/audit-logs/{id} returns single audit log detail")
    void getAuditLogById_shouldReturnDetails() throws Exception {
        AuditLog saved = auditLogService.recordEvent(
                "GRANT_ADMIN", "USER", "user-99",
                Map.of("is_admin", false), Map.of("is_admin", true),
                "Specific reason"
        );

        mockMvc.perform(get("/api/admin/audit-logs/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.action").value("GRANT_ADMIN"))
                .andExpect(jsonPath("$.reason").value("Specific reason"))
                .andExpect(jsonPath("$.beforeState").isNotEmpty())
                .andExpect(jsonPath("$.afterState").isNotEmpty());
    }

    @Test
    @DisplayName("Non-admin user cannot view audit logs (403 Forbidden)")
    void getAuditLogs_asRegularUser_shouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous user cannot view audit logs (401/403 Client Error)")
    void getAuditLogs_asAnonymous_shouldBeRejected() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Audit logs are append-only: DELETE, PUT, and POST on /api/admin/audit-logs are rejected with 405 Method Not Allowed")
    void auditLogs_areAppendOnly_rejectsModification() throws Exception {
        AuditLog saved = auditLogService.recordEvent(
                "GRANT_ADMIN", "USER", "user-immutable",
                Map.of("is_admin", false), Map.of("is_admin", true),
                "Integrity test"
        );

        // Attempt DELETE
        mockMvc.perform(delete("/api/admin/audit-logs/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());

        // Attempt PUT
        mockMvc.perform(put("/api/admin/audit-logs/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"HACKED\"}"))
                .andExpect(status().isMethodNotAllowed());

        // Attempt direct POST
        mockMvc.perform(post("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"FAKE_LOG\"}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Audit snapshots never contain sensitive fields (passwords, tokens, api keys)")
    void auditSnapshots_stripSensitiveData() {
        Map<String, Object> sensitiveMap = new HashMap<>();
        sensitiveMap.put("id", "user-123");
        sensitiveMap.put("username", "alice");
        sensitiveMap.put("password", "$2a$10$hashedpasswordvalue");
        sensitiveMap.put("password_hash", "$2a$10$hashedpasswordvalue");
        sensitiveMap.put("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
        sensitiveMap.put("api_key", "secret-key-12345");
        sensitiveMap.put("rating", 1400);

        AuditLog log = auditLogService.recordEvent(
                "UPDATE_USER", "USER", "user-123",
                sensitiveMap, sensitiveMap, "Profile update"
        );

        assertThat(log.getBeforeState()).doesNotContain("hashedpasswordvalue");
        assertThat(log.getBeforeState()).doesNotContain("secret-key-12345");
        assertThat(log.getBeforeState()).doesNotContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
        assertThat(log.getBeforeState()).contains("\"username\":\"alice\"");
        assertThat(log.getBeforeState()).contains("\"rating\":1400");
    }
}
