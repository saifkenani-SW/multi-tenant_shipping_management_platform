# ADR-006: Optimistic Concurrency Control (OCC) for Logistics Entities

## Status
Accepted

## Context
In a fast-paced logistics environment, shipments and parcels undergo rapid state transitions driven by multiple actors: sorting facility staff scanning barcodes, dispatchers loading trucks, drivers updating route milestones, and automated status recalculations. When two processes read and mutate the same record concurrently, standard database updates can silently overwrite one change with another (lost update problem).

## Decision
We implemented **Optimistic Concurrency Control (OCC)** using a numeric `version` column on high-contention logistics entities (`customer_shipment` and `parcel`). State mutations are written via atomic conditional updates:
```typescript
const result = await this.prisma.client.customer_shipment.updateMany({
  where: { id: shipmentId, version: currentVersion },
  data: { status: newStatus, version: { increment: 1 } },
});

if (result.count === 0) {
  throw new ConflictException(
    'Shipment was modified by another process. Please retry.',
  );
}
```

## Why
1. **No Database Row Locking**: Pessimistic locking (`SELECT FOR UPDATE`) holds database row locks across transaction boundaries, creating latency and deadlock risks under high concurrent scanning.
2. **Deterministic Conflict Handling**: If a version conflict occurs, the operation fails fast with a `ConflictException`, allowing the client or caller to refresh the aggregate and retry cleanly.
3. **Database Portability**: Numeric version incrementing requires no specialized database features and works consistently across Prisma and PostgreSQL.

## Alternatives Considered
- **Pessimistic Locking (`SELECT FOR UPDATE`)**: Rejected because locking records while waiting for application validation or external I/O degrades throughput and increases database deadlock frequency.
- **Last-Write-Wins (Unversioned Updates)**: Rejected because it causes lost updates (e.g. overwriting a `DELIVERED` status with an out-of-order `IN_TRANSIT` scan).

## Consequences
### Positive
- High read and write throughput without long-held database lock contention.
- Guarantees state transition integrity across concurrent barcode scans.
- Enforced directly at the repository persistence boundary.

### Negative
- Callers must handle `ConflictException` and implement retry policies where automated retries are required.

## Implementation
- Entity version tracking: `src/modules/customer-shipment/shipment/domain/entities/customer-shipment.entity.ts`.
- Conditional update and version increment: `src/modules/customer-shipment/shipment/infrastructure/repositories/shipment.command.repository.ts`.
