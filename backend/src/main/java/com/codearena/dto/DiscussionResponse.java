package com.codearena.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// TODO: Implement DiscussionResponse DTO
// Fields: id (Long), title (String), content (String), tags (List<String>),
//         authorId (String), authorUsername (String), replyCount (Integer),
//         createdAt (LocalDateTime), updatedAt (LocalDateTime),
//         replies (List<ReplyResponse>) — only populated in getById endpoint

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionResponse {
    private Long id;
    private String title;
    private String content;
    private List<String> tags;
    private String authorId;
    private String authorUsername;
    private Integer replyCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ReplyResponse> replies;
}
