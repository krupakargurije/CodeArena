package com.codearena.admin.dto;

import lombok.Data;

@Data
public class GrantAdminRequest {
    private String email;
    private String userId;
    private String username;
}
