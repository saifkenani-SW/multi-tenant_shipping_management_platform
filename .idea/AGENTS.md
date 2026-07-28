# AGENT CONSTITUTION

This repository contains the implementation of the Multi-Tenant Shipping Management Platform.

Every AI Agent working on this repository MUST follow the project documentation before writing or modifying any code.

---

# Required Reading Order

Before implementing any feature, read the following documents in order:

## Architecture

1. docs/architecture/PROJECT_CONTEXT.md
2. docs/architecture/ARCHITECTURE.md
3. docs/architecture/DDD.md
4. docs/architecture/DATABASE_RULES.md
5. docs/architecture/REPOSITORY_RULES.md
6. docs/architecture/STATE_MACHINES.md
7. docs/architecture/INVARIANTS.md
8. docs/architecture/MODULE_STRUCTURE_RULES.md

## Development

9. docs/development/CODING_STANDARDS.md
10. docs/development/API_GUIDELINES.md
11. docs/development/IMPLEMENTATION_WORKFLOW.md

---

# Mandatory Rules

The following rules are mandatory and cannot be ignored.

## Business

- Preserve the business rules.
- Never change the business workflow unless explicitly requested.
- Respect all State Machines.
- Respect all Domain Invariants.

---

## Architecture

- Follow Domain-Driven Design (DDD).
- Follow Clean Architecture.
- Preserve module boundaries.
- Preserve Aggregate boundaries.
- Never introduce unnecessary abstractions.
- Prefer explicit code over clever code.

---

## Domain

- Business logic belongs only to the Domain layer.
- Never place business rules inside Controllers.
- Never place business rules inside DTOs.
- Never place business rules inside Prisma models.
- Protect Aggregate invariants at all times.

---

## Application Layer

- Application Services orchestrate use cases.
- Application layer may coordinate transactions.
- Application layer must not contain business rules.

---

## Infrastructure

- Infrastructure implements interfaces defined by the Domain.
- Never allow Domain objects to depend on Infrastructure.
- Never access Prisma directly from Controllers.

---

## Database

- Preserve Tenant Isolation.
- Never bypass Repository abstractions.
- Follow REPOSITORY_RULES.md exactly.
- Respect all database constraints.
- Never violate immutable ledger rules.

---

## Code Quality

- Prefer readability over cleverness.
- Keep modules cohesive.
- Avoid duplication.
- Avoid hidden side effects.
- Avoid circular dependencies.

---

## Testing

Every business use case must be testable.

Critical business rules must have automated tests.

---

## If Requirements Conflict

If the implementation conflicts with the project architecture,
STOP.

Explain the conflict.

Do not guess.

Do not invent business rules.

Wait for clarification.

---

Architecture correctness has higher priority than generating code quickly.