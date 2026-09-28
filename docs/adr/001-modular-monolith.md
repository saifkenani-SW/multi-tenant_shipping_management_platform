# ADR-001: Modular Monolith Architecture

## Status
Accepted

## Context
A multi-tenant logistics and parcel shipping platform encompasses diverse functional areas: tenant governance, employee workforce scheduling, route topology, shipment demand rating, custody handovers, telematics, and financial invoicing. Implementing this system as independent microservices from day one introduces severe operational complexity, distributed transaction difficulties, cross-service latency, and deployment friction for a single engineering team.

## Decision
We chose a **Modular Monolith** architecture built on NestJS. Domain boundaries are organized into dedicated modules (`src/modules/*`) with internal layering (presentation, application, domain, infrastructure), communicating across modules strictly through Facades and domain events.

## Why
1. Preserves domain isolation without the deployment, networking, and distributed data consistency overhead of microservices.
2. Allows transactional consistency within module boundaries while keeping all modules in a single compile-time workspace.
3. Simplifies local development and testing: the entire stack runs in one process with Docker Compose providing database and cache backends.

## Alternatives Considered
- **Microservices Architecture**: Rejected due to high DevOps overhead, complex inter-service distributed transactions (Sagas), and network serialization penalties.
- **Traditional Layered Monolith (Package by Layer)**: Rejected because grouping code by technical type (e.g. `all controllers/`, `all services/`, `all entities/`) degrades domain cohesion and leads to tight coupling.

## Consequences
### Positive
- High internal module cohesion and clear domain boundaries.
- Straightforward debugging, refactoring, and atomic integration testing.
- Single deployment pipeline (monolithic Docker image).

### Negative
- Requires strict enforcement of linting and architecture rules to prevent developers from bypassing module facades.
- All modules scale together in the same process, preventing fine-grained compute allocation for CPU-heavy tasks (e.g. PDF generation).

## Implementation
- Root module orchestration: `src/app.module.ts`.
- Domain modules: `src/modules/*`.
- Inter-module communication rules enforced via Facade contracts.
