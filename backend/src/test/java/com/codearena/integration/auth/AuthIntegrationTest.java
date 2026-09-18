package com.codearena.integration.auth;

import com.codearena.TestFixtures;
import com.codearena.auth.dto.LoginRequest;
import com.codearena.auth.dto.SignupRequest;
import com.codearena.common.config.DataSeeder;
import com.codearena.profile.entity.User;
import com.codearena.profile.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private DataSeeder dataSeeder;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Signup: Valid user signup persists user with generated ID, hashed password, and returns token")
    void signup_shouldPersistUserWithGeneratedIdAndHashedPassword() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setUsername("alexcoder");
        request.setEmail("alex@example.com");
        request.setPassword("securePassword123");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value("alexcoder"))
                .andExpect(jsonPath("$.email").value("alex@example.com"))
                .andExpect(jsonPath("$.userId").isNotEmpty());

        User persisted = userRepository.findByUsername("alexcoder").orElse(null);
        assertNotNull(persisted, "User must exist in database");
        assertNotNull(persisted.getId(), "User ID must be populated and not null");
        assertNotEquals("securePassword123", persisted.getPassword(), "Password must be hashed, not plaintext");
        assertTrue(passwordEncoder.matches("securePassword123", persisted.getPassword()), "Hashed password must match input");
    }

    @Test
    @DisplayName("Signup: Duplicate username is rejected")
    void signup_shouldRejectDuplicateUsername() throws Exception {
        User existing = TestFixtures.createUser("existinguser", "first@example.com", "pass123", passwordEncoder);
        userRepository.save(existing);

        SignupRequest request = new SignupRequest();
        request.setUsername("existinguser");
        request.setEmail("second@example.com");
        request.setPassword("pass123456");

        // Current implementation throws RuntimeException which GlobalExceptionHandler maps to 500 (Contract Note: ideally 409 Conflict)
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("Username already exists")));
    }

    @Test
    @DisplayName("Signup: Duplicate email is rejected")
    void signup_shouldRejectDuplicateEmail() throws Exception {
        User existing = TestFixtures.createUser("userone", "common@example.com", "pass123", passwordEncoder);
        userRepository.save(existing);

        SignupRequest request = new SignupRequest();
        request.setUsername("usertwo");
        request.setEmail("common@example.com");
        request.setPassword("pass123456");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("Email already exists")));
    }

    @Test
    @DisplayName("Signup: Validation rejects invalid input")
    void signup_shouldRejectInvalidFields() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setUsername("ab"); // < 3 chars
        request.setEmail("not-an-email");
        request.setPassword("123"); // < 6 chars

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Login: Valid credentials authenticate successfully and return token")
    void login_shouldAuthenticateAndReturnToken() throws Exception {
        User user = TestFixtures.createUser("loginuser", "login@example.com", "mypassword", passwordEncoder);
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setUsername("loginuser");
        request.setPassword("mypassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value("loginuser"))
                .andExpect(jsonPath("$.userId").value(user.getId()));
    }

    @Test
    @DisplayName("Login: Incorrect password is rejected")
    void login_shouldRejectIncorrectPassword() throws Exception {
        User user = TestFixtures.createUser("loginuser2", "login2@example.com", "correctpass", passwordEncoder);
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setUsername("loginuser2");
        request.setPassword("wrongpass");

        // Spring Security throws BadCredentialsException -> 401 or 403
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Login: Unknown user is rejected")
    void login_shouldRejectUnknownUser() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("nonexistentuser");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }
}