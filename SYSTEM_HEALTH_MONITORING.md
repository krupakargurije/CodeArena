# CodeArena System Health & Monitoring — Production Architecture

This document provides a comprehensive overview of the **System Health & Observability** subsystem in CodeArena.

---

## 1. Overview & Architecture

CodeArena's monitoring system provides administrators with visibility into:
1. **Infrastructure & Service Probes**: Spring Boot runtime, Supabase PostgreSQL, Judge0 execution sandbox, and WebSocket STOMP message broker.
2. **Judge0 Operations Center**: Real-time verdict distributions (AC, WA, TLE, RE, CE, Platform Errors), execution queue taxonomy, and language distribution.
3. **Submission Analytics**: Aggregated time-series buckets (`1h`, `24h`, `7d`, `30d`, `all`), throughput, acceptance rates, and execution latencies.
4. **API Gateway & Runtime Performance**: In-flight rolling reservoir sampling for p50, p95, p99, and max latencies, HTTP status code distribution (2xx, 4xx, 5xx), JVM heap memory utilization, and slow endpoint rankings.
5. **Real-time Activity**: Active WebSocket sessions (via Spring Session Events), live 1v1 battle rooms, running contests, and requests/sec throughput.
6. **Incident Lifecycle Management**: Automated incident evaluation, deterministic key deduplication, occurrence count tracking, auto-recovery on normal health, and operator Acknowledge/Resolve workflows.

---

## 2. API Endpoints & Security

All monitoring endpoints are strictly secured and require administrative privileges (`ROLE_ADMIN`) both via Spring Security Filter Chain and `@PreAuthorize("hasRole('ADMIN')")`.

| Method | Endpoint Path | Description | Authorization |
|---|---|---|---|
| `GET` | `/api/admin/monitoring/overview` | High-level system KPI overview, overall status, and active incidents | `ROLE_ADMIN` |
| `GET` | `/api/admin/monitoring/services` | Detailed component health probes (DB, Judge0, JVM, WebSocket) | `ROLE_ADMIN` |
| `GET` | `/api/admin/monitoring/judge0` | Judge0 operational metrics, verdict error taxonomy, and language usage | `ROLE_ADMIN` |
| `GET` | `/api/admin/monitoring/submissions?range={1h\|24h\|7d\|30d\|all}` | Aggregated time-series submission buckets, success rates, latencies | `ROLE_ADMIN` |
| `GET` | `/api/admin/monitoring/performance` | p50/p95/p99 latency percentiles, status code breakdown, JVM heap, endpoint profiles | `ROLE_ADMIN` |
| `GET` | `/api/admin/monitoring/activity` | Live STOMP connections, active matchmaking/battle rooms, contest counts | `ROLE_ADMIN` |
| `GET` | `/api/admin/monitoring/incidents?status={ACTIVE\|RESOLVED\|ALL}&page=0&size=20` | Paginated incident logs with filters | `ROLE_ADMIN` |
| `POST` | `/api/admin/monitoring/incidents/{id}/acknowledge` | Acknowledge active incident with optional investigation note | `ROLE_ADMIN` |
| `POST` | `/api/admin/monitoring/incidents/{id}/resolve` | Mark incident resolved with root cause resolution note | `ROLE_ADMIN` |
| `GET` | `/actuator/health` | Public basic health ping (status UP/DOWN) | Public |
| `GET` | `/actuator/**` | Detailed metrics and actuator data | `ROLE_ADMIN` |

---

## 3. Metrics, Sources of Truth & Formulas

| Metric | Source of Truth | Calculation / Aggregation Method |
|---|---|---|
| **Database Probe** | PostgreSQL JDBC | Executes `SELECT 1` with a strict `2000ms` query timeout. Results cached for 10 seconds. |
| **Judge0 Probe** | Judge0 `/about` or `/workers` endpoint | HTTP GET request with a strict `3000ms` socket timeout. Results cached for 10 seconds. |
| **API Latency Percentiles (p50, p95, p99)** | `ApiMetricsFilter` & `ApiMetricsService` | Reservoir sampling (sliding window of last 1,000 requests) with sorted percentiles: `p50` (50th index), `p95` (95th index), `p99` (99th index). |
| **API Throughput (req/s)** | `ApiMetricsService` | Exponentially weighted moving average of total HTTP requests over uptime. |
| **WebSocket Active Sessions** | `WebSocketActivityTracker` | Atomic counter incremented on Spring `SessionConnectEvent` and decremented on `SessionDisconnectEvent`. |
| **Submission Volume & Analytics** | Supabase `submissions` table | SQL aggregate queries grouped by `status` and `language_id`, bucketing timestamps into evenly spaced intervals (`1h` = 5min buckets, `24h` = 1hr buckets, `7d` = 12hr buckets, `30d` = 1day buckets). |
| **JVM Memory Utilization** | `Runtime.getRuntime()` | `used = totalMemory() - freeMemory()`, `max = maxMemory()`, `committed = totalMemory()`. |

---

## 4. Operational Incident Triggers & Deduplication

### Automated Incident Triggers
The `IncidentService` automatically scans telemetry and evaluates the following triggers:
1. **`DATABASE_DOWN`** (`CRITICAL`): Database connectivity check failed or query timed out.
2. **`JUDGE0_DOWN`** (`CRITICAL`): Judge0 sandbox unreachable or timed out (>3000ms).
3. **`HIGH_HTTP_5XX`** (`WARNING`): 5xx server error rate exceeds 5.0% over recent traffic window.
4. **`HIGH_API_LATENCY`** (`WARNING`): p95 API response time exceeds 2,500ms.
5. **`HIGH_SUBMISSION_FAILURES`** (`WARNING`): Platform/sandbox execution failure rate exceeds 15.0%.

### Deduplication & Auto-Recovery
- Each incident type has a deterministic `incidentKey` (e.g., `JUDGE0_DOWN`).
- When an alert condition triggers, `IncidentService.recordIncident()` checks if an active incident with that key already exists (`status = 'OPEN'` or `'ACKNOWLEDGED'`).
  - If active: updates `lastSeenAt` and increments `occurrenceCount`.
  - If new: creates a new incident record in `OPEN` state.
- When an active incident's underlying health check returns to normal, `IncidentService.autoResolveIfActive()` marks the incident `RESOLVED` with an automated resolution timestamp and note.

---

## 5. Database Schema & Supabase RLS

The `incidents` table persists all operational events:

```sql
CREATE TABLE IF NOT EXISTS incidents (
    id BIGSERIAL PRIMARY KEY,
    incident_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    component VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    occurrence_count INT NOT NULL DEFAULT 1,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_key_status ON incidents(incident_key, status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- Enable Supabase Row-Level Security (RLS)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated administrators to query and update incidents
CREATE POLICY "Admins can view and manage incidents"
    ON incidents FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = TRUE
        )
    );
```

---

## 6. Production Troubleshooting Runbook

### Case 1: Judge0 Sandbox Is DOWN or DEGRADED
- **Symptom**: Overview card shows Judge0 `DOWN`, red alert banner in Judge0 Operations Center.
- **Troubleshooting**:
  1. Check if Judge0 worker containers or external Judge0 API service (RapidAPI / Self-hosted) are responsive.
  2. Test health probe manually: `curl -m 3 http://localhost:2358/about` (or configured Judge0 URL).
  3. Verify `code-execution.timeout` configuration in Spring Boot.
  4. If sandbox worker queue is backed up, restart Judge0 worker daemon.

### Case 2: Elevated HTTP 5xx Rate
- **Symptom**: `HIGH_HTTP_5XX` incident opened; 5xx error rate card shows >5%.
- **Troubleshooting**:
  1. Navigate to **API & Runtime Performance** tab in the Monitoring Dashboard.
  2. Inspect the **Endpoint Performance Profiles** table and sort by `5xx Errors`.
  3. Identify the failing route (e.g., `/api/problems/{id}/submit` or `/api/rooms/{id}`).
  4. Inspect backend logs for uncaught exceptions or database lock contentions.

### Case 3: High WebSocket Ingress / Disconnect Spikes
- **Symptom**: WebSocket active sessions count drops unexpectedly during live contest.
- **Troubleshooting**:
  1. Navigate to **Live Activity & STOMP** tab.
  2. Check current STOMP connection counts and battle room states.
  3. Verify reverse proxy (Nginx / Cloudflare / Render) WebSocket timeout and keep-alive headers (`Upgrade`, `Connection`).
