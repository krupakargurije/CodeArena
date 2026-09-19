package com.codearena.discuss.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// TODO: Implement CreateReplyRequest DTO
// Fields: content (String)

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateReplyRequest {
    private String parentReplyId;
    private String parentCommentId;
    private String content;
}