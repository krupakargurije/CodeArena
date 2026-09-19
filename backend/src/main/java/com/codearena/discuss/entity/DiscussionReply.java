package com.codearena.discuss.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// TODO: Implement DiscussionReply entity
// Fields: id (Long, auto-generated), discussionId (Long), content (String/Text),
//         authorId (String), authorUsername (String), createdAt (LocalDateTime)
// Table: "discussion_replies"

@Data
@Entity
@Table(name = "discussion_replies")
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionReply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long discussionId;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String authorId;
    private String authorUsername;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
