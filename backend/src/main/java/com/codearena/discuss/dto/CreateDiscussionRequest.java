package com.codearena.discuss.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDiscussionRequest {
    private String title;
    private String content;
    private List<String> tags;
}