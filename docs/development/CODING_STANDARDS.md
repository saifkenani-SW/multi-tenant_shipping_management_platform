# Coding Standards

## Purpose

This document defines the mandatory coding standards for the Multi-Tenant Shipping Management Platform.

These standards ensure consistency, maintainability, scalability, and architectural correctness across the entire codebase.

Every contributor and AI Agent must follow these standards.

Violating these rules is considered an architectural defect.

---

# 1. General Principles

The project prioritizes:

- Business correctness over implementation speed.
- Readability over clever code.
- Explicit behavior over hidden magic.
- Simplicity over unnecessary abstraction.
- Maintainability over short-term optimization.
- Consistency over personal preference.

Always write code for the next developer.

---

# 2. Programming Language

The backend is implemented using:

- TypeScript
- NestJS
- Prisma ORM

Strict TypeScript mode is mandatory.

---

# 3. Clean Architecture

The project follows Clean Architecture.

Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

Dependencies always point inward.

Domain must not depend on NestJS, Prisma, HTTP, or Infrastructure.

---

# 4. Domain Rules

Business logic belongs exclusively to the Domain Layer.

The following are prohibited:

- Business logic inside Controllers.
- Business logic inside DTOs.
- Business logic inside Repositories.
- Business logic inside Prisma Models.
- Business logic inside Guards.
- Business logic inside Pipes.

---

# 5. Module Rules

Every module owns:

- Domain
- Application
- Infrastructure
- Presentation

Modules communicate through public interfaces only.

Never access another module's internals.

---

# 6. Aggregate Rules

Aggregate Roots own consistency.

External code must never mutate aggregate state directly.

State changes must occur through aggregate methods.

Aggregates protect their own invariants.

---

# 7. Entity Rules

Entities:

- Have identity.
- Encapsulate behavior.
- Never expose mutable state unnecessarily.

Avoid anemic domain models.

---

# 8. Value Object Rules

Use Value Objects whenever identity is unnecessary.

Examples:

- Money
- Weight
- Dimensions
- Tracking Number
- Phone Number
- Email

Value Objects must be immutable.

---

# 9. Repository Rules

Repositories belong to the Domain.

Repositories are interfaces.

Infrastructure implements them.

Repositories return Domain objects.

Repositories never return Prisma models.

---

# 10. Application Services

Application Services orchestrate use cases.

Responsibilities:

- Load aggregates.
- Coordinate repositories.
- Execute transactions.
- Publish domain events.

Application Services must not implement business rules.

---

# 11. Controllers

Controllers must remain thin.

Responsibilities:

- Receive HTTP requests.
- Validate DTOs.
- Call Application Services.
- Return responses.

Controllers must never:

- Access Prisma.
- Implement business rules.
- Manage transactions.

---

# 12. DTO Rules

DTOs exist only in the Presentation Layer.

DTOs:

- Validate input.
- Serialize output.

DTOs are not Domain objects.

DTOs are never persisted.

---

# 13. Validation

Input validation occurs before entering the Domain.

Business validation belongs to the Domain.

Never mix both.

---

# 14. Transactions

Transactions belong to the Application Layer.

One business use case should normally execute inside one transaction.

Never start transactions inside Domain objects.

---

# 15. Dependency Injection

Use constructor injection exclusively.

Avoid property injection.

Dependencies must be explicit.

---

# 16. Error Handling

Separate errors into:

- Validation Exceptions
- Business Exceptions
- Infrastructure Exceptions

Never expose infrastructure errors directly to clients.

---

# 17. Logging

Log meaningful business events.

Do not log sensitive information.

Logs should help diagnose production issues.

---

# 18. Naming Conventions

Classes:

- PascalCase

Interfaces:

- PascalCase

Methods:

- camelCase

Variables:

- camelCase

Constants:

- UPPER_SNAKE_CASE

Files:

- kebab-case

Folders:

- kebab-case

Use meaningful names.

Avoid abbreviations unless universally understood.

---

# 19. Folder Organization

Group code by business capability.

Never group code by technical type only.

Prefer:

shipment-request/

parcel/

trip/

Instead of:

controllers/

services/

repositories/

at the project root.

---

# 20. Async Programming

Use async/await.

Avoid Promise chains.

Avoid blocking operations.

Never ignore rejected promises.

---

# 21. Immutability

Prefer immutable objects.

Avoid mutable shared state.

Do not modify input parameters.

---

# 22. Code Duplication

Duplicate knowledge is prohibited.

Extract reusable business behavior.

Do not create generic abstractions prematurely.

---

# 23. Comments

Code should explain "how".

Comments explain "why".

Avoid redundant comments.

Keep comments synchronized with the implementation.

---

# 24. SOLID

Follow SOLID principles.

Do not force abstractions where unnecessary.

Favor composition over inheritance.

---

# 25. Performance

Optimize only after identifying bottlenecks.

Avoid premature optimization.

Write correct code before optimizing.

---

# 26. Security

Never trust client input.

Always validate authorization.

Always enforce tenant isolation.

Never expose internal identifiers unnecessarily.

Never log secrets.

---

# 27. Prisma Rules

Prisma is an Infrastructure concern.

Never import Prisma Client into the Domain Layer.

Never expose Prisma models outside Infrastructure.

Never embed business logic inside Prisma middleware.

---

# 28. Multi-Tenancy

Every business query must execute within the authenticated tenant context.

Never disable tenant filtering.

Platform-level operations are the only exception.

---

# 29. Testing

Every business use case must be testable.

Critical business rules require automated tests.

Write tests for behavior, not implementation details.

---

# 30. Code Review Checklist

Before considering code complete, verify:

- Business rules preserved.
- Architecture respected.
- No tenant isolation violations.
- No business logic outside Domain.
- Aggregate invariants protected.
- State Machine respected.
- Transactions correctly scoped.
- Tests added or updated.
- Naming follows conventions.
- No unnecessary abstractions introduced.

---

# Final Rule

If implementation conflicts with:

- SRS
- Project Context
- Architecture
- DDD
- State Machines
- Domain Invariants

The implementation is incorrect.

Always preserve the architecture before writing more code.