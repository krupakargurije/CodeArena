package com.codearena.integration.admin;

import com.codearena.TestFixtures;
import com.codearena.admin.dto.GrantAdminRequest;
import com.codearena.common.config.DataSeeder;
import com.codearena.common.security.JwtTokenProvider;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private DataSeeder dataSeeder;

    private User normalUser;
    private String normalUserToken;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
        normalUser = TestFixtures.createUser("normaluser", "normal@example.com", "pass123", passwordEncoder, "ROLE_USER");
        userRepository.save(normalUser);
        normalUserToken = TestFixtures.generateTokenForUser(normalUser, jwtTokenProvider);
    }

    @Test
    @DisplayName("Admin Security: Anonymous user MUST be rejected from grant-admin")
    void grantAdmin_shouldRejectAnonymousUser() throws Exception {
        GrantAdminRequest request = new GrantAdminRequest();
        request.setEmail("target@example.com");

        mockMvc.perform(post("/api/admin/users/grant-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Admin Security: Normal user MUST NOT be able to grant admin privileges (Privilege Escalation)")
    void grantAdmin_shouldRejectNormalUser() throws Exception {
        GrantAdminRequest request = new GrantAdminRequest();
        request.setEmail("normal@example.com");

        mockMvc.perform(post("/api/admin/users/grant-admin")
                        .header("Authorization", "Bearer " + normalUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}