# Transaction Management Architecture

This document describes how database transactions are managed across application services and repositories without leaking ORM infrastructure dependencies into domain logic.

---

## 1. Architectural Goal: Infrastructure Isolation

In Clean Architecture and Domain-Driven Design, application services coordinate business workflows and should not directly depend on ORM-specific transaction objects (such as `PrismaClient.$transaction` or raw SQL handles). 

The platform addresses this via `src/packages/transaction/`, which uses the **Container Pattern** and **`AsyncLocalStorage`** to decouple transaction boundaries from repository implementations.

```mermaid
graph TD
    Service[Application Service] -->|Decorated with| Decorator["@Transactional()"]
    Decorator --> Facade[TransactionFacade via TransactionContainer]
    Facade --> PrismaTx["PrismaService.$transaction()"]
    PrismaTx --> Context["TransactionContext (AsyncLocalStorage)"]
    Context --> TxService[TransactionalPrismaService]
    Repo[Command Repository] -->|Injects| TxService
    TxService -->|Has Active Tx?| ActiveClient[Active Transaction Client]
    TxService -->|No Active Tx?| RegularClient[Regular Connection Pool]
```

---

## 2. Key Components (`packages/transaction`)

### 2.1 `@Transactional()` Method Decorator
Marks an application service method as an atomic transaction boundary.
- If an active transaction already exists in the current call stack, the decorator reuses the existing client (nested transaction reuse).
- If no transaction exists, it requests a new interactive transaction from `TransactionFacade`.
- Commits automatically if the method completes; rolls back automatically if an unhandled exception is thrown.

```typescript
@Injectable()
export class ShipmentCommandService {
  @Transactional()
  private async persistShipment(
    tenantId: string,
    dto: CreateShipmentDto,
    prepared: PreparedParcel[],
    totalChargeableWeightKg: number,
  ): Promise<{ id: string }> {
    // Both repository calls execute within the SAME database transaction
    const shipment = await this.commandRepository.create(...);
    for (const parcel of prepared) {
      await this.parcelCommandRepository.create(...);
    }
    return shipment;
  }
}
```

### 2.2 `TransactionContext` (`AsyncLocalStorage`)
Tracks the active Prisma transaction client (`tx`) for the duration of the asynchronous execution chain. Repositories do not need `tx` passed down through their method signatures.

### 2.3 `TransactionalPrismaService`
A custom proxy wrapper injected into command repositories:
```typescript
@Injectable()
export class TransactionalPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  get client(): PrismaClient {
    const tx = TransactionContext.getClient();
    return (tx as PrismaClient) ?? this.prisma;
  }
}
```
If called within a `@Transactional()` scope, `client` returns the active transactional Prisma client. Otherwise, it transparently falls back to the standard `PrismaService` pool.

### 2.4 `TransactionContainer`
A service locator pattern initialized during application startup in `main.ts` (`TransactionContainer.setApp(app)`). This allows the `@Transactional()` decorator to resolve `TransactionFacade` without requiring services to inject `PrismaService` into their constructors.

---

## 3. Design Rule: Short-Lived Transactions & Outside Preparation

A core architectural rule enforced in the codebase is **keeping transactions as short as possible** to minimize database connection hold time and reduce lock contention.

### Example: Shipment Creation Workflow (`ShipmentCommandService.createShipment`)

```mermaid
sequenceDiagram
    autonumber
    participant Service as ShipmentCommandService
    participant OrgFacade as OrganizationFacade
    participant TenantFacade as TenantFacade
    participant LabelGen as LabelGeneratorService
    participant PDFGen as PdfGeneratorService (Playwright)
    participant Storage as LocalStorageProvider
    participant DB as PostgreSQL (@Transactional)

    Note over Service: PHASE 1: Validation & Heavy I/O (OUTSIDE Transaction)
    Service->>OrgFacade: Validate organization units
    Service->>TenantFacade: Retrieve pricing & operational settings
    loop For each parcel in DTO
        Service->>LabelGen: Generate HTML Label (Barcodes/QRs)
        Service->>PDFGen: Render PDF Buffer in Headless Chromium
        Service->>Storage: Save PDF to disk (storage_key)
    end

    Note over Service: PHASE 2: Atomic Write (INSIDE Transaction)
    Service->>DB: Begin Transaction
    DB->>DB: INSERT customer_shipment
    DB->>DB: INSERT parcels (linking storage keys)
    DB->>DB: Update shipment_request status to CONVERTED
    DB->>Service: Commit Transaction
```

**Why this matters**:
- Headless browser rendering via Playwright and disk/cloud file uploads involve variable I/O latency.
- If these operations were executed inside an open database transaction, database connection pool exhaustion would occur under moderate concurrency.
- By preparing labels and files upfront, the database transaction opens only for the microsecond-level write phase.
