package com.codearena.common.config;

import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.util.TimeValue;
import org.apache.hc.core5.util.Timeout;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * High-performance HTTP connection pool configuration for outbound REST communications
 * (Supabase REST API, Judge0 sandbox, external webhooks).
 *
 * <p>Features:
 * - Persistent connection pooling (avoids TCP/TLS renegotiation per request)
 * - Strict connect/socket/response timeouts to prevent thread starvation
 * - Automatic keep-alive and stale/idle connection eviction
 * </p>
 */
@Configuration
public class SupabaseHttpClientConfig {

    private static final int MAX_TOTAL_CONNECTIONS = 50;
    private static final int MAX_CONNECTIONS_PER_ROUTE = 20;
    private static final int CONNECT_TIMEOUT_SECONDS = 3;
    private static final int SOCKET_TIMEOUT_SECONDS = 5;
    private static final int RESPONSE_TIMEOUT_SECONDS = 5;
    private static final int CONNECTION_REQUEST_TIMEOUT_SECONDS = 2;
    private static final int KEEP_ALIVE_SECONDS = 60;
    private static final int IDLE_EVICTION_SECONDS = 30;

    @Bean
    public CloseableHttpClient pooledCloseableHttpClient() {
        ConnectionConfig connectionConfig = ConnectionConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(CONNECT_TIMEOUT_SECONDS))
                .setSocketTimeout(Timeout.ofSeconds(SOCKET_TIMEOUT_SECONDS))
                .setTimeToLive(TimeValue.ofMinutes(15))
                .build();

        PoolingHttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnTotal(MAX_TOTAL_CONNECTIONS)
                .setMaxConnPerRoute(MAX_CONNECTIONS_PER_ROUTE)
                .setDefaultConnectionConfig(connectionConfig)
                .build();

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofSeconds(CONNECTION_REQUEST_TIMEOUT_SECONDS))
                .setResponseTimeout(Timeout.ofSeconds(RESPONSE_TIMEOUT_SECONDS))
                .build();

        return HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .setKeepAliveStrategy((response, context) -> TimeValue.ofSeconds(KEEP_ALIVE_SECONDS))
                .evictExpiredConnections()
                .evictIdleConnections(TimeValue.ofSeconds(IDLE_EVICTION_SECONDS))
                .build();
    }

    @Bean(name = "supabaseRestTemplate")
    public RestTemplate supabaseRestTemplate(CloseableHttpClient pooledCloseableHttpClient) {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(pooledCloseableHttpClient);
        return new RestTemplate(factory);
    }
}
