# Multi-Tenant Shipping & Logistics Management Platform

[English](README.md) | [العربية](README.ar.md)

A modular-monolith logistics and parcel management platform built with **NestJS**, **PostgreSQL** (`postgis`, `ltree`), **Prisma**, **Kysely**, and **Redis**.

The system is designed for multi-tenant shipping operations, providing domain-driven boundaries for customer consignment demands, pricing matrices, line-haul manifests, driver telematics, and financial invoicing.

---

## 🚀 Key Capabilities

- **Multi-Tenant Isolation**: Enforces tenant boundaries via request context (`AsyncLocalStorage`) and dynamic authorization visibility scopes.
- **CQRS Database Access**: Separates transactional domain mutations (Prisma) from typed, direct SQL read projections (Kysely).
- **Hierarchical & Geospatial Network**: Models facility topology using PostgreSQL `ltree` and handles coordinates, geofences, and GPS logging with PostGIS.
- **State Machine with Concurrency Protection**: Manages parcel and shipment lifecycles with Optimistic Concurrency Control (OCC) via version columns.
- **Dynamic Rating & Quotations**: Resolves zone-to-zone pricing matrices, dimensional weight, and handling fees, preserving frozen pricing snapshots upon quotation.
- **Real-Time Telematics**: Ingests high-frequency driver GPS fixes over WebSockets, buffering coordinates in Redis and flushing them periodically via scheduled bulk inserts.
- **Printable Document Generation**: Produces Code-128 and QR-code parcel labels and generates official manifests and PDF invoices via headless browser rendering.

---

## 🏛 High-Level Architecture

The platform is structured as a **Modular Monolith**. Inter-module communication occurs strictly through exported Facades and domain events, preventing direct repository or entity leaks across bounded contexts.

```text
HTTP / REST Clients                     Driver / Tracking Clients
       │                                            │
       ▼                                            ▼
Express Controllers                        WebSocket Gateway
       │                                            │
       └──────────────────┬─────────────────────────┘
                          │
                          ▼
            Application Service Layer
       ┌──────────────────┴──────────────────┐
       │                                     │
       ▼                                     ▼
Command Path (Writes)                Query Path (Reads)
       │                                     │
   Prisma ORM                       Kysely Query Builder
(Transactional Mutations & OCC)      (Typed Projections & Aggregations)
       │                                     │
       └──────────────────┬──────────────────┘
                          │
                          ▼
                 PostgreSQL Database
          (Tables + PostGIS + ltree Extensions)
```

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Core Runtime** | Node.js (v20+), NestJS 11, TypeScript, RxJS, EventEmitter2 |
| **Databases** | PostgreSQL 16 (`postgis`, `ltree`), Redis 7 (`ioredis`) |
| **Persistence (CQRS)** | Prisma ORM 7 (Writes), Kysely 0.28 (Reads via `prisma-kysely`), `pg` Pool |
| **Security & Auth** | JWT, Refresh Token Rotation (`user_session`), CASL 7, bcrypt |
| **Real-Time & Telematics** | Socket.io (`@socket.io/redis-adapter`), `@nestjs/schedule` (Cron jobs) |
| **Resilience & Protection** | Circuit Breaker (`opossum`), Rate Limiting (`@nestjs/throttler`), Helmet |
| **Document Generation** | Playwright (Headless Chromium for PDFs), `bwip-js` (Barcodes), `qrcode` (QRs) |
| **Storage & Notifications** | Local Storage Provider with temp cleanup, Firebase Admin SDK (FCM) |
| **Observability** | OpenTelemetry NodeSDK (`@prisma/instrumentation`), `nestjs-pino` |

---

## 📦 Domain Modules Overview

```text
src/
├── modules/
│   ├── tenant/              # Tenant lifecycle, operational & delivery settings
│   ├── subscription-plan/   # SaaS tiers, feature quotas, subscription history
│   ├── auth/                # JWT authentication, session rotation, profile switching
│   ├── user/ & profile/     # User identity and profile management
│   ├── employee/            # Staff assignments to organization units and role grants
│   ├── authorization/       # Tenancy-scoped roles, permissions, and PBAC policies
│   ├── global-location/     # Administrative country/city hierarchy (PostGIS)
│   ├── organization/        # Facilities tree (ltree: Region, Hub, Branch, Locker)
│   ├── customer/            # Customer shipping profiles and geocoded address book
│   ├── shipment-request/    # Consignment demand capture, zone rating, quotations
│   ├── customer-shipment/   # Shipment & Parcel aggregates, OCC, status sync, POD
│   ├── fleet/               # Vehicles, drivers, trips, transport manifests
│   ├── tracking/            # Custody events, WebSocket telematics, write-behind flusher
│   ├── billing/             # Atomic tenant invoice counters, payments, COD
│   └── notification/        # Multi-channel alerts (Push, In-App, SMS, Email)
└── packages/                # Decoupled infrastructure packages (context, pbac, tx, etc.)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **Docker & Docker Compose**: installed and running

### 2. Setup Infrastructure & Dependencies
```bash
# Clone the repository
git clone git@github.com:saifkenani-SW/multi-tenant_shipping_management_platform.git
cd multi-tenant_shipping_management_platform/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start PostgreSQL (ports 51214) and Redis (port 63791)
docker compose up -d
```

### 3. Database Migration & Initialization
```bash
# Generate Prisma Client & Kysely types
npm run db:generate

# Run schema migrations
npm run db:migrate:dev

# (Optional) Seed demo data
npm run db:seed
```

### 4. Run Application
```bash
# Start development server with live reload & OpenTelemetry
npm run start:dev

# Build & run production bundle
npm run build
npm run start:prod
```

- **REST API**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/docs`
- **WebSocket Tracking**: `ws://localhost:3000/tracking`

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run end-to-end integration tests
npm run test:e2e

# Run test coverage audit
npm run test:cov

# Verify Swagger OpenAPI specification coverage
npm run test:swagger-coverage
```

---

## 📚 Technical Documentation Index

Detailed engineering documentation and architectural decision records are maintained under `docs/` (Arabic version available at [docs/ar/](docs/ar/) and [README.ar.md](README.ar.md)):

| Document | Description |
|---|---|
| [System Architecture](docs/architecture.md) | Modular monolith structure, module boundaries, layers, and request lifecycle. |
| [Domain Model & Aggregates](docs/domain-model.md) | Aggregate boundaries, invariants, entities, and consistency rules. |
| [Shipment Lifecycle](docs/shipment-lifecycle.md) | State machine transitions, parcel status recalculation, and optimistic locking. |
| [Shipment Request & Quotation](docs/shipment-request-and-quotation.md) | Demand intake, dynamic zone pricing matrix, chargeable weight, and quotes. |
| [Multi-Tenancy Model](docs/multi-tenancy.md) | Tenant context propagation via AsyncLocalStorage, visibility scopes, and caveats. |
| [Authorization (PBAC & CASL)](docs/authorization.md) | Policy-based access control, `@Authorize`, CASL integration, and capabilities. |
| [Transaction Management](docs/transaction-management.md) | `@Transactional` decorator, container pattern, and short-lived transaction design. |
| [CQRS & Database Access](docs/cqrs.md) | Prisma write mutations, Kysely typed read projections, and pool management. |
| [Tracking & Telematics](docs/tracking.md) | Custody audit logs, WebSockets, Redis write-behind buffering, and POD. |

### Architectural Decision Records (ADRs)
- [ADR-001: Modular Monolith Architecture](docs/adr/001-modular-monolith.md)
- [ADR-002: Dual Database Access (Prisma Writes, Kysely Reads)](docs/adr/002-prisma-writes-kysely-reads.md)
- [ADR-003: Transaction Context with AsyncLocalStorage](docs/adr/003-transaction-context-with-async-local-storage.md)
- [ADR-004: Policy-Based Authorization (PBAC) with CASL](docs/adr/004-policy-based-authorization.md)
- [ADR-005: Tenant Isolation via Request Context](docs/adr/005-tenant-isolation-via-request-context.md)
- [ADR-006: Optimistic Concurrency Control (OCC)](docs/adr/006-optimistic-concurrency-control.md)
- [ADR-007: Facade-Based Inter-Module Boundaries](docs/adr/007-facade-based-inter-module-boundaries.md)
- [ADR-008: Write-Behind GPS Telematics Buffering](docs/adr/008-write-behind-gps-buffering.md)
