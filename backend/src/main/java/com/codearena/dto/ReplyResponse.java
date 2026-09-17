package com.codearena.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// TODO: Implement ReplyResponse DTO
// Fields: id (Long), content (String), authorId (String),
//         authorUsername (String), createdAt (LocalDateTime)

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReplyResponse{
    private Long id;
    private String content;
    private String authorId;
    private String authorUsername;
    private LocalDateTime createdAt;
}
    