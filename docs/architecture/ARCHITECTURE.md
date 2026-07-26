# Architecture

## 1. Architecture Style

The project follows a Modular Monolith architecture.

The system is deployed as a single application while maintaining strict logical separation between business modules.

Every module owns its own domain model, application services, infrastructure implementations, and presentation layer.

Modules communicate through explicit interfaces and application services.

Direct coupling between modules is prohibited.

---

# 2. Architectural Principles

The architecture is based on:

- Domain-Driven Design (DDD)
- Clean Architecture
- SOLID Principles
- Explicit Dependencies
- High Cohesion
- Low Coupling

Business correctness always has higher priority than framework convenience.

---

# 3. Layered Architecture

Each module follows the same internal structure.

Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

Only inward dependencies are allowed.

Outer layers may depend on inner layers.

Inner layers must never depend on outer layers.

---

# 4. Module Structure

Every business capability belongs to exactly one module.

Modules encapsulate:

- Domain Model
- Application Services
- Infrastructure
- API

Modules must not expose internal implementation details.

Only public interfaces may be consumed by other modules.

---

# 5. Domain Layer

The Domain Layer contains the business knowledge.

It may contain:

- Aggregate Roots
- Entities
- Value Objects
- Domain Services
- Domain Events
- Specifications
- Policies
- Repository Interfaces

The Domain Layer must never depend on:

- Prisma
- NestJS
- HTTP
- Controllers
- DTOs
- Database models
- External services

The Domain Layer must remain framework-independent.

---

# 6. Application Layer

The Application Layer coordinates business use cases.

Responsibilities include:

- Executing use cases
- Coordinating repositories
- Managing transactions
- Publishing domain events
- Calling external services when necessary

The Application Layer does not contain business rules.

Business decisions belong exclusively to the Domain Layer.

---

# 7. Presentation Layer

The Presentation Layer exposes the application.

Responsibilities include:

- Controllers
- DTO validation
- Authentication
- Authorization
- Request mapping
- Response mapping

Controllers must remain thin.

Controllers must never implement business logic.

---

# 8. Infrastructure Layer

Infrastructure provides technical implementations.

Examples:

- Prisma
- PostgreSQL
- Redis
- File Storage
- Email
- SMS
- External APIs

Infrastructure implements interfaces defined by the Domain.

Infrastructure must never become the source of business rules.

---

# 9. Dependency Rule

Dependencies always point inward.

Presentation

↓

Application

↓

Domain

Infrastructure depends on Domain interfaces.

Domain depends on nothing.

Violation of this rule is considered an architectural error.

---

# 10. Aggregate Rules

Every Aggregate Root is responsible for protecting its own invariants.

External objects must never modify aggregate state directly.

State changes must occur through aggregate behavior.

Aggregates are the consistency boundary of the domain.

---

# 11. Transactions

Transactions belong to the Application Layer.

A transaction should encapsulate exactly one business use case whenever possible.

Nested transactions should be avoided.

Long-running workflows should use domain events instead of database transactions.

---

# 12. Inter-Module Communication

Modules must communicate through public application services.

A module must never access another module's repositories directly.

A module must never manipulate another module's entities.

Communication should preserve module autonomy.

---

# 13. Multi-Tenant Rules

Tenant isolation is mandatory.

Every repository query must execute inside the authenticated tenant context.

No repository may expose data belonging to another tenant.

Platform-level operations are the only exception.

---

# 14. State Management

Business state transitions are controlled exclusively by the Domain.

Application services may request transitions.

Only the Domain decides whether a transition is valid.

Illegal transitions must throw business exceptions.

---

# 15. Domain Events

Domain Events represent completed business facts.

Examples:

- ShipmentRequestApproved
- CustomerShipmentCreated
- ParcelCreated
- TripStarted
- ParcelDelivered

Events must describe what happened.

Events must never describe commands.

---

# 16. Error Handling

Business rule violations must raise business exceptions.

Infrastructure failures must raise infrastructure exceptions.

Validation failures must be handled before entering the Domain Layer.

Different error categories must remain isolated.

---

# 17. Security

Authentication is handled before entering the Application Layer.

Authorization is evaluated before executing use cases.

The Domain Layer assumes the caller is authenticated.

The Domain still validates business permissions when required by business rules.

---

# 18. Persistence

Persistence is an implementation detail.

Repositories abstract persistence from the Domain.

Changing the database technology must not require changes to the Domain Layer.

---

# 19. Scalability

Modules should evolve independently.

The architecture should allow future extraction into microservices without changing business rules.

Module boundaries must therefore remain explicit from the beginning.

---

# 20. Architecture Philosophy

The project favors:

- Explicit code over magic.
- Readability over cleverness.
- Business consistency over technical shortcuts.
- Stable architecture over rapid implementation.

The objective is to build an enterprise-grade logistics platform capable of long-term evolution without architectural redesign.