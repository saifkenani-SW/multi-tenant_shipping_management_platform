# Implementation Workflow

## Purpose

This document defines the mandatory implementation workflow for every feature developed in this project.

Every User Story, Bug Fix, Enhancement, or Refactoring must follow this workflow.

Skipping any step is considered an implementation defect.

---

# 1. Understand the Requirement

Before writing any code:

- Read the User Story.
- Read the Acceptance Criteria.
- Read the SRS if necessary.
- Understand the business goal.

Never start implementation without understanding the business requirement.

---

# 2. Identify the Business Capability

Determine:

- Which module owns the feature?
- Which bounded context owns the business rule?
- Which aggregate is responsible?

Business ownership must always be clear.

---

# 3. Locate the Aggregate Root

Every use case must have one primary Aggregate Root.

Examples:

Shipment Request

Customer Shipment

Parcel

Trip

Manifest

Invoice

Support Ticket

Never implement a use case before identifying its Aggregate Root.

---

# 4. Read Domain Documentation

Before implementing:

Read:

- STATE_MACHINES.md
- INVARIANTS.md

Verify:

- Allowed transitions.
- Business constraints.
- Required validations.

Never invent business rules.

---

# 5. Design Before Coding

Think before writing code.

Identify:

- Aggregate
- Entities
- Value Objects
- Domain Services
- Repository Interfaces
- Policies
- Specifications
- Domain Events

Avoid writing code before understanding the model.

---

# 6. Verify Existing Implementation

Search the project first.

Do not duplicate:

- Services
- Value Objects
- Specifications
- Policies
- Repositories

Reuse existing implementations whenever appropriate.

---

# 7. Implement the Domain

The Domain Layer is implemented first.

Implement:

- Aggregate behavior
- Entities
- Value Objects
- Specifications
- Policies
- Domain Events

The Domain must compile independently from Infrastructure.

---

# 8. Implement the Application Layer

After the Domain:

Implement:

- Use Case
- Application Service
- Transaction
- Repository Coordination
- Event Publishing

Application Services orchestrate.

They do not make business decisions.

---

# 9. Implement Infrastructure

Infrastructure comes last.

Implement:

- Prisma Repository
- External Services
- File Storage
- Redis
- Email
- SMS

Infrastructure must satisfy Domain interfaces.

---

# 10. Implement Presentation

Finally:

Implement:

- Controller
- DTO
- Validation
- Mapping
- Response

Controllers remain thin.

---

# 11. Validation Checklist

Before committing:

Verify:

✓ Business Rules

✓ Aggregate Invariants

✓ State Machine

✓ Tenant Isolation

✓ Authorization

✓ Transactions

✓ Error Handling

---

# 12. Testing

Write tests after implementation.

Required tests:

- Domain Tests
- Application Tests
- Integration Tests

Critical business rules must always be tested.

---

# 13. Refactoring

Refactor only after:

- Tests pass.
- Business correctness is preserved.

Never refactor blindly.

---

# 14. Code Review Checklist

Review the implementation.

Confirm:

- Architecture respected.
- No business logic outside Domain.
- Aggregate boundaries respected.
- Repository interfaces respected.
- Transactions correctly scoped.
- Tenant isolation preserved.
- Naming consistent.
- Tests included.

---

# 15. Forbidden Practices

Never:

- Write business logic inside Controllers.
- Write business logic inside DTOs.
- Write business logic inside Prisma models.
- Call Prisma directly from Controllers.
- Skip Aggregate validation.
- Ignore State Machines.
- Ignore Invariants.
- Duplicate business logic.
- Modify unrelated modules.
- Break module boundaries.

---

# 16. AI Agent Rules

Before implementing any task:

1. Read AGENTS.md.
2. Read PROJECT_CONTEXT.md.
3. Read ARCHITECTURE.md.
4. Read DDD.md.
5. Read STATE_MACHINES.md.
6. Read INVARIANTS.md.
7. Read CODING_STANDARDS.md.

Only then begin implementation.

---

# 17. If a Conflict Exists

If documentation conflicts with code:

Do not guess.

Stop implementation.

Explain:

- What conflicts.
- Why it conflicts.
- Possible solutions.

Never silently change business behavior.

---

# 18. Definition of Done

A task is considered complete only if:

- Business requirements are satisfied.
- Acceptance Criteria are satisfied.
- Architecture is preserved.
- Domain integrity is preserved.
- Tests pass.
- Code review passes.
- No unrelated code was modified.

Feature completion means business completion, not just successful compilation.