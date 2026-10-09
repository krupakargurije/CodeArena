package com.codearena.monitoring.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tracks active WebSocket sessions in real time via Spring STOMP messaging events.
 */
@Component
public class WebSocketActivityTracker {

    private static final Logger log = LoggerFactory.getLogger(WebSocketActivityTracker.class);

    private final AtomicInteger activeSessions = new AtomicInteger(0);

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        int count = activeSessions.incrementAndGet();
        log.debug("WebSocket session connected. Active sessions: {}", count);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        int count = activeSessions.updateAndGet(c -> Math.max(0, c - 1));
        log.debug("WebSocket session disconnected. Active sessions: {}", count);
    }

    public int getActiveSessionCount() {
        return activeSessions.get();
    }
}
