# API Guidelines

## Purpose

This document defines the API design standards for the Multi-Tenant Shipping Management Platform.

Every REST endpoint must follow these standards.

The objective is consistency, predictability, maintainability, and long-term API stability.

---

# 1. API Style

The platform uses RESTful APIs.

Every endpoint represents a business resource.

Avoid RPC-style endpoints whenever possible.

Prefer:

POST /shipment-requests

Instead of:

POST /createShipmentRequest

---

# 2. Resource Naming

Resources are plural.

Examples:

/shipment-requests

/customer-shipments

/parcels

/trips

/manifests

/invoices

/users

Never use verbs inside URLs.

---

# 3. HTTP Methods

GET

Retrieve resources.

Must never modify state.

---

POST

Create resources.

---

PUT

Replace the complete resource.

Use only when full replacement is intended.

---

PATCH

Partial update.

Preferred over PUT.

---

DELETE

Delete or archive a resource.

If soft delete is implemented, DELETE still represents deletion from the client's perspective.

---

# 4. URL Design

URLs describe resources.

Examples:

GET /parcels/{parcelId}

PATCH /parcels/{parcelId}

DELETE /parcels/{parcelId}

Nested resources should only be used when ownership is explicit.

Example:

GET /customer-shipments/{shipmentId}/parcels

---

# 5. Business Actions

Business actions that cannot be modeled as CRUD should use action endpoints.

Examples:

POST /shipment-requests/{id}/approve-customer

POST /shipment-requests/{id}/approve-company

POST /trips/{id}/start

POST /trips/{id}/complete

POST /parcels/{id}/collect

POST /parcels/{id}/return

Business actions should always reflect Domain behavior.

---

# 6. Request Validation

All request validation must occur before entering the Application Layer.

Validation includes:

- Required fields
- Types
- Length
- Format
- DTO validation

Business validation belongs to the Domain.

---

# 7. DTO Rules

Every endpoint owns dedicated DTOs.

Do not reuse Create DTOs for Update operations.

Examples:

CreateShipmentRequestDto

UpdateShipmentRequestDto

ApproveShipmentRequestDto

DTOs are API contracts.

---

# 8. Response Format

Successful responses should remain consistent.

Example:

{
"data": { ... }
}

Collections:

{
"data": [...],
"meta": {
"page": 1,
"limit": 20,
"total": 150
}
}

---

# 9. Pagination

Large collections must support pagination.

Use:

page

limit

Response should include:

total

page

limit

totalPages

---

# 10. Filtering

Filtering uses query parameters.

Examples:

?status=READY_FOR_COLLECTION

?customerId=...

?tripId=...

Never create dedicated endpoints for simple filters.

---

# 11. Sorting

Sorting uses query parameters.

Example:

?sort=createdAt

Descending:

?sort=-createdAt

Multiple sorting:

?sort=status,-createdAt

---

# 12. Searching

Searching uses:

?q=

Example:

GET /customers?q=ahmad

---

# 13. Error Responses

All errors follow one format.

Example:

{
"statusCode": 400,
"error": "BusinessRuleViolation",
"message": "...",
"timestamp": "...",
"path": "..."
}

Never expose stack traces.

Never expose SQL errors.

---

# 14. HTTP Status Codes

200 OK

Successful retrieval.

201 Created

Successful creation.

204 No Content

Successful deletion.

400 Bad Request

Validation failure.

401 Unauthorized

Authentication required.

403 Forbidden

Authorization failure.

404 Not Found

Resource not found.

409 Conflict

Business conflict.

422 Unprocessable Entity

Business validation failed.

500 Internal Server Error

Unexpected failure.

---

# 15. Idempotency

Business operations that may be retried must support idempotency.

Examples:

Payment

Shipment approval

Webhook processing

Use idempotency keys whenever necessary.

---

# 16. Tenant Isolation

Tenant information must never be supplied by the client.

Tenant context is derived from the authenticated identity.

Controllers must never trust tenantId received from requests.

---

# 17. Authentication

Authentication uses JWT Access Tokens.

Refresh Tokens are handled separately.

Authentication occurs before Controllers execute business logic.

---

# 18. Authorization

Authorization is evaluated before use case execution.

Permissions determine access.

Business rules remain the responsibility of the Domain.

---

# 19. Versioning

API versioning should be URL-based.

Example:

/api/v1/

Breaking changes require a new API version.

---

# 20. File Upload

File uploads use multipart/form-data.

Files must be validated before persistence.

Store metadata separately from binary content.

Business rules determine whether uploaded files are mandatory.

---

# 21. Documentation

Every endpoint must include:

- Purpose
- Request DTO
- Response DTO
- Authorization
- Possible Errors

Swagger/OpenAPI documentation should remain synchronized with implementation.

---

# 22. API Design Principles

Every endpoint must satisfy:

- Predictable behavior
- Consistent naming
- Explicit responses
- Proper HTTP semantics
- Clear validation
- Tenant isolation
- Stable contracts

API design should reflect the Domain Model rather than database structure.