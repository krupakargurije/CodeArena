package com.codearena.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @Column(length = 6)
    private String id;

    @Column(nullable = false)
    private String createdBy;

    private Long problemId;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ProblemSelectionMode problemSelectionMode;

    @Column(nullable = false)
    private Integer maxParticipants = 4;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private RoomStatus status = RoomStatus.WAITING;

    private LocalDateTime startedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<RoomParticipant> participants = new ArrayList<>();

    // Note: Problem data is fetched from Supabase, not H2, so no @ManyToOne
    // relationship
    // problemId is stored as a simple Long column without foreign key constraint

    public enum ProblemSelectionMode {
        SINGLE, RANDOM
    }

    public enum RoomStatus {
        WAITING, ACTIVE, COMPLETED
    }
}
