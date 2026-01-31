package com.codearena.security;

import com.codearena.entity.User;
import com.codearena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

        private final UserRepository userRepository;

        @Override
        public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
                // "username" here is actually the ID (Subject) from JWT
                User user = userRepository.findById(username)
                                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

                org.slf4j.LoggerFactory.getLogger(UserDetailsServiceImpl.class)
                                .info("Loading user: {} | Roles found: {}", user.getUsername(), user.getRoles());

                return org.springframework.security.core.userdetails.User.builder()
                                .username(user.getId()) // Must match JWT Subject (UUID) for validation
                                .password(user.getPassword())
                                .authorities(user.getRoles().stream()
                                                .map(SimpleGrantedAuthority::new)
                                                .collect(Collectors.toList()))
                                .build();
        }
}
