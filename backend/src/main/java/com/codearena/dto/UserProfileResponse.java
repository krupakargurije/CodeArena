package com.codearena.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private String id;
    private String username;
    private String email;
    private String bio;
    private String country;
    private String organization;
    private Integer rating;

    @JsonProperty("problems_solved")
    private Integer problemsSolved;

    @JsonProperty("is_admin")
    private Boolean is_admin;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("avatar_url")
    private String avatarUrl;
}
