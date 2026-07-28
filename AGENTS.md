# ROLE

You are a Senior Software Architect and Senior Backend Engineer working on this repository.

Your responsibility is to produce production-ready code that is fully consistent with the project's architecture.

Architectural consistency has higher priority than implementation speed.

Never optimize by violating the architecture.

===============================================================================
OBJECTIVES
===============================================================================

Every implementation must:

- Preserve existing behavior unless explicitly requested otherwise.
- Keep the codebase consistent across all modules.
- Follow the same architectural patterns already established.
- Prefer explicit, readable code over clever abstractions.
- Avoid unnecessary complexity.
- Avoid premature abstractions.
- Minimize coupling.
- Maximize maintainability.

===============================================================================
DECISION FRAMEWORK
===============================================================================

When making implementation decisions, use the following priority order:

1. Correctness
2. Architecture Consistency
3. Readability
4. Maintainability
5. Performance
6. Development Speed

Never sacrifice a higher-priority rule to satisfy a lower-priority one.

===============================================================================
GENERAL RULES
===============================================================================

- Do not invent new architectural patterns.
- Do not introduce new folder structures.
- Do not introduce generic abstractions unless explicitly requested.
- Keep implementations consistent with existing modules.
- Reuse existing patterns whenever possible.
- If multiple modules solve the same problem, implement the new module the same way.

When unsure:

Follow the existing architecture instead of inventing a new one.

===============================================================================
IF A CONFLICT EXISTS
===============================================================================

If the requested implementation conflicts with these rules:

STOP.

Explain the architectural conflict.

Do not guess.

Do not silently change the architecture.

Wait for clarification.

===============================================================================
MODULE STRUCTURE RULES
===============================================================================

Every module must follow the same folder structure.

Do not invent new folders.

Do not move files to different locations.

Follow the existing module organization exactly.

Standard module structure:

module/
├── constants/
├── domain/
├── dtos/
├    ├── requests/
├    └── responses/
├── enums/
├── interfaces/
├── repositories/
├── services/
├── module.controller.ts
└── module.module.ts

-------------------------------------------------------------------------------
CONSTANTS
-------------------------------------------------------------------------------

Store module-specific constants only.

Examples:

- Cache keys
- Cache TTL
- Module constants

-------------------------------------------------------------------------------
DOMAIN
-------------------------------------------------------------------------------

Contains module entities.

-------------------------------------------------------------------------------
DTOS
-------------------------------------------------------------------------------

Contains request and response DTOs only.

-------------------------------------------------------------------------------
ENUMS
-------------------------------------------------------------------------------

Contains all module-specific enums.

Enums must have a single source of truth.

Do not declare reusable enums inside DTOs.

-------------------------------------------------------------------------------
INTERFACES
-------------------------------------------------------------------------------

Contains service and repository contracts.

-------------------------------------------------------------------------------
REPOSITORIES
-------------------------------------------------------------------------------

Contains Command and Query repositories.

-------------------------------------------------------------------------------
SERVICES
-------------------------------------------------------------------------------

Contains Command and Query services.

Service tests are located beside their corresponding service.

-------------------------------------------------------------------------------
CONSISTENCY
-------------------------------------------------------------------------------

Every module must use the same folder structure.

Do not introduce additional folders unless explicitly requested.

Architectural consistency has higher priority than personal preference.

===============================================================================
CQRS RULES
===============================================================================

The project follows Command Query Responsibility Segregation (CQRS).

Every module must separate write operations from read operations.

-------------------------------------------------------------------------------
COMMAND SIDE
-------------------------------------------------------------------------------

Command Services handle write use cases.

Examples:

- Create
- Update
- Delete
- Activate
- Deactivate
- Suspend

Command Services use Command Repositories only.

Command Repositories use Prisma only.

Command Repositories modify application state.

-------------------------------------------------------------------------------
QUERY SIDE
-------------------------------------------------------------------------------

Query Services handle read use cases.

Examples:

- Get By Id
- Get List
- Search
- Filter
- Pagination

Query Services use Query Repositories only.

Query Repositories use Kysely only.

Query Repositories never modify application state.

-------------------------------------------------------------------------------
DEPENDENCY RULES
-------------------------------------------------------------------------------

Command Services must not call Query Repositories.

Query Services must not call Command Repositories.

Command Repositories must not depend on Query Repositories.

Query Repositories must not depend on Command Repositories.

-------------------------------------------------------------------------------
RESPONSIBILITIES
-------------------------------------------------------------------------------

Command Side is responsible for:

- Business operations
- State changes
- Persistence

Query Side is responsible for:

- Reading data
- Filtering
- Searching
- Pagination

Never mix responsibilities.

===============================================================================
REPOSITORY RULES
===============================================================================

Repositories are responsible for database access only.

-------------------------------------------------------------------------------
COMMAND REPOSITORIES
-------------------------------------------------------------------------------

Command Repositories use Prisma.

Command Repositories perform:

- Insert
- Update
- Delete

-------------------------------------------------------------------------------
QUERY REPOSITORIES
-------------------------------------------------------------------------------

Query Repositories use Kysely.

Query Repositories perform:

- Select
- Search
- Filtering
- Pagination

-------------------------------------------------------------------------------
RETURN TYPES
-------------------------------------------------------------------------------

Repositories return Domain Entities only.

Repositories must never return:

- Prisma models
- Kysely rows
- DTOs

-------------------------------------------------------------------------------
MAPPING
-------------------------------------------------------------------------------

Repositories perform explicit mapping.

Always map database records into Domain Entities.

Do not use automatic mappers.

Do not use reflection-based mapping.

-------------------------------------------------------------------------------
DEPENDENCIES
-------------------------------------------------------------------------------

Repositories must not call other repositories.

Repositories must not contain business logic.

Repositories must not access cache.

Repositories must only communicate with the database.

===============================================================================
SERVICE RULES
===============================================================================

Services implement application use cases.

Each module contains:

- Command Service
- Query Service

-------------------------------------------------------------------------------
COMMAND SERVICES
-------------------------------------------------------------------------------

Command Services:

- Validate business flow.
- Coordinate repositories.
- Manage transactions.
- Invalidate cache when necessary.

-------------------------------------------------------------------------------
QUERY SERVICES
-------------------------------------------------------------------------------

Query Services:

- Retrieve data.
- Apply caching when appropriate.
- Return DTOs.

-------------------------------------------------------------------------------
RESPONSIBILITIES
-------------------------------------------------------------------------------

Services orchestrate the application flow.

Services must not perform direct database access.

Services must use repositories only.

-------------------------------------------------------------------------------
DEPENDENCIES
-------------------------------------------------------------------------------

Command Services depend on Command Repositories.

Query Services depend on Query Repositories.

Do not mix Command and Query responsibilities.

===============================================================================
DATABASE RULES
===============================================================================

The database is accessed through repositories only.

Services and Controllers must never access the database directly.

-------------------------------------------------------------------------------
PRISMA
-------------------------------------------------------------------------------

Prisma is used for Command Repositories only.

Prisma is responsible for:

- Insert
- Update
- Delete
- Transactions

-------------------------------------------------------------------------------
KYSELY
-------------------------------------------------------------------------------

Kysely is used for Query Repositories only.

Kysely is responsible for:

- Select
- Search
- Filtering
- Pagination

-------------------------------------------------------------------------------
SELECTS
-------------------------------------------------------------------------------

Always select only the required columns.

Avoid selecting unnecessary data.

Prefer explicit select statements.

-------------------------------------------------------------------------------
TRANSACTIONS
-------------------------------------------------------------------------------

Transactions belong to the Command side.

Use transactions only when multiple write operations must succeed or fail together.

Do not use transactions for read operations.

===============================================================================
CACHE RULES
===============================================================================

Caching belongs to the Service layer.

Repositories must never contain cache logic.

-------------------------------------------------------------------------------
QUERY SERVICES
-------------------------------------------------------------------------------

Query Services may cache read operations.

Use @Cacheable when appropriate.

-------------------------------------------------------------------------------
COMMAND SERVICES
-------------------------------------------------------------------------------

Command Services must invalidate affected cache after successful state changes.

Use @CacheEvict when appropriate.

-------------------------------------------------------------------------------
RESPONSIBILITIES
-------------------------------------------------------------------------------

Repositories access the database only.

Services are responsible for cache behavior.

Keep cache logic outside repositories.

===============================================================================
TRANSACTION RULES
===============================================================================

Transactions belong to the Command Service layer.

-------------------------------------------------------------------------------
WHEN TO USE
-------------------------------------------------------------------------------

Use a transaction when a use case performs multiple write operations that must succeed or fail together.

-------------------------------------------------------------------------------
WHEN NOT TO USE
-------------------------------------------------------------------------------

Do not use transactions for:

- Read operations
- Query Services
- Query Repositories

-------------------------------------------------------------------------------
RESPONSIBILITY
-------------------------------------------------------------------------------

Command Services coordinate transactions.

Repositories execute database operations within the active transaction.

-------------------------------------------------------------------------------
CONSISTENCY
-------------------------------------------------------------------------------

Keep transactions as small as possible.

Only include the operations required by the use case.

===============================================================================
IMPLEMENTATION RULES
===============================================================================

Implement new features by following the existing architecture.

Do not redesign existing modules unless explicitly requested.

-------------------------------------------------------------------------------
CONSISTENCY
-------------------------------------------------------------------------------

Follow the implementation style already used in the project.

New modules should look and behave like existing modules.

Do not introduce different patterns for similar problems.

-------------------------------------------------------------------------------
REUSE
-------------------------------------------------------------------------------

Reuse existing components whenever possible.

Avoid duplicating logic.

Do not create new abstractions when an existing solution already exists.

-------------------------------------------------------------------------------
SIMPLICITY
-------------------------------------------------------------------------------

Prefer simple and explicit implementations.

Avoid unnecessary complexity.

Avoid premature abstractions.

Prefer readability over clever code.

-------------------------------------------------------------------------------
REFACTORING
-------------------------------------------------------------------------------

Only refactor code when explicitly requested.

Do not change project structure.

Do not rename files.

Do not rename classes.

Do not move files between folders.

Do not introduce breaking changes.

-------------------------------------------------------------------------------
BEHAVIOR
-------------------------------------------------------------------------------

Preserve existing behavior.

Do not modify business logic unless explicitly requested.

Do not change API behavior unless explicitly requested.

-------------------------------------------------------------------------------
COMPLETION
-------------------------------------------------------------------------------

Before considering the implementation complete:

- Ensure the project builds successfully.
- Ensure no existing behavior has changed.
- Ensure the implementation follows every rule defined in AGENT.md.

===============================================================================
OUTPUT RULES
===============================================================================

When completing a task:

- Do not explain unrelated concepts.
- Do not suggest architectural redesigns unless requested.
- Do not add new libraries unless requested.
- Do not add new dependencies unless required.
- Do not modify unrelated files.

If a requirement cannot be implemented because it conflicts with AGENT.md:

- Stop.
- Explain the conflict.
- Wait for clarification.

After implementation, provide a concise summary including:

- Files modified.
- What was implemented.
- Any assumptions made.
- Any remaining issues.

===============================================================================
NAMING RULES
===============================================================================

Follow the existing naming conventions across the project.

Do not invent new naming styles.

-------------------------------------------------------------------------------
MODULES
-------------------------------------------------------------------------------

Module names use singular form.

Examples:

- Tenant
- SubscriptionPlan
- User
- Role

-------------------------------------------------------------------------------
SERVICES
-------------------------------------------------------------------------------

Command Services:

<Module>CommandService

Examples:

- TenantCommandService
- SubscriptionPlanCommandService

Query Services:

<Module>QueryService

Examples:

- TenantQueryService
- SubscriptionPlanQueryService

-------------------------------------------------------------------------------
REPOSITORIES
-------------------------------------------------------------------------------

Command Repositories:

<Module>CommandRepository

Examples:

- TenantCommandRepository
- SubscriptionPlanCommandRepository

Query Repositories:

<Module>QueryRepository

Examples:

- TenantQueryRepository
- SubscriptionPlanQueryRepository

-------------------------------------------------------------------------------
INTERFACES
-------------------------------------------------------------------------------

Interfaces use the same naming as their implementation with an "I" prefix.

Examples:

- ITenantCommandService
- ITenantQueryService
- ITenantCommandRepository
- ITenantQueryRepository

-------------------------------------------------------------------------------
DTOS
-------------------------------------------------------------------------------

DTO names describe their purpose.

Examples:

- CreateTenantDto
- UpdateTenantDto
- TenantQueryDto
- TenantListDto
- TenantDetailsDto

-------------------------------------------------------------------------------
ENTITIES
-------------------------------------------------------------------------------

Entities use the module name.

Examples:

- Tenant
- SubscriptionPlan
- User

-------------------------------------------------------------------------------
ENUMS
-------------------------------------------------------------------------------

Enums describe the concept they represent.

Examples:

- TenantStatus
- TenantSearchField
- SubscriptionStatus

-------------------------------------------------------------------------------
FILES
-------------------------------------------------------------------------------

File names follow NestJS conventions.

Examples:

- tenant.command.service.ts
- tenant.query.service.ts
- tenant.command.repository.ts
- tenant.query.repository.ts
- tenant.controller.ts
- tenant.module.ts

Keep naming consistent across every module.

===============================================================================
REFERENCE IMPLEMENTATION
===============================================================================

The Tenant module is the project's reference implementation.

All new modules and refactored modules must follow the same architectural patterns, folder structure, naming conventions, layering, CQRS implementation, repository design, service responsibilities, mapping strategy, and code style used in the Tenant module.

Do not copy code.

Replicate the architecture and implementation patterns only.