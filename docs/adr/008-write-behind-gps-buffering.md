# ADR-008: Write-Behind GPS Telematics Buffering with Redis

## Status
Accepted

## Context
During transit, drivers' mobile devices stream GPS coordinates to the server over WebSockets every ~3 seconds. In a fleet with dozens of active vehicles, writing every raw GPS fix synchronously to PostgreSQL produces heavy write amplification, frequent database index updates on PostGIS geometry tables, and connection pool starvation.

## Decision
We implemented a **Write-Behind Caching Pattern** using Redis lists and scheduled batch flushes:
1. When coordinates arrive at `TrackingGateway`, they are broadcast immediately to real-time WebSocket room subscribers (`trip:{tripId}`).
2. Concurrently, the coordinates are appended (`RPUSH`) to an in-memory Redis list: `trip:locations:{tripId}`.
3. A scheduled cron service (`LocationFlusherService`) runs every 2 minutes, atomically drains accumulated coordinates from Redis using a `MULTI` / `EXEC` block (`LRANGE` + `LTRIM`), and bulk-inserts them into PostgreSQL (`trip_location_log`) using a single `createMany` query.

```text
Driver App ──(WS: 3s)──► TrackingGateway ──► Broadcast to Web/Mobile Clients
                                │
                                └──► Redis Buffer (RPUSH trip:locations:{tripId})
                                              │
                                              ▼ (Cron: 2m)
                                     LocationFlusherService
                                              │
                                              └──► Bulk INSERT into PostgreSQL
```

## Why
1. **Low Ingestion Latency**: Writing to an in-memory Redis list takes sub-millisecond time, keeping the WebSocket event loop responsive.
2. **Database Protection**: Consolidates thousands of individual single-row inserts into periodic bulk-insert queries, drastically reducing transaction overhead and disk I/O on PostgreSQL.
3. **Atomic Drain Protection**: Using Redis `MULTI/EXEC` with `lrange` and `ltrim(key, 1, 0)` ensures that coordinates arriving concurrently during a flush operation are preserved and not lost.

## Alternatives Considered
- **Direct Synchronous PostgreSQL Inserts**: Rejected because thousands of single-row inserts per minute degrades database throughput and starves connection pools.
- **Message Broker (Kafka / RabbitMQ)**: Rejected because introducing a dedicated message streaming cluster adds excessive infrastructure and maintenance overhead for the platform's current scale. Redis is already part of the stack for caching.

## Consequences
### Positive
- Prevents database connection exhaustion under active fleet telematics.
- Retains instant live map updates via WebSocket broadcasts.
- Atomically drains Redis buffers to prevent telemetry loss.

### Negative
- GPS coordinates in the Redis buffer may be delayed by up to 2 minutes before appearing in historical SQL reports.
- If Redis restarts unexpectedly without persistence (AOF/RDB) configured, coordinates buffered within the current 2-minute window could be lost.

## Implementation
- `src/modules/tracking/presentation/gateways/tracking.gateway.ts`: Ingestion & room broadcasts.
- `src/modules/tracking/application/services/location-flusher.service.ts`: `@Cron('*/2 * * * *')` atomic flush service.
- `src/modules/tracking/infrastructure/repositories/trip-location.repository.ts`: Bulk persistence via Prisma.
