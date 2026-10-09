package com.codearena.unit.admin;

import com.codearena.admin.service.AdminService;
import com.codearena.audit.service.AuditLogService;
import com.codearena.common.config.SupabaseHttpClientConfig;
import com.codearena.profile.service.UserService;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminServiceConnectionTest {

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private UserService userService;

    @Mock
    private RestTemplate restTemplate;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(auditLogService, userService, restTemplate);
    }

    @Test
    @DisplayName("SupabaseHttpClientConfig initializes pooled CloseableHttpClient and RestTemplate bean")
    void supabaseHttpClientConfig_shouldProvidePooledBeans() {
        SupabaseHttpClientConfig config = new SupabaseHttpClientConfig();
        CloseableHttpClient httpClient = config.pooledCloseableHttpClient();
        assertThat(httpClient).isNotNull();

        RestTemplate pooledRestTemplate = config.supabaseRestTemplate(httpClient);
        assertThat(pooledRestTemplate).isNotNull();
        assertThat(pooledRestTemplate.getRequestFactory()).isNotNull();
    }

    @Test
    @DisplayName("grantAdminPermission extracts updated state directly from PATCH response avoiding 3rd round trip")
    void grantAdminPermission_shouldExtractFromPatchResponse() {
        Map<String, Object> beforeUser = Map.of("id", "user-123", "email", "dev@codearena.com", "username", "dev", "is_admin", false);
        Map<String, Object> patchedUser = Map.of("id", "user-123", "email", "dev@codearena.com", "username", "dev", "is_admin", true);

        // 1. fetchUserByEmail (GET)
        when(restTemplate.exchange(
                contains("/rest/v1/profiles?email=eq.dev@codearena.com"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(org.springframework.core.ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(beforeUser), HttpStatus.OK));

        // 2. PATCH
        when(restTemplate.exchange(
                contains("/rest/v1/profiles?email=eq.dev@codearena.com"),
                eq(HttpMethod.PATCH),
                any(HttpEntity.class),
                any(org.springframework.core.ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(patchedUser), HttpStatus.OK));

        Map<String, Object> result = adminService.grantAdminPermission("dev@codearena.com");

        assertThat(result).isNotNull();
        assertThat(result.get("is_admin")).isEqualTo(true);

        // Verify PATCH was called and NO second GET was made after PATCH
        verify(restTemplate, times(1)).exchange(contains("/rest/v1/profiles?email=eq.dev@codearena.com"), eq(HttpMethod.GET), any(), any(org.springframework.core.ParameterizedTypeReference.class));
        verify(restTemplate, times(1)).exchange(contains("/rest/v1/profiles?email=eq.dev@codearena.com"), eq(HttpMethod.PATCH), any(), any(org.springframework.core.ParameterizedTypeReference.class));
    }
}
