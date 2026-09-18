package com.codearena.discuss.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// TODO: Implement CreateDiscussionRequest DTO
// Fields: title (String), content (String), tags (List<String>)

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDiscussionRequest {
    private String title;
    private String content;
    private List<String> tags;
}