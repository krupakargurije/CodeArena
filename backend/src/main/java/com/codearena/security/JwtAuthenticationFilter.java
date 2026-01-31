package com.codearena.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import java.util.Map;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final com.codearena.service.UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String method = request.getMethod();
        String uri = request.getRequestURI();
        log.info(">>> JWT Filter: {} {} <<<", method, uri);

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.info(">>> No auth header, passing through for: {} {} <<<", method, uri);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            jwt = authHeader.substring(7);

            // Extract the User ID (Subject) from token
            username = jwtTokenProvider.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                boolean isAdmin = false; // Declare here for visibility

                // JIT User Provisioning: Ensure user exists in local DB
                try {
                    io.jsonwebtoken.Claims claims = jwtTokenProvider.extractClaim(jwt, c -> c);

                    String email = claims.get("email", String.class);
                    if (email == null) {
                        // Fallback email if missing (rare)
                        email = username + "@codearena.com";
                    }

                    // Extract custom username
                    String customUsername = null;
                    try {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> metadata = claims.get("user_metadata", java.util.Map.class);
                        if (metadata != null && metadata.containsKey("username")) {
                            customUsername = (String) metadata.get("username");
                        }
                    } catch (Exception e) {
                        log.warn("Could not extract user_metadata", e);
                    }

                    if (customUsername == null && claims.containsKey("preferred_username")) {
                        customUsername = claims.get("preferred_username", String.class);
                    }

                    // Fallback to email prefix or ID
                    if (customUsername == null || customUsername.isEmpty()) {
                        if (email.contains("@")) {
                            customUsername = email.split("@")[0];
                        } else {
                            customUsername = "User_" + username.substring(0, 6);
                        }
                    }

                    // Extract Supabase Role
                    String supabaseRole = claims.get("role", String.class);
                    log.info("JWT Claims - Subject: {}, Email: {}, Role: {}", username, email, supabaseRole);

                    isAdmin = "service_role".equals(supabaseRole);

                    // DEVELOPER OVERRIDE: Always make this user an admin
                    if ("krupakargurija177@gmail.com".equalsIgnoreCase(email)) {
                        log.info(">>> Developer Override: Granting ADMIN access to {} <<<", email);
                        isAdmin = true;
                    }

                    // Also check app_metadata for 'admin' claim if using custom claims
                    try {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> appMetadata = claims.get("app_metadata", java.util.Map.class);
                        if (appMetadata != null && Boolean.TRUE.equals(appMetadata.get("admin"))) {
                            isAdmin = true;
                        }
                    } catch (Exception e) {
                        // ignore
                    }

                    // Sync user to database
                    userService.syncUser(username, email, customUsername, isAdmin);
                } catch (Exception e) {
                    log.error("JIT Provisioning failed", e);
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtTokenProvider.validateToken(jwt, userDetails)) {
                    // Create mutable authorities list
                    java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>(
                            userDetails.getAuthorities());

                    // Force inject ADMIN role if determined by JWT/Override
                    if (isAdmin) {
                        boolean hasAdmin = authorities.stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                        if (!hasAdmin) {
                            log.info(">>> JIT injecting ROLE_ADMIN for current request <<<");
                            authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                    "ROLE_ADMIN"));
                        }
                    }

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities); // Use modified authorities
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info(">>> Authentication SUCCESS for user: {} with roles: {} <<<", username, authorities);
                } else {
                    log.warn(">>> Token validation FAILED for user: {} <<<", username);
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
