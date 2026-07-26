# Authorization

A framework-agnostic authorization package for NestJS applications.

The package provides a declarative authorization model based on policies and authorization expressions while remaining independent from HTTP, routing, controllers, ORMs, databases, or any specific authorization engine.

Its primary responsibilities are:

- Evaluating authorization policies.
- Composing complex authorization rules.
- Resolving strongly typed authorization payloads.
- Building visibility scopes.
- Computing resource capabilities.

The package intentionally does **not** implement authorization rules itself.

Instead, applications provide their own policies, visibility scope builders, and capability builders while the package orchestrates their execution.

---

# Core Authorization Model

Every authorization request is evaluated by the `AuthorizationExecutor`.

The executor obtains the current `AuthorizationContext` from the configured `AuthorizationContextProvider`, then evaluates the configured authorization expression.

An authorization expression can be:

- A single policy
- An `AnyOf` expression
- An `AllOf` expression
- A `Not` expression

Every expression is evaluated recursively until one or more authorization policies are executed.

---

# Authorization Context

The authorization context represents the currently authenticated principal.

```ts
export interface AuthorizationContext<TPrincipal = unknown> {
    readonly principal: TPrincipal;
}
```

The authorization package treats the context as opaque application data.

It never interprets, modifies, or validates the authenticated principal.

Applications are free to expose any principal model that fits their authentication architecture.

---

# Authorization Policy

An authorization policy is responsible for determining whether a specific action is permitted.

```ts
export interface AuthorizationPolicy<
    TAction,
    TPayload = unknown,
> {
    authorize(
        action: TAction,
        context: AuthorizationContext,
        payload?: TPayload,
    ): Promise<void>;
}
```

Every policy receives:

- The requested action.
- The current authorization context.
- An optional strongly typed payload.

Policies are responsible only for authorization decisions.

They should never execute business logic, modify entities, persist data, publish events, or invoke application use cases.

Applications are free to implement authorization using any mechanism, including:

- Repository queries
- Database lookups
- CASL
- RBAC
- ABAC
- Permission services
- Feature flags
- External authorization services
- Custom authorization engines

The authorization package never interprets how authorization decisions are produced.

---

# Authorization Expressions

Authorization rules are expressed declaratively using authorization expressions.

An authorization expression can be:

- A single policy
- `AnyOf`
- `AllOf`
- `Not`

Expressions may be nested without limitation, allowing complex authorization rules to be composed while keeping individual policies focused on a single responsibility.

---

## Policy

A policy expression represents a single authorization policy together with the action that should be authorized.

```text
Policy
    ├── policy
    └── action
```

When evaluated, the executor resolves the policy from the dependency injection container and invokes its `authorize()` method.

---

## AnyOf

`AnyOf` succeeds when at least one child expression succeeds.

Evaluation stops immediately after the first successful authorization.

If every child expression fails, authorization is denied.

```ts
@Authorize({
    policy: AnyOf(
        AdminPolicy,
        SupervisorPolicy,
        TenantOwnerPolicy,
    ),
})
```

---

## AllOf

`AllOf` succeeds only when every child expression succeeds.

Two execution modes are available.

### Sequential

`AllOf.sequential()` evaluates child expressions one after another.

```ts
@Authorize({
    policy: AllOf.sequential(
        TenantPolicy,
        PermissionPolicy,
        SubscriptionPolicy,
    ),
})
```

Sequential execution is appropriate when expression order is important or when later expressions depend on earlier authorization checks.

### Parallel

`AllOf.parallel()` evaluates every child expression concurrently.

```ts
@Authorize({
    policy: AllOf.parallel(
        TenantPolicy,
        PermissionPolicy,
        SubscriptionPolicy,
    ),
})
```

Parallel execution is recommended only when expressions are completely independent.

---

## Not

`Not` inverts another authorization expression.

Authorization succeeds only when the wrapped expression is denied.

```ts
@Authorize({
    policy: Not(BannedUserPolicy),
})
```

---

## Nested Expressions

Authorization expressions can be composed to model complex authorization requirements.

```ts
@Authorize({
    policy: AllOf.sequential(
        TenantPolicy,

        AnyOf(
            AdminPolicy,
            SupervisorPolicy,
        ),

        Not(BannedUserPolicy),
    ),
})
```

This example requires all of the following:

- The tenant policy succeeds.
- The current principal is either an administrator or a supervisor.
- The current principal is not banned.

---

# Execution Flow

Every authorization request follows the same execution pipeline.

```text
Controller Method
        │
        ▼
payloadResolver (optional)
        │
        ▼
AuthorizationExecutor
        │
        ▼
Authorization Expression
        │
        ▼
Authorization Policies
        │
        ▼
Controller Method
```

Authorization stops immediately whenever an expression denies access.

The original controller method is executed only after the complete authorization expression succeeds.
# Using the Package

The authorization package is designed to be used declaratively through method decorators.

Each decorator delegates its work to the authorization infrastructure while remaining free of authorization or business logic.

---

# Using `@Authorize`

The `@Authorize` decorator protects a controller method by executing an authorization expression before the original method is invoked.

```ts
@Authorize({
    policy: TenantPolicy,
})
async create(...) {
    ...
}
```

When a request reaches an authorized endpoint, the following pipeline is executed.

```text
Controller Method
        │
        ▼
payloadResolver (optional)
        │
        ▼
AuthorizationFacade
        │
        ▼
AuthorizationExecutor
        │
        ▼
Authorization Expression
        │
        ▼
Authorization Policies
        │
        ▼
Original Controller Method
```

The decorator itself contains no authorization logic.

Its responsibilities are limited to:

- Resolving the optional authorization payload.
- Delegating authorization to the `AuthorizationFacade`.
- Executing the original controller method only after authorization succeeds.

If authorization fails, the original controller method is never executed.

---

# Authorization Payload

Some authorization decisions require additional information beyond the authenticated principal.

Typical examples include:

- Route parameters
- Request DTOs
- Entity identifiers
- Resource ownership information
- Operation-specific metadata

Instead of exposing transport-specific objects such as HTTP requests or controllers, the package allows applications to provide a strongly typed authorization payload.

```ts
@Authorize({
    policy: TenantPolicy,

    payloadResolver: (
        params: UpdateTenantParams,
        dto: UpdateTenantDto,
    ) => ({
        tenantId: params.id,
        dto,
    }),
})
```

The payload resolver executes before authorization.

Its result is forwarded unchanged to every participating authorization policy.

The authorization package never interprets or modifies the payload.

Its responsibility is limited to transporting the resolved payload through the authorization pipeline while preserving full type safety.

---

# Design Principle

Decorators are intentionally thin.

They never contain:

- Authorization logic
- Capability computation
- Visibility scope generation
- Business logic

Their only responsibility is to delegate execution to the `AuthorizationFacade`.

```text
Decorator
      │
      ▼
AuthorizationFacade
      │
      ├──────── AuthorizationExecutor
      ├──────── VisibilityScopeExecutor
      └──────── CapabilityExecutor
```

This separation keeps decorators simple while concentrating execution logic inside dedicated executors.

---

# Why Declarative Authorization?

Instead of writing authorization logic inside controllers:

```ts
async update(...) {
    await tenantPolicy.authorize(...);

    ...

    return result;
}
```

Authorization can be declared alongside the endpoint itself.

```ts
@Authorize({
    policy: TenantPolicy,
})
async update(...) {
    ...
}
```

This approach provides several advantages:

- Controllers remain focused on application logic.
- Authorization rules become easier to discover.
- Authorization can be composed declaratively.
- Policies remain reusable across multiple endpoints.
- Authorization infrastructure stays independent from business logic.

# Visibility Scope

Many applications need to expose the visibility scope used to produce a returned result.

Instead of duplicating visibility rules across services and repositories, the authorization package delegates visibility generation to dedicated scope builders.

```ts
export interface VisibilityScopeBuilder<TScope> {
    buildScope(
        context: AuthorizationContext,
    ): TScope;
}
```

A visibility scope builder receives the current authorization context and returns an application-defined visibility scope.

The authorization package never interprets or modifies the generated scope.

Its responsibility is limited to resolving the configured builder and exposing the generated scope to the application.

---

## Using `@ReturnVisibilityScope`

```ts
@ReturnVisibilityScope({
    builder: TenantVisibilityScope,
})
async findMany(...) {
    ...
}
```

After the controller method returns, the configured visibility scope builder is executed.

The generated scope is attached to the returned object.

If the returned object contains a `meta` object, the scope is attached to `meta.scope`.

Otherwise, it is attached directly to the returned object.

---

# Capabilities

Some applications need to expose which operations are available for a returned resource.

Instead of embedding this logic inside controllers or services, the authorization package delegates capability computation to dedicated capability builders.

```ts
export interface CapabilityBuilder<TEntity, TCapability> {
    buildCapabilities(
        entity: TEntity,
        context: AuthorizationContext,
    ): Promise<TCapability> | TCapability;
}
```

A capability builder receives:

- The returned entity.
- The current authorization context.

and produces an application-defined capabilities object.

The authorization package never interprets or modifies the generated capabilities.

Its responsibility is limited to resolving the configured builder and attaching the computed capabilities to the returned object.

---

## Using `@ReturnCapabilities`

```ts
@ReturnCapabilities({
    policy: TenantCapabilities,
})
async findById(...) {
    ...
}
```

The capability builder executes after the controller method returns.

The computed capabilities are attached to the returned object under the `capabilities` property.

---

# Visibility Scope vs Capabilities

Although both concepts are computed from the current authorization context, they solve different problems.

| Visibility Scope | Capabilities |
|------------------|--------------|
| Determines which resources are visible | Determines which operations are allowed |
| Computed from the authorization context | Computed from the authorization context and a returned entity |
| Used to describe data visibility | Used to describe resource permissions |

Visibility Scope answers:

> **"Which resources can I see?"**

Capabilities answer:

> **"What can I do with this resource?"**

---

# Package Architecture

The authorization package is organized around a single public entry point.

```text
Decorators
      │
      ▼
AuthorizationFacade
      │
      ├──────── AuthorizationExecutor
      ├──────── VisibilityScopeExecutor
      └──────── CapabilityExecutor
```

The facade coordinates the package but contains no authorization logic.

Each executor has a single responsibility:

- `AuthorizationExecutor` evaluates authorization expressions.
- `VisibilityScopeExecutor` builds visibility scopes.
- `CapabilityExecutor` computes resource capabilities.

---

# Building Expressions

Although most applications use the `@Authorize` decorator directly, authorization expressions can also be constructed programmatically.

The `Policy()` helper creates a policy expression from a policy type and an action.

```ts
const expression = Policy(
    TenantPolicy,
    TenantAction.Update,
);
```

The returned expression can be freely composed with `AnyOf`, `AllOf`, and `Not`.

```ts
const expression = AllOf.sequential(
    Policy(TenantPolicy, TenantAction.Update),

    AnyOf(
        Policy(AdminPolicy, AdminAction.Manage),
        Policy(SupervisorPolicy, SupervisorAction.Approve),
    ),

    Not(
        Policy(BannedUserPolicy, UserAction.Access),
    ),
);
```

This allows authorization expressions to be created dynamically while preserving full type safety.

---

# Architecture Principles

The authorization package is built around a small set of architectural principles.

- Framework-agnostic contracts.
- Declarative authorization.
- Thin decorators.
- Single public facade.
- Dedicated executors.
- Strongly typed payloads.
- Strongly typed policies.
- Strongly typed visibility scopes.
- Strongly typed capabilities.
- Dependency Injection for every application-specific component.
- No dependency on ORM, routing, transport, or database technologies.

---

# Complete Example

```ts
@Authorize({
    policy: AllOf.sequential(
        Policy(TenantPolicy, TenantAction.Update),

        AnyOf(
            Policy(AdminPolicy, AdminAction.Manage),
            Policy(SupervisorPolicy, SupervisorAction.Approve),
        ),

        Not(
            Policy(BannedUserPolicy, UserAction.Access),
        ),
    ),

    payloadResolver: (
        params: UpdateTenantParams,
        dto: UpdateTenantDto,
    ) => ({
        tenantId: params.id,
        dto,
    }),
})
@ReturnCapabilities({
    policy: TenantCapabilities,
})
@ReturnVisibilityScope({
    builder: TenantVisibilityScope,
})
async update(...) {
    ...
}
```

This example demonstrates how authorization, capabilities, and visibility scopes can be combined declaratively while keeping controllers free of authorization logic.


# Best Practices

The following recommendations are not enforced by the library but are strongly recommended for medium and large applications.

## Keep Policies Focused

Each policy should be responsible for a single domain.

As the number of supported actions grows, prefer delegating authorization logic to dedicated strategies instead of building large `switch` statements.

---

## Use Strongly Typed Payloads

Authorization payloads should contain only the data required to evaluate authorization.

Avoid passing framework-specific objects such as:

- HTTP requests
- Express request objects
- Controllers
- Route handlers

Policies should remain independent from transport abstractions.

---

## Prefer Composable Expressions

Express complex authorization rules using `Policy`, `AnyOf`, `AllOf`, and `Not` instead of embedding orchestration logic inside policies.

This keeps individual policies small, reusable, and easier to test.

---

## Use Parallel Evaluation Carefully

`AllOf.parallel()` should be used only when every child expression is independent.

If evaluation order matters or one policy depends on another, use `AllOf.sequential()`.

---

## Keep Builders Stateless

Capability builders and visibility scope builders should not maintain mutable state.

They should depend only on:

- The authorization context.
- Their input parameters.
- Injected dependencies.

Stateless builders are deterministic, reusable, and straightforward to test.

---

## Keep Authorization Separate from Business Logic

Authorization determines whether an operation is allowed.

Business logic determines how the operation is executed.

Policies, capability builders, and visibility scope builders should never:

- Modify entities.
- Persist data.
- Publish domain events.
- Execute application use cases.

Their only responsibility is to evaluate authorization-related concerns.

---

# Summary

The authorization package provides:

- Declarative authorization through decorators.
- Composable authorization expressions.
- Strongly typed authorization payloads.
- Visibility scope generation.
- Resource capability computation.
- Framework-agnostic contracts.
- Dependency Injection integration.
- Transport-independent architecture.

Applications remain fully responsible for implementing their own authorization rules while the package provides the infrastructure to execute them consistently.


# Quick Start

```ts
@Authorize({
    policy: Policy(TenantPolicy, TenantAction.Update),
    payloadResolver: (
        params: UpdateTenantParams,
        dto: UpdateTenantDto,
    ) => ({
        tenantId: params.id,
        dto,
    }),
})
@ReturnCapabilities({
    policy: TenantCapabilities,
})
@ReturnVisibilityScope({
    builder: TenantVisibilityScope,
})
async update(...) {
    ...
}
```

The authorization package will:

1. Resolve the authorization payload.
2. Evaluate the authorization expression.
3. Execute the controller method if authorization succeeds.
4. Compute the returned resource capabilities.
5. Build and attach the visibility scope.