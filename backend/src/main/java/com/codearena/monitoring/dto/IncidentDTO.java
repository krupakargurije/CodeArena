package com.codearena.monitoring.dto;

import com.codearena.monitoring.entity.Incident;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentDTO {
    private Long id;
    private String incidentKey;
    private String title;
    private String description;
    private String component;
    private Incident.Severity severity;
    private Incident.Status status;
    private Instant firstSeenAt;
    private Instant lastSeenAt;
    private Integer occurrenceCount;
    private Instant acknowledgedAt;
    private String acknowledgedBy;
    private Instant resolvedAt;
    private String resolvedBy;
    private String resolutionNote;
    private Instant createdAt;
    private Instant updatedAt;

    public static IncidentDTO fromEntity(Incident incident) {
        if (incident == null) return null;
        return IncidentDTO.builder()
                .id(incident.getId())
                .incidentKey(incident.getIncidentKey())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .component(incident.getComponent())
                .severity(incident.getSeverity())
                .status(incident.getStatus())
                .firstSeenAt(incident.getFirstSeenAt())
                .lastSeenAt(incident.getLastSeenAt())
                .occurrenceCount(incident.getOccurrenceCount())
                .acknowledgedAt(incident.getAcknowledgedAt())
                .acknowledgedBy(incident.getAcknowledgedBy())
                .resolvedAt(incident.getResolvedAt())
                .resolvedBy(incident.getResolvedBy())
                .resolutionNote(incident.getResolutionNote())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }
}
