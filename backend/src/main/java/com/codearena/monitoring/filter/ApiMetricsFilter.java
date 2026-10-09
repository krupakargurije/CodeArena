package com.codearena.monitoring.filter;

import com.codearena.monitoring.service.ApiMetricsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that automatically measures request duration, status codes, and traffic rates.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
@RequiredArgsConstructor
public class ApiMetricsFilter extends OncePerRequestFilter {

    private final ApiMetricsService apiMetricsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long start = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationNanos = System.nanoTime() - start;
            double durationMs = durationNanos / 1_000_000.0;

            String uri = request.getRequestURI();
            String method = request.getMethod();
            int status = response.getStatus();

            // Filter out internal monitoring/health polling endpoints to prevent observer-effect latency skew
            if (uri != null && uri.startsWith("/api") 
                    && !uri.startsWith("/api/admin/monitoring") 
                    && !uri.startsWith("/api/health")
                    && !uri.startsWith("/actuator")) {
                apiMetricsService.recordRequest(method, uri, status, durationMs);
            }
        }
    }
}
