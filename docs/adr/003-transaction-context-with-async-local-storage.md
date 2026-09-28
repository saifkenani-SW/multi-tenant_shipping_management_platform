# ADR-003: Transaction Context Management with AsyncLocalStorage

## Status
Accepted

## Context
When orchestrating operations that span multiple repositories (such as creating a customer shipment and inserting multiple parcel rows), all writes must commit or roll back atomically inside a database transaction. In typical NestJS applications, achieving this requires:
1. Manually passing a Prisma transaction client (`tx`) as an argument through every service and repository method, polluting domain interfaces with database details; or
2. Injecting `PrismaService` into application services and writing transactional orchestration directly in the service, breaking Clean Architecture boundaries.

## Decision
We implemented a dedicated transaction package (`src/packages/transaction`) that tracks active transaction clients using Node.js **`AsyncLocalStorage`** and exposes a declarative **`@Transactional()`** method decorator.

## Why
1. **Zero ORM Leakage in Services**: Application services do not import or inject `PrismaService`. They remain clean and depend only on repository abstractions.
2. **Transparent Repository Participation**: Repositories inject `TransactionalPrismaService`. When called within a `@Transactional()` scope, the repository automatically obtains the active transaction client without requiring `tx` to be passed as a method parameter.
3. **Re-entrant Nested Transactions**: If a method decorated with `@Transactional()` calls another method decorated with `@Transactional()`, the inner method automatically participates in the existing transaction instead of opening a conflicting nested transaction.

## Alternatives Considered
- **Parameter Passing (`tx: Prisma.TransactionClient`)**: Rejected because it pollutes clean interfaces and couples all application layers to Prisma.
- **Unit of Work Pattern with Custom Identity Map**: Rejected due to high implementation complexity and memory overhead in a TypeScript/Node.js environment.

## Consequences
### Positive
- Clean, decoupled application service code.
- Automatic rollbacks on unhandled exceptions and automatic commits on success.
- Transparent nested transaction reuse.

### Negative
- Relies on global container initialization (`TransactionContainer.setApp(app)`) in `main.ts`.
- In isolated unit test environments (`*.spec.ts`), developers must mock `TransactionContainer` in `beforeEach` to simulate transactional execution without starting the full NestJS application.

## Implementation
- `src/packages/transaction/context/transaction.context.ts`: `AsyncLocalStorage` store.
- `src/packages/transaction/decorators/transactional.decorator.ts`: `@Transactional()` decorator.
- `src/packages/transaction/container/transaction.container.ts`: Registry for resolving `TransactionFacade`.
- `src/packages/transaction/services/transactional-prisma.service.ts`: Transparent client provider.
