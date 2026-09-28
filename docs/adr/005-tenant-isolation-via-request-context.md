# ADR-005: Tenant Isolation via Request Context and AsyncLocalStorage

## Status
Accepted

## Context
In a shared-database multi-tenant SaaS application, preventing cross-tenant data access is a foundational requirement. Manually extracting `tenantId` from HTTP headers or request bodies in controllers and passing it down through service layers is error-prone; a single omitted filter can expose one tenant's sensitive shipping data to another tenant.

## Decision
We implemented a request-scoped execution context using Node.js **`AsyncLocalStorage`** (`src/packages/context`). The context intercepts incoming requests via `ContextMiddleware`, binds the active `Principal` (containing the verified `tenantId`), and makes the context globally accessible across services and visibility scopes for the lifetime of that request.

## Why
1. **Implicit Scoping**: Application services and query builders obtain the active `tenantId` reliably from `RequestContextService.getTenantIdOrThrow()`, eliminating parameter tampering from client payloads.
2. **Framework Decoupling**: Business logic and database visibility builders access security context without directly depending on the Express `Request` object.
3. **Cross-Cutting Metadata**: Automatically carries `requestId`, `correlationId`, and distributed trace identifiers for logging and OpenTelemetry tracing without manual parameter forwarding.

## Alternatives Considered
- **Separate Database Per Tenant**: Rejected due to high operational costs, database connection exhaustion, and complex schema migration management for hundreds of tenants.
- **Separate Schema Per Tenant**: Rejected because managing PostgreSQL schema migrations across dynamically growing tenants introduces significant DDL latency and connection pool fragmentation.
- **Request-Scoped NestJS Providers (`Scope.REQUEST`)**: Rejected because request-scoped providers degrade application performance by recreating dependency injection subtrees on every incoming HTTP request.

## Consequences
### Positive
- High performance: keeps NestJS services as singletons while retaining request-scoped context.
- Centralized security identity (`Principal`).
- Enables automated query scoping via visibility scope builders.

### Negative
- Asynchronous workflows (such as event handlers or scheduled cron jobs) run outside the HTTP request lifecycle and do not automatically inherit an active request context. Background tasks must handle tenant scoping explicitly.

## Implementation
- `src/packages/context/context.module.ts`: Global module registration.
- `src/packages/context/middlewares/context.middleware.ts`: Initializes ALS per request.
- `src/packages/context/services/request-context.service.ts`: Context accessor API.
