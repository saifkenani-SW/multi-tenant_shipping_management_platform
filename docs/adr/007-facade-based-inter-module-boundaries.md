# ADR-007: Facade-Based Inter-Module Communication

## Status
Accepted

## Context
In a modular monolith, boundaries between modules easily erode over time. Developers under pressure may directly import foreign repositories, services, or entities from other modules. This creates tight coupling, circular dependency loops, and leaks internal implementation details across domains, turning the monolith into a "big ball of mud" and making future microservice extraction impossible.

## Decision
We established a strict architectural rule: **Inter-module communication must happen exclusively through exported Facades**. No module may import another module's Repository, Service, or Entity directly.

```text
Consuming Module                       Providing Module
┌──────────────────┐                  ┌──────────────────┐
│ Application Svc  │ ──(calls)───►    │ Module Facade    │
└──────────────────┘                  └─────────┬────────┘
                                                │
                                      ┌─────────▼────────┐
                                      │ Internal Service │
                                      └─────────┬────────┘
                                                │
                                      ┌─────────▼────────┐
                                      │ Repository / DB  │
                                      └──────────────────┘
```

## Why
1. **Clear Public Contracts**: A module explicitly declares what capabilities it exposes to the rest of the application via its Facade (e.g. `TenantFacade`, `FleetFacade`, `CustomerShipmentFacade`).
2. **Encapsulation of Internal Changes**: A providing module can refactor its database schema, internal repositories, or private service methods without breaking consuming modules, so long as the Facade contract remains stable.
3. **Decoupled Testing**: Consuming modules can mock the foreign Facade with straightforward unit test mocks rather than mocking complex relational database calls.

## Alternatives Considered
- **Direct Service Injection**: Rejected because services frequently expose internal methods intended only for that module's controllers, creating accidental coupling.
- **Pure Event-Driven Communication for Everything**: Rejected because synchronous request-response queries (such as *"get tenant volumetric divisor"* or *"validate organization units exist"*) become excessively convoluted when forced into asynchronous request-reply event patterns.

## Consequences
### Positive
- Strict, discoverable domain boundaries.
- Clean dependency trees without circular imports.
- Simplifies independent module testing.

### Negative
- Adds a small amount of boilerplate (creating and maintaining Facade classes and DTO contracts).
- Requires architectural discipline and code review to prevent developers from directly importing foreign internal classes.

## Implementation
- `src/modules/*/facades/` or `src/modules/*/application/facades/`: Exported facade implementations.
- Modules export only their Facades in their `@Module({ exports: [...] })` definitions.
