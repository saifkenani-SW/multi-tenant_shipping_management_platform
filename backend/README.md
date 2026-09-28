# Multi-Tenant Shipping & Logistics Management Platform — Backend

Backend service implementation for the Multi-Tenant Shipping & Logistics Management Platform built with **NestJS**, **PostgreSQL** (`postgis`, `ltree`), **Prisma**, **Kysely**, and **Redis**.

For the root documentation and technical architecture overview, see the [Root Repository README](../README.md) or [الدليل الرئيسي بالعربية](../README.ar.md).

---

## 🛠 Tech Stack Overview

- **Runtime & Framework**: Node.js (v20+), NestJS 11, TypeScript
- **Databases**: PostgreSQL 16 (`postgis`, `ltree`), Redis 7
- **CQRS Persistence**: Prisma ORM (Writes), Kysely Query Builder (Reads via `prisma-kysely`)
- **Security & Authorization**: Passport JWT, Session Rotation, CASL 7 Policy-Based Access Control (`packages/authorization`)
- **Real-Time Telematics**: Socket.io (`@socket.io/redis-adapter`), `@nestjs/schedule`
- **Resilience**: Circuit Breakers (`opossum`), Rate Limiting (`@nestjs/throttler`)
- **Document Generation**: Playwright Headless Chromium (`packages/pdf-generator`), `bwip-js` & `qrcode` (`packages/label-generator`)
- **Observability**: OpenTelemetry NodeSDK (`@prisma/instrumentation`), `nestjs-pino`

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```
*(Default Docker configuration connects to PostgreSQL on port `51214` and Redis on `63791`)*

### 3. Spin Up Docker Containers
```bash
docker compose up -d
```

### 4. Database Setup & Migrations
```bash
# Generate Prisma Client & Kysely types
npm run db:generate

# Apply migrations
npm run db:migrate:dev

# (Optional) Seed demo data
npm run db:seed
```

### 5. Start Server
```bash
# Development watch mode with OpenTelemetry preloaded
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```

API available at: `http://localhost:3000`  
Swagger docs at: `http://localhost:3000/docs`  
WebSocket gateway: `ws://localhost:3000/tracking`

---

## 🧪 Testing

```bash
npm run test                  # Unit tests
npm run test:e2e              # E2E integration tests
npm run test:cov              # Coverage report
npm run test:swagger-coverage # OpenAPI spec coverage
```

---

## 📚 Deep Technical Documentation

Comprehensive architecture specifications, domain models, lifecycles, and ADRs are located under the [`docs/`](../docs/) directory:

- [System Architecture](../docs/architecture.md)
- [Domain Model & Aggregates](../docs/domain-model.md)
- [Shipment Lifecycle](../docs/shipment-lifecycle.md)
- [Shipment Request & Quotation](../docs/shipment-request-and-quotation.md)
- [Multi-Tenancy Architecture](../docs/multi-tenancy.md)
- [Authorization (PBAC & CASL)](../docs/authorization.md)
- [Transaction Management](../docs/transaction-management.md)
- [CQRS & Database Access](../docs/cqrs.md)
- [Tracking & Telematics](../docs/tracking.md)
- [Architectural Decision Records (ADRs)](../docs/adr/)
