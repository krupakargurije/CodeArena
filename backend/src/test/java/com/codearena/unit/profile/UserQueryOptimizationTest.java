package com.codearena.unit.profile;

import com.codearena.common.security.UserDetailsServiceImpl;
import com.codearena.profile.entity.User;
import com.codearena.profile.repository.UserRepository;
import com.codearena.profile.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserQueryOptimizationTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("loadUserByUsername uses single join-fetch query findByIdentifierWithRoles")
    void loadUserByUsername_shouldUseSingleQuery() {
        User user = new User();
        user.setId("u-1");
        user.setUsername("alex");
        user.setEmail("alex@codearena.com");
        user.setPassword("hashedpass");
        user.setRoles(Set.of("ROLE_USER", "ROLE_ADMIN"));

        when(userRepository.findByIdentifierWithRoles("alex")).thenReturn(Optional.of(user));

        UserDetails details = userDetailsService.loadUserByUsername("alex");

        assertThat(details).isNotNull();
        assertThat(details.getUsername()).isEqualTo("u-1");
        assertThat(details.getAuthorities()).hasSize(2);

        // Verify only 1 query was executed to load user with roles
        verify(userRepository, times(1)).findByIdentifierWithRoles("alex");
        verify(userRepository, never()).findById(any());
        verify(userRepository, never()).findByUsername(any());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("getUserProfile uses single join-fetch query findByIdentifierWithRoles")
    void getUserProfile_shouldUseSingleQuery() {
        User user = new User();
        user.setId("u-2");
        user.setUsername("bob");
        user.setEmail("bob@codearena.com");
        user.setRoles(Set.of("ROLE_USER"));

        when(userRepository.findByIdentifierWithRoles("u-2")).thenReturn(Optional.of(user));

        var profile = userService.getUserProfile("u-2");

        assertThat(profile).isNotNull();
        assertThat(profile.getUsername()).isEqualTo("bob");
        verify(userRepository, times(1)).findByIdentifierWithRoles("u-2");
    }
}
