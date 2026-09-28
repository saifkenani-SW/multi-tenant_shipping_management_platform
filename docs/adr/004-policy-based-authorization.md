# ADR-004: Declarative Policy-Based Authorization (PBAC) with CASL

## Status
Accepted

## Context
A multi-tenant logistics platform involves fine-grained authorization rules that depend on multiple attributes: the user's role (Tenant Owner vs. Employee vs. Customer), the user's branch assignment, the tenant boundary, and the current lifecycle state of the target resource (e.g. only employees assigned to the origin branch can dispatch a shipment). Hardcoding these checks inside controllers or scattered throughout application services leads to duplicated, brittle security code that is difficult to audit.

## Decision
We implemented a framework-agnostic **Policy-Based Access Control (PBAC)** package (`src/packages/authorization`) integrated with **CASL** (`src/packages/authorization-casl`). Authorization rules are evaluated at the **Application Service layer** using a declarative `@Authorize()` decorator:
```typescript
@Authorize({
  policy: Policy(ShipmentPolicy, ShipmentAction.Create),
  payloadResolver: (dto: CreateShipmentDto) => ({
    originOrgUnitId: dto.originOrgUnitId,
  }),
})
```

## Why
1. **Separation of Concerns**: Controllers handle HTTP routing and coarse role gating; application services enforce fine-grained business authorization before executing use cases.
2. **Declarative Composition**: Complex rules can be composed using boolean expression builders (`AllOf.sequential`, `AllOf.parallel`, `AnyOf`, `Not`) without modifying individual policy classes.
3. **Transport Independence**: Because authorization is evaluated at the service method level, the exact same policies govern requests originating from HTTP controllers, WebSocket gateways, or internal domain event listeners.

## Alternatives Considered
- **Controller Guards Only (NestJS CanActivate Guards)**: Rejected because guards execute before payload transformation and lack access to loaded domain aggregates, making entity-state-dependent authorization difficult.
- **Pure Role-Based Access Control (RBAC)**: Rejected because static roles cannot express dynamic rules such as *"a branch manager can only update shipments originating within their assigned branch subtree"*.

## Consequences
### Positive
- Clear auditability: every secured use case explicitly declares its required policy and action.
- Dynamic capability builders allow the UI to query allowed actions on an entity.
- Visibility scope builders ensure unauthorized records are excluded directly at the query level.

### Negative
- Increases initial developer learning curve for writing policies, subjects, and CASL abilities.
- Requires defining payload resolver functions to extract relevant IDs from incoming method arguments.

## Implementation
- `src/packages/authorization/decorators/authorize.decorator.ts`: `@Authorize()` method decorator.
- `src/packages/authorization/builders/`: `Policy`, `AllOf`, `AnyOf`, `Not` expression factories.
- `src/packages/authorization-casl/`: `CaslAbilityBuilder` integration.
- Module policies: `src/modules/*/domain/authorization/policies/`.
