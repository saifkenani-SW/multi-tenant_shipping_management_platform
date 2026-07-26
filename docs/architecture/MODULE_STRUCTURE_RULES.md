# Module Structure Consistency Rules

These rules dictate the directory structure and organizational conventions for every module in this project.
The goal is architectural consistency across the entire codebase.

===============================================================================
MODULE STRUCTURE CONSISTENCY
===============================================================================

Every module must follow the same directory structure and organizational conventions.

Recommended structure:

module/
├── constants/
├── controllers/
├── domain/
├── dtos/
├── enums/
├── interfaces/
├── repositories/
├── services/
├── modules/
└── ...

-------------------------------------------------------------------------------
ENUMS
-------------------------------------------------------------------------------

All module-specific enums must be placed inside:

enums/

Examples:

- TenantStatus
- TenantSearchField
- SubscriptionStatus
- UserStatus

Do not place enums inside:

- dtos/
- contracts/
- interfaces/

Enums must have a single source of truth.

All layers (DTOs, Services, Repositories, Controllers, etc.) must import the enum from the same location.

-------------------------------------------------------------------------------
DTOS
-------------------------------------------------------------------------------

DTOs represent API contracts only.

DTOs may import Enums.

DTOs must never be imported by Repositories.

-------------------------------------------------------------------------------
INTERFACES
-------------------------------------------------------------------------------

Interfaces define contracts between application components.

Interfaces may depend on:

- Entities
- Enums
- Shared Types

Interfaces must not depend on DTO implementations when a shared domain type or enum already exists.

-------------------------------------------------------------------------------
DEPENDENCY DIRECTION
-------------------------------------------------------------------------------

The preferred dependency flow is:

Controller
    ↓
DTO
    ↓
Service
    ↓
Repository
    ↓
Database

Shared types (Enums, Entities, Value Objects) may be referenced by multiple layers.

Repositories must never depend on DTOs.

-------------------------------------------------------------------------------
CONSISTENCY
-------------------------------------------------------------------------------

Every module must follow exactly the same folder organization.

Do not invent different locations for identical concepts.

For example:

✓ enums/tenant-status.enum.ts
✓ enums/tenant-search-field.enum.ts
✓ enums/subscription-status.enum.ts

NOT:

✗ dtos/tenant-search-field.enum.ts
✗ contracts/subscription-status.enum.ts
✗ interfaces/user-status.enum.ts

Architectural consistency is more important than personal preference.

If an Enum, Entity, or shared Type is used by more than one layer inside the same module, it must have a dedicated location and must not be declared inside another file.
