# Testing Strategy

## Purpose

This document defines the testing strategy for the Multi-Tenant Shipping Management Platform.

Testing exists to verify business correctness rather than implementation details.

The project follows the Testing Pyramid while emphasizing business-critical behavior.

---

# 1. Testing Philosophy

Tests verify business behavior.

Tests do not verify framework implementation.

Refactoring should not require rewriting tests unless business behavior changes.

---

# 2. Testing Layers

The project contains four testing layers.

- Unit Tests
- Integration Tests
- End-to-End Tests
- Architecture Tests

Each layer has a different responsibility.

---

# 3. Unit Tests

Unit Tests validate business behavior.

Unit Tests target:

- Aggregate Roots
- Entities
- Value Objects
- Domain Services
- Specifications
- Policies

Infrastructure is never tested using Unit Tests.

---

# 4. Integration Tests

Integration Tests verify collaboration between components.

Examples

Application Service

↓

Repository

↓

Prisma

↓

PostgreSQL

or

Application Service

↓

Query Service

↓

Kysely

↓

PostgreSQL

---

# 5. End-to-End Tests

End-to-End tests validate complete business workflows.

Examples

Create Shipment Request

↓

Approve Quotation

↓

Create Shipment

↓

Create Parcel

↓

Create Trip

↓

Deliver Parcel

↓

Proof Of Delivery

Entire workflows should be verified.

---

# 6. Architecture Tests

Architecture Tests verify architectural rules.

Examples

Domain must not import Prisma.

Domain must not import NestJS.

Repositories belong to Infrastructure.

DTOs must not appear in Domain.

Controllers remain thin.

These tests protect the architecture itself.

---

# 7. What Must Be Tested

Business Rules

State Machines

Domain Invariants

Aggregate Behavior

Permission Rules

Tenant Isolation

Repository Contracts

Application Use Cases

Caching

API Validation

---

# 8. What Should Not Be Tested

NestJS decorators.

Prisma internals.

TypeScript compiler.

Framework behavior.

Third-party libraries.

---

# 9. Domain Testing

Domain tests should execute without:

NestJS

Prisma

Redis

PostgreSQL

HTTP

The Domain must be independently testable.

---

# 10. Repository Testing

Repositories verify:

Persistence mapping

Transactions

Optimistic behavior

Database constraints

Repository implementations must be tested against a real PostgreSQL instance.

---

# 11. Query Service Testing

Query Services verify:

Filtering

Sorting

Pagination

Projection correctness

Tenant filtering

Caching behavior

Complex joins

---

# 12. Controller Testing

Controllers verify:

Request validation

Authorization

Response mapping

Controllers do not test business rules.

---

# 13. Caching Tests

Caching must verify:

Cache Hit

Cache Miss

TTL

Tag Invalidation

Tenant Isolation

Fallback when Redis is unavailable

Business behavior must remain identical regardless of cache availability.

---

# 14. State Machine Tests

Every valid transition must be tested.

Every invalid transition must be tested.

No transition may exist without automated verification.

---

# 15. Invariant Tests

Every invariant must have at least one positive test and one negative test.

Business rules must never rely solely on manual testing.

---

# 16. Multi-Tenant Tests

Every business use case must verify:

Tenant A cannot access Tenant B data.

Tenant isolation must be automatically tested.

---

# 17. Performance Tests

Performance tests verify:

Large pagination

Complex searches

Dashboard queries

Tracking queries

Caching effectiveness

Performance tests are executed separately from functional tests.

---

# 18. Test Data

Factories should generate test data.

Avoid manually constructing large object graphs.

Builders should be preferred.

---

# 19. Mocking Rules

Mock:

Email

SMS

Push

External APIs

File Storage

Do Not Mock:

Domain

Aggregates

Value Objects

Specifications

Policies

---

# 20. Definition of Tested

A feature is considered tested only if:

Business Rules verified.

State Machine verified.

Invariants verified.

Tenant isolation verified.

API verified.

Caching verified.

Database verified.

No regression introduced.

---

# Final Principle

Tests exist to protect business behavior.

Business behavior is the most valuable asset of the system.

Every critical business rule should be protected by automated tests.