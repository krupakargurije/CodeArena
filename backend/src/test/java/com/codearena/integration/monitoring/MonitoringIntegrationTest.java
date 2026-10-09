package com.codearena.integration.monitoring;

import com.codearena.TestFixtures;
import com.codearena.common.config.DataSeeder;
import com.codearena.common.security.JwtTokenProvider;
import com.codearena.monitoring.entity.Incident;
import com.codearena.monitoring.repository.IncidentRepository;
import com.codearena.monitoring.service.IncidentService;
import com.codearena.problems.entity.Problem;
import com.codearena.problems.entity.Submission;
import com.codearena.problems.repository.ProblemRepository;
import com.codearena.problems.repository.SubmissionRepository;
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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class MonitoringIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

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
        incidentRepository.deleteAll();
        submissionRepository.deleteAll();
        problemRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = TestFixtures.createUser("monitor_admin", "admin@codearena.com", "admin123", passwordEncoder, "ROLE_ADMIN", "ROLE_USER");
        userRepository.save(adminUser);
        adminToken = TestFixtures.generateTokenForUser(adminUser, jwtTokenProvider);

        regularUser = TestFixtures.createUser("coder_user", "coder@codearena.com", "pass123", passwordEncoder, "ROLE_USER");
        userRepository.save(regularUser);
        regularToken = TestFixtures.generateTokenForUser(regularUser, jwtTokenProvider);
    }

    @Test
    @DisplayName("GET /api/admin/monitoring/overview returns 200 with platform metrics for admin")
    void getOverview_asAdmin_shouldReturnMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/monitoring/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.uptimeSeconds").isNumber())
                .andExpect(jsonPath("$.uptimeFormatted").isNotEmpty())
                .andExpect(jsonPath("$.apiAvailabilityPercent").isNumber())
                .andExpect(jsonPath("$.databaseStatus").exists());
    }

    @Test
    @DisplayName("GET /api/admin/monitoring/services returns component health checks")
    void getServices_asAdmin_shouldReturnHealthChecks() throws Exception {
        mockMvc.perform(get("/api/admin/monitoring/services")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[?(@.component == 'BACKEND')].status").value("UP"))
                .andExpect(jsonPath("$[?(@.component == 'DATABASE')].status").exists());
    }

    @Test
    @DisplayName("GET /api/admin/monitoring/submissions returns actual aggregated submission analytics")
    void getSubmissionsAnalytics_asAdmin_shouldReturnAggregatedStats() throws Exception {
        Problem problem = problemRepository.save(TestFixtures.createProblem("Two Sum", Problem.Difficulty.EASY));
        submissionRepository.save(TestFixtures.createSubmission(adminUser, problem, "print(1)", "python", Submission.Status.ACCEPTED));
        submissionRepository.save(TestFixtures.createSubmission(adminUser, problem, "print(2)", "python", Submission.Status.WRONG_ANSWER));

        mockMvc.perform(get("/api/admin/monitoring/submissions?range=24h")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSubmissions").value(2))
                .andExpect(jsonPath("$.acceptedSubmissions").value(1))
                .andExpect(jsonPath("$.wrongAnswerSubmissions").value(1))
                .andExpect(jsonPath("$.acceptanceRatePercent").value(50.0))
                .andExpect(jsonPath("$.timeSeries").isArray());
    }

    @Test
    @DisplayName("GET /api/admin/monitoring/performance returns API response metrics and latencies")
    void getPerformance_asAdmin_shouldReturnApiMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/monitoring/performance")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.p50LatencyMs").isNumber())
                .andExpect(jsonPath("$.jvmMemoryUsedMb").isNumber());
    }

    @Test
    @DisplayName("GET /api/admin/monitoring/activity returns real-time sessions and room counts")
    void getActivity_asAdmin_shouldReturnRealtimeMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/monitoring/activity")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeWebsocketSessions").isNumber())
                .andExpect(jsonPath("$.activeRooms").isNumber());
    }

    @Test
    @DisplayName("Incident lifecycle: Raising, acknowledging, and resolving incidents works as admin")
    void incidentsLifecycle_asAdmin_shouldTransitionCorrectly() throws Exception {
        Incident incident = incidentService.raiseOrUpdateIncident(
                "TEST_OUTAGE", "Test Component Outage", "Simulation", "DATABASE", Incident.Severity.WARNING
        );

        // 1. Get incidents
        mockMvc.perform(get("/api/admin/monitoring/incidents?status=ACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].incidentKey").value("TEST_OUTAGE"))
                .andExpect(jsonPath("$.content[0].status").value("OPEN"));

        // 2. Acknowledge
        mockMvc.perform(post("/api/admin/monitoring/incidents/" + incident.getId() + "/acknowledge")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"We are checking the DB cluster\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"))
                .andExpect(jsonPath("$.acknowledgedBy").isNotEmpty());

        // 3. Resolve
        mockMvc.perform(post("/api/admin/monitoring/incidents/" + incident.getId() + "/resolve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resolutionNote\":\"Cluster node restarted\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolutionNote").value("Cluster node restarted"));
    }

    @Test
    @DisplayName("Non-admin user receives 403 Forbidden on monitoring endpoints")
    void monitoring_asRegularUser_shouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/monitoring/overview")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous user receives 401/403 Client Error on monitoring endpoints")
    void monitoring_asAnonymous_shouldBeRejected() throws Exception {
        mockMvc.perform(get("/api/admin/monitoring/overview"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Full End-to-End Recurring Incident Lifecycle: Open -> Deduplicate -> Auto-Resolve -> Reopen Fresh")
    void incidentLifecycle_recurringFailure_shouldReopenFreshIncident() throws Exception {
        // Step 1: First failure creates an OPEN incident (count = 1)
        Incident first = incidentService.raiseOrUpdateIncident(
                "JUDGE0_DOWN", "Judge0 Execution API Outage", "Sandbox unreachable", "JUDGE0", Incident.Severity.CRITICAL
        );
        assertThat(first.getStatus()).isEqualTo(Incident.Status.OPEN);
        assertThat(first.getOccurrenceCount()).isEqualTo(1);

        // Step 2: Repeated failure deduplicates into same active incident (count = 2)
        Incident repeated = incidentService.raiseOrUpdateIncident(
                "JUDGE0_DOWN", "Judge0 Execution API Outage", "Sandbox unreachable", "JUDGE0", Incident.Severity.CRITICAL
        );
        assertThat(repeated.getId()).isEqualTo(first.getId());
        assertThat(repeated.getOccurrenceCount()).isEqualTo(2);

        // Step 3: Service recovery auto-resolves the incident
        incidentService.autoResolveIncident("JUDGE0_DOWN", "Judge0 API recovered");
        Incident resolved = incidentRepository.findById(first.getId()).orElseThrow();
        assertThat(resolved.getStatus()).isEqualTo(Incident.Status.RESOLVED);
        assertThat(resolved.getResolvedBy()).contains("SYSTEM");

        // Step 4: Recurring failure after resolution creates a BRAND NEW open incident
        Incident newIncident = incidentService.raiseOrUpdateIncident(
                "JUDGE0_DOWN", "Judge0 Execution API Outage", "Sandbox unreachable again", "JUDGE0", Incident.Severity.CRITICAL
        );
        assertThat(newIncident.getId()).isNotEqualTo(first.getId());
        assertThat(newIncident.getStatus()).isEqualTo(Incident.Status.OPEN);
        assertThat(newIncident.getOccurrenceCount()).isEqualTo(1);

        // Confirm both the historical resolved incident and the new active incident exist in DB
        assertThat(incidentRepository.count()).isEqualTo(2);
    }

    @Test
    @DisplayName("Actuator Security: /actuator/health is public, /actuator/metrics requires admin")
    void actuatorEndpoints_securityRules_shouldBeEnforced() throws Exception {
        // Public health endpoint check
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        // Non-admin / anonymous rejected on sensitive actuator metrics
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/actuator/metrics")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden());

        // Admin authorized on actuator metrics
        mockMvc.perform(get("/actuator/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.names").isArray());
    }
}
