package com.codearena.common.security;

import com.codearena.profile.entity.User;
import com.codearena.profile.repository.UserRepository;
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
                User user = userRepository.findById(username)
                                .or(() -> userRepository.findByUsername(username))
                                .or(() -> userRepository.findByEmail(username))
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
