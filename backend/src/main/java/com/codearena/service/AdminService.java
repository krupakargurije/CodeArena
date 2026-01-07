package com.codearena.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    // Use HttpComponentsClientHttpRequestFactory to support PATCH method
    private final RestTemplate restTemplate;

    public AdminService() {
        this.restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
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

        ResponseEntity<List> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                List.class);

        return response.getBody();
    }

    public Map<String, Object> grantAdminPermission(String email) {
        // First, update the user
        String updateUrl = supabaseUrl + "/rest/v1/profiles?email=eq." + email;

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("is_admin", true);

        HttpEntity<Map<String, Object>> updateEntity = new HttpEntity<>(updateData, createHeaders());

        restTemplate.exchange(
                updateUrl,
                HttpMethod.PATCH,
                updateEntity,
                Void.class);

        // Then fetch the updated user
        String fetchUrl = supabaseUrl + "/rest/v1/profiles?email=eq." + email + "&select=*";
        HttpEntity<String> fetchEntity = new HttpEntity<>(createHeaders());

        ResponseEntity<List> response = restTemplate.exchange(
                fetchUrl,
                HttpMethod.GET,
                fetchEntity,
                List.class);

        List<Map<String, Object>> users = response.getBody();
        return users != null && !users.isEmpty() ? users.get(0) : null;
    }

    public Map<String, Object> revokeAdminPermission(String email) {
        // Prevent revoking super admin
        if ("krupakargurija177@gmail.com".equals(email)) {
            throw new RuntimeException("Cannot revoke super admin permissions");
        }

        // Update the user
        String updateUrl = supabaseUrl + "/rest/v1/profiles?email=eq." + email;

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("is_admin", false);

        HttpEntity<Map<String, Object>> updateEntity = new HttpEntity<>(updateData, createHeaders());

        restTemplate.exchange(
                updateUrl,
                HttpMethod.PATCH,
                updateEntity,
                Void.class);

        // Fetch the updated user
        String fetchUrl = supabaseUrl + "/rest/v1/profiles?email=eq." + email + "&select=*";
        HttpEntity<String> fetchEntity = new HttpEntity<>(createHeaders());

        ResponseEntity<List> response = restTemplate.exchange(
                fetchUrl,
                HttpMethod.GET,
                fetchEntity,
                List.class);

        List<Map<String, Object>> users = response.getBody();
        return users != null && !users.isEmpty() ? users.get(0) : null;
    }

    public List<Map<String, Object>> getAllAdmins() {
        String url = supabaseUrl + "/rest/v1/profiles?select=id,username,email,is_admin&is_admin=eq.true&order=email";
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());

        ResponseEntity<List> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                List.class);

        return response.getBody();
    }
}
