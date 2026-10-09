package com.codearena.admin.service;

import com.codearena.admin.dto.GrantAdminRequest;
import com.codearena.audit.service.AuditLogService;
import com.codearena.profile.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private final RestTemplate restTemplate;
    private final AuditLogService auditLogService;
    private final UserService userService;
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP_TYPE = new ParameterizedTypeReference<>() {
    };

    @org.springframework.beans.factory.annotation.Autowired
    public AdminService(
            AuditLogService auditLogService,
            UserService userService,
            @org.springframework.beans.factory.annotation.Qualifier("supabaseRestTemplate")
            RestTemplate supabaseRestTemplate) {
        this.restTemplate = supabaseRestTemplate != null ? supabaseRestTemplate : new RestTemplate(new HttpComponentsClientHttpRequestFactory());
        this.auditLogService = auditLogService;
        this.userService = userService;
    }

    public AdminService(AuditLogService auditLogService, UserService userService) {
        this(auditLogService, userService, null);
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseKey);
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.set("Prefer", "return=representation");
        return headers;
    }

    public List<Map<String, Object>> getAllUsers() {
        String url = supabaseUrl
                + "/rest/v1/profiles?select=id,username,email,is_admin,rating,problems_solved&order=username";
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                LIST_MAP_TYPE);

        return response.getBody();
    }

    @Transactional
    public Map<String, Object> grantAdminPermission(String email) {
        // Fetch before state
        Map<String, Object> beforeUser = fetchUserByEmail(email);

        // Update the user in Supabase
        String updateUrl = supabaseUrl + "/rest/v1/profiles?email=eq." + email;
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("is_admin", true);

        HttpEntity<Map<String, Object>> updateEntity = new HttpEntity<>(updateData, createHeaders());

        ResponseEntity<List<Map<String, Object>>> patchResponse = restTemplate.exchange(
                updateUrl,
                HttpMethod.PATCH,
                updateEntity,
                LIST_MAP_TYPE);

        List<Map<String, Object>> patchedList = patchResponse.getBody();
        Map<String, Object> afterUser = (patchedList != null && !patchedList.isEmpty())
                ? patchedList.get(0)
                : fetchUserByEmail(email);

        String entityId = email;
        String username = null;
        if (afterUser != null) {
            if (afterUser.get("id") != null)
                entityId = String.valueOf(afterUser.get("id"));
            if (afterUser.get("username") != null)
                username = String.valueOf(afterUser.get("username"));
        } else if (beforeUser != null) {
            if (beforeUser.get("id") != null)
                entityId = String.valueOf(beforeUser.get("id"));
            if (beforeUser.get("username") != null)
                username = String.valueOf(beforeUser.get("username"));
        }

        // Sync local PostgreSQL database
        try {
            GrantAdminRequest req = new GrantAdminRequest();
            req.setUserId(entityId);
            req.setEmail(email);
            req.setUsername(username);
            userService.grantAdmin(req);
        } catch (Exception e) {
            log.warn("Local user sync for grantAdmin skipped: {}", e.getMessage());
        }

        // Record audit event
        auditLogService.recordEvent(
                "GRANT_ADMIN",
                "USER",
                entityId,
                auditLogService.snapshotMap(beforeUser),
                auditLogService.snapshotMap(afterUser),
                "Granted admin privileges to " + email);

        return afterUser;
    }

    @Transactional
    public Map<String, Object> revokeAdminPermission(String email) {
        // Prevent revoking super admin
        if ("krupakargurija177@gmail.com".equals(email)) {
            throw new RuntimeException("Cannot revoke super admin permissions");
        }

        // Fetch before state
        Map<String, Object> beforeUser = fetchUserByEmail(email);

        // Update the user in Supabase
        String updateUrl = supabaseUrl + "/rest/v1/profiles?email=eq." + email;
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("is_admin", false);

        HttpEntity<Map<String, Object>> updateEntity = new HttpEntity<>(updateData, createHeaders());

        ResponseEntity<List<Map<String, Object>>> patchResponse = restTemplate.exchange(
                updateUrl,
                HttpMethod.PATCH,
                updateEntity,
                LIST_MAP_TYPE);

        List<Map<String, Object>> patchedList = patchResponse.getBody();
        Map<String, Object> afterUser = (patchedList != null && !patchedList.isEmpty())
                ? patchedList.get(0)
                : fetchUserByEmail(email);

        String entityId = email;
        if (afterUser != null && afterUser.get("id") != null) {
            entityId = String.valueOf(afterUser.get("id"));
        } else if (beforeUser != null && beforeUser.get("id") != null) {
            entityId = String.valueOf(beforeUser.get("id"));
        }

        // Sync local PostgreSQL database
        try {
            userService.revokeAdmin(email);
        } catch (Exception e) {
            log.warn("Local user sync for revokeAdmin skipped: {}", e.getMessage());
        }

        // Record audit event
        auditLogService.recordEvent(
                "REVOKE_ADMIN",
                "USER",
                entityId,
                auditLogService.snapshotMap(beforeUser),
                auditLogService.snapshotMap(afterUser),
                "Revoked admin privileges from " + email);

        return afterUser;
    }

    public List<Map<String, Object>> getAllAdmins() {
        String url = supabaseUrl + "/rest/v1/profiles?select=id,username,email,is_admin&is_admin=eq.true&order=email";
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                LIST_MAP_TYPE);

        return response.getBody();
    }

    private Map<String, Object> fetchUserByEmail(String email) {
        try {
            String fetchUrl = supabaseUrl + "/rest/v1/profiles?email=eq." + email + "&select=id,username,email,is_admin,rating,problems_solved";
            HttpEntity<String> fetchEntity = new HttpEntity<>(createHeaders());

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    fetchUrl,
                    HttpMethod.GET,
                    fetchEntity,
                    LIST_MAP_TYPE);

            List<Map<String, Object>> users = response.getBody();
            return (users != null && !users.isEmpty()) ? users.get(0) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
