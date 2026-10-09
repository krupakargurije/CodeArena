package com.codearena.unit.monitoring;

import com.codearena.monitoring.dto.IncidentDTO;
import com.codearena.monitoring.entity.Incident;
import com.codearena.monitoring.repository.IncidentRepository;
import com.codearena.monitoring.service.IncidentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    private IncidentService incidentService;

    @BeforeEach
    void setUp() {
        incidentService = new IncidentService(incidentRepository);
    }

    @Test
    @DisplayName("raiseOrUpdateIncident creates a new incident when none active")
    void raiseOrUpdateIncident_whenNoneActive_shouldCreateNew() {
        when(incidentRepository.findAllActiveByIncidentKey("JUDGE0_DOWN")).thenReturn(java.util.Collections.emptyList());
        when(incidentRepository.save(any(Incident.class))).thenAnswer(i -> {
            Incident inc = i.getArgument(0);
            inc.setId(1L);
            return inc;
        });

        Incident incident = incidentService.raiseOrUpdateIncident(
                "JUDGE0_DOWN", "Judge0 API Outage", "Connection timeout", "JUDGE0", Incident.Severity.CRITICAL
        );

        assertThat(incident).isNotNull();
        assertThat(incident.getId()).isEqualTo(1L);
        assertThat(incident.getIncidentKey()).isEqualTo("JUDGE0_DOWN");
        assertThat(incident.getStatus()).isEqualTo(Incident.Status.OPEN);
        assertThat(incident.getOccurrenceCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("raiseOrUpdateIncident deduplicates existing active incident by incrementing count")
    void raiseOrUpdateIncident_whenActiveExists_shouldDeduplicate() {
        Incident existing = new Incident();
        existing.setId(5L);
        existing.setIncidentKey("DATABASE_UNAVAILABLE");
        existing.setStatus(Incident.Status.OPEN);
        existing.setOccurrenceCount(3);
        existing.setLastSeenAt(Instant.now().minusSeconds(60));

        when(incidentRepository.findAllActiveByIncidentKey("DATABASE_UNAVAILABLE")).thenReturn(java.util.List.of(existing));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(i -> i.getArgument(0));

        Incident updated = incidentService.raiseOrUpdateIncident(
                "DATABASE_UNAVAILABLE", "Postgres Down", "Query failed", "DATABASE", Incident.Severity.CRITICAL
        );

        assertThat(updated.getId()).isEqualTo(5L);
        assertThat(updated.getOccurrenceCount()).isEqualTo(4);
        assertThat(updated.getLastSeenAt()).isAfter(Instant.now().minusSeconds(5));
    }

    @Test
    @DisplayName("autoResolveIncident marks active incident as RESOLVED")
    void autoResolveIncident_shouldMarkAsResolved() {
        Incident existing = new Incident();
        existing.setId(7L);
        existing.setIncidentKey("JUDGE0_DOWN");
        existing.setStatus(Incident.Status.OPEN);

        when(incidentRepository.findAllActiveByIncidentKey("JUDGE0_DOWN")).thenReturn(java.util.List.of(existing));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(i -> i.getArgument(0));

        incidentService.autoResolveIncident("JUDGE0_DOWN", "Judge0 back online");

        ArgumentCaptor<Incident> captor = ArgumentCaptor.forClass(Incident.class);
        verify(incidentRepository).save(captor.capture());

        Incident saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(Incident.Status.RESOLVED);
        assertThat(saved.getResolvedAt()).isNotNull();
        assertThat(saved.getResolutionNote()).isEqualTo("Judge0 back online");
    }

    @Test
    @DisplayName("acknowledgeIncident sets status to ACKNOWLEDGED")
    void acknowledgeIncident_shouldSetStatusAcknowledged() {
        Incident existing = new Incident();
        existing.setId(10L);
        existing.setDescription("Initial issue");
        existing.setStatus(Incident.Status.OPEN);

        when(incidentRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(i -> i.getArgument(0));

        IncidentDTO dto = incidentService.acknowledgeIncident(10L, "admin_user", "Investigating now");

        assertThat(dto.getStatus()).isEqualTo(Incident.Status.ACKNOWLEDGED);
        assertThat(dto.getAcknowledgedBy()).isEqualTo("admin_user");
        assertThat(dto.getAcknowledgedAt()).isNotNull();
    }

    @Test
    @DisplayName("evaluateAlertConditions ignores high latency when sample count is below 10")
    void evaluateAlertConditions_lowSample_shouldNotRaiseLatencyAlert() {
        incidentService.evaluateAlertConditions(java.util.List.of(), 0.0, 5000.0, 5);

        verify(incidentRepository, never()).save(any(Incident.class));
    }

    @Test
    @DisplayName("evaluateAlertConditions raises latency alert when sample count >= 10 and p95 >= 2000ms")
    void evaluateAlertConditions_highLatency_shouldRaiseAlert() {
        lenient().when(incidentRepository.findAllActiveByIncidentKey("HIGH_5XX_ERROR_RATE")).thenReturn(java.util.Collections.emptyList());
        lenient().when(incidentRepository.findAllActiveByIncidentKey("ELEVATED_API_LATENCY")).thenReturn(java.util.Collections.emptyList());
        when(incidentRepository.save(any(Incident.class))).thenAnswer(i -> i.getArgument(0));

        incidentService.evaluateAlertConditions(java.util.List.of(), 0.0, 2500.0, 15);

        verify(incidentRepository).save(argThat(inc ->
                "ELEVATED_API_LATENCY".equals(inc.getIncidentKey()) &&
                inc.getStatus() == Incident.Status.OPEN &&
                inc.getDescription().contains("2500.0ms")
        ));
    }

    @Test
    @DisplayName("evaluateAlertConditions auto-resolves latency alert when p95 drops below 1800ms")
    void evaluateAlertConditions_normalizedLatency_shouldAutoResolve() {
        Incident existing = new Incident();
        existing.setId(20L);
        existing.setIncidentKey("ELEVATED_API_LATENCY");
        existing.setStatus(Incident.Status.OPEN);

        lenient().when(incidentRepository.findAllActiveByIncidentKey("HIGH_5XX_ERROR_RATE")).thenReturn(java.util.Collections.emptyList());
        lenient().when(incidentRepository.findAllActiveByIncidentKey("ELEVATED_API_LATENCY")).thenReturn(java.util.List.of(existing));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(i -> i.getArgument(0));

        incidentService.evaluateAlertConditions(java.util.List.of(), 0.0, 800.0, 20);

        verify(incidentRepository).save(argThat(inc ->
                "ELEVATED_API_LATENCY".equals(inc.getIncidentKey()) &&
                inc.getStatus() == Incident.Status.RESOLVED
        ));
    }
}

