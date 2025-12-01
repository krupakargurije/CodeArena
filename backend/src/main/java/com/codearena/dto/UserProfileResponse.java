package com.codearena.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String bio;
    private String country;
    private String organization;
    private Integer rating;
    private Integer problemsSolved;
}
