package com.codearena.monitoring.controller;

import com.codearena.monitoring.dto.*;
import com.codearena.monitoring.service.IncidentService;
import com.codearena.monitoring.service.MonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing real-time system health, dependency checks, Judge0 operations,
 * submission analytics, API performance, and incident management.
 *
 * <p>Protected strictly under ROLE_ADMIN.</p>
 */
@RestController
@RequestMapping("/api/admin/monitoring")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class MonitoringController {

    private final MonitoringService monitoringService;
    private final IncidentService incidentService;

    @GetMapping("/overview")
    public ResponseEntity<SystemOverviewDTO> getOverview() {
        return ResponseEntity.ok(monitoringService.getSystemOverview());
    }

    @GetMapping("/services")
    public ResponseEntity<List<ServiceHealthDTO>> getServicesHealth() {
        return ResponseEntity.ok(monitoringService.getServicesHealth());
    }

    @GetMapping("/judge0")
    public ResponseEntity<Judge0HealthDTO> getJudge0Operations() {
        return ResponseEntity.ok(monitoringService.getJudge0Operations());
    }

    @GetMapping("/submissions")
    public ResponseEntity<SubmissionAnalyticsDTO> getSubmissionAnalytics(
            @RequestParam(defaultValue = "24h") String range) {
        return ResponseEntity.ok(monitoringService.getSubmissionAnalytics(range));
    }

    @GetMapping("/performance")
    public ResponseEntity<ApiPerformanceDTO> getApiPerformance() {
        return ResponseEntity.ok(monitoringService.getApiPerformance());
    }

    @GetMapping("/activity")
    public ResponseEntity<RealtimeActivityDTO> getRealtimeActivity() {
        return ResponseEntity.ok(monitoringService.getRealtimeActivity());
    }

    @GetMapping("/incidents")
    public ResponseEntity<Page<IncidentDTO>> getIncidents(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int boundedSize = Math.max(1, Math.min(100, size));
        int boundedPage = Math.max(0, page);
        Pageable pageable = PageRequest.of(boundedPage, boundedSize);
        return ResponseEntity.ok(incidentService.getIncidents(status, pageable));
    }

    @PostMapping("/incidents/{id}/acknowledge")
    public ResponseEntity<IncidentDTO> acknowledgeIncident(
            @PathVariable Long id,
            @RequestBody(required = false) AcknowledgeIncidentRequest request,
            Authentication auth) {
        String actor = extractActor(auth);
        String note = request != null ? request.getNote() : null;
        return ResponseEntity.ok(incidentService.acknowledgeIncident(id, actor, note));
    }

    @PostMapping("/incidents/{id}/resolve")
    public ResponseEntity<IncidentDTO> resolveIncident(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveIncidentRequest request,
            Authentication auth) {
        String actor = extractActor(auth);
        String note = request != null ? request.getResolutionNote() : "Resolved by admin";
        return ResponseEntity.ok(incidentService.resolveIncident(id, actor, note));
    }

    private String extractActor(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof UserDetails) {
            return ((UserDetails) auth.getPrincipal()).getUsername();
        } else if (auth != null && auth.getPrincipal() instanceof String) {
            return (String) auth.getPrincipal();
        }
        return "admin";
    }
}
