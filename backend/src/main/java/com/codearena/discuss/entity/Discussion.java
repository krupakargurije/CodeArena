package com.codearena.discuss.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// TODO: Implement Discussion entity
// Fields: id (Long, auto-generated), title (String), content (String/Text),
//         tags (ElementCollection<String>), authorId (String), authorUsername (String),
//         replyCount (Integer, default 0), createdAt (LocalDateTime), updatedAt (LocalDateTime)
// Table: "discussions"

@Entity
@Getter
@Setter
@Table(name = "discussions")
public class Discussion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String authorId;
    private String authorUsername;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> tags = new java.util.ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer replyCount = 0;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (replyCount == null) {
            replyCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();

        if (replyCount == null) {
            replyCount = 0;
        }
    }
}
