# Request Context Module

A request-scoped context implementation for NestJS based on **AsyncLocalStorage**.

This module provides a global request context that can be accessed from anywhere in the application without passing the `Request` object through method parameters.

---

# Features

- Request scoped context using AsyncLocalStorage.
- Global access to the current request context.
- Automatic Request ID generation.
- Correlation ID support.
- Trace ID support.
- Stores the authenticated `Principal`.
- Completely framework independent from business modules.
- Safe for asynchronous operations.

---

# Architecture

```text
Incoming Request
        │
        ▼
RequestContextMiddleware
        │
        ▼
AsyncLocalStorage
        │
        ▼
AsyncContextProvider
        │
        ▼
RequestContextService
        │
        ▼
Any Service / Policy / Repository
```

The middleware creates the request context once.

Every component inside the same request accesses the exact same context instance.

---

# Folder Structure

```text
common/
└── context
    ├── context.module.ts
    ├── interfaces
    │     └── request-context.interface.ts
    ├── middleware
    │     └── request-context.middleware.ts
    ├── providers
    │     └── async-context.provider.ts
    └── services
          └── request-context.service.ts
```

---

# Requirements

The authenticated user must be represented by a **Principal**.

Expected location:

```text
core/
└── security/
      └── principal/
             └── Principal.ts
```

The `RequestContext` stores the authenticated principal instead of storing individual values such as:

- userId
- tenantId

This keeps all authentication and authorization information centralized.

---

# Register Module

Import the module once.

```ts
@Module({
    imports: [
        ContextModule,
    ],
})
export class AppModule {}
```

The module is marked with:

```ts
@Global()
```

Therefore its providers become available throughout the application.

---

# Register Middleware

The middleware must execute before authentication.

```ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

@Module({})
export class AppModule implements NestModule {

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestContextMiddleware)
            .forRoutes('*');
    }

}
```

The middleware creates the request context for every incoming request.

---

# Authentication Integration

After the user is authenticated, build the application's `Principal`.

Example:

```ts
const principal = await this.buildPrincipal(user);
```

Store it in the current request context.

```ts
this.requestContextService.setPrincipal(principal);
```

From this point forward every service can access the authenticated user.

---

# Accessing the Context

Inject the service.

```ts
@Injectable()
export class ExampleService {

    constructor(
        private readonly requestContext: RequestContextService,
    ) {}

}
```

Current Principal:

```ts
const principal = this.requestContext.getPrincipal();
```

Request ID:

```ts
const requestId = this.requestContext.getRequestId();
```

Correlation ID:

```ts
const correlationId = this.requestContext.getCorrelationId();
```

Trace ID:

```ts
const traceId = this.requestContext.getTraceId();
```

---

# Request Lifecycle

```text
HTTP Request
      │
      ▼
RequestContextMiddleware
      │
      ├── requestId
      ├── correlationId
      └── traceId
      │
      ▼
AsyncLocalStorage.run(...)
      │
      ▼
Authentication Guard
      │
      ▼
Build Principal
      │
      ▼
RequestContextService.setPrincipal(...)
      │
      ▼
Controller
      │
      ▼
Application Services
      │
      ▼
Policies
      │
      ▼
Repositories
```

Every component accesses the same request context.

---

# RequestContext

```ts
interface RequestContext {
    requestId: string;
    correlationId?: string;
    traceId?: string;

    principal?: Principal;

    metadata?: Record<string, unknown>;
}
```

---

# AsyncContextProvider

Responsible for interacting directly with Node.js `AsyncLocalStorage`.

Responsibilities:

- Create request context.
- Store request context.
- Retrieve current request context.

This provider should not contain business logic.

---

# RequestContextService

A high-level API over the provider.

Responsibilities:

- Read current request context.
- Read Request ID.
- Read Correlation ID.
- Read Trace ID.
- Read Principal.
- Update request context.

Application code should depend on this service instead of using `AsyncLocalStorage` directly.

---

# Why use Principal?

Instead of storing individual values:

```text
userId
tenantId
roles
permissions
```

The entire authenticated identity is represented by a single object.

```text
Principal
├── Subject
├── Tenant
├── Branch Access
├── Warehouse Access
└── Permissions
```

This simplifies authorization and keeps authentication data centralized.

---

# Thread Safety

The module is built on AsyncLocalStorage.

Each HTTP request receives an isolated context.

Concurrent requests never share the same context.

---

# Typical Usage

```text
Request
    │
    ▼
Middleware
    │
    ▼
Authentication Guard
    │
    ▼
RequestContext.setPrincipal(...)
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Policy
    │
    ▼
Repository
```

Every layer can access the authenticated user without passing the request object through method parameters.