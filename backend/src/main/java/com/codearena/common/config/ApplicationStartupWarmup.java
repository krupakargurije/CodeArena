package com.codearena.common.config;

import com.codearena.problems.repository.ProblemRepository;
import com.codearena.profile.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.CompletableFuture;

/**
 * Pre-warms database connection pools, JPA session factories, and outbound HTTP connection pools
 * immediately after application startup to eliminate initial cold-start latency spikes.
 */
@Component
@RequiredArgsConstructor
public class ApplicationStartupWarmup {

    private static final Logger log = LoggerFactory.getLogger(ApplicationStartupWarmup.class);

    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    @Qualifier("supabaseRestTemplate")
    private final RestTemplate supabaseRestTemplate;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.key:}")
    private String supabaseKey;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        CompletableFuture.runAsync(() -> {
            log.info("Starting background pre-warm of database and HTTP connection pools...");
            long start = System.currentTimeMillis();

            // 1. Warm HikariCP & Hibernate JPA entity metamodel
            try {
                long problemCount = problemRepository.count();
                long userCount = userRepository.count();
                log.debug("Warmup JPA repositories: {} problems, {} users", problemCount, userCount);
            } catch (Exception e) {
                log.warn("Warmup DB query failed: {}", e.getMessage());
            }

            // 2. Warm outbound Supabase HTTP pool & SSL/TLS connection
            if (supabaseRestTemplate != null && supabaseUrl != null && !supabaseUrl.isBlank() && supabaseKey != null && !supabaseKey.isBlank()) {
                try {
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("apikey", supabaseKey);
                    headers.set("Authorization", "Bearer " + supabaseKey);
                    HttpEntity<Void> entity = new HttpEntity<>(headers);

                    supabaseRestTemplate.exchange(
                            supabaseUrl + "/rest/v1/profiles?select=id&limit=1",
                            HttpMethod.GET,
                            entity,
                            String.class
                    );
                    log.debug("Warmup Supabase HTTP connection pool established.");
                } catch (Exception e) {
                    log.warn("Warmup Supabase HTTP ping failed: {}", e.getMessage());
                }
            }

            long elapsed = System.currentTimeMillis() - start;
            log.info("Connection pool warmup completed in {}ms. Ready for low-latency traffic.", elapsed);
        });
    }
}
