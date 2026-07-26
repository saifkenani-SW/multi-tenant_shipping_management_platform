# Caching Architecture

## Purpose

This document defines the caching architecture of the Multi-Tenant Shipping Management Platform.

Caching is considered an Infrastructure concern implemented using Aspect-Oriented Programming (AOP).

Business logic must never be aware of caching.

The Domain Layer remains completely independent from the caching mechanism.

---

# 1. Design Goals

The caching system must provide:

- Transparent caching.
- No business logic pollution.
- No Redis dependency outside Infrastructure.
- Cache invalidation support.
- Tenant isolation.
- High performance.
- Reusable decorators.
- Configurable cache policies.

---

# 2. Architecture

The project adopts Read-Through Cache.

Read Flow

Controller

↓

Application Service

↓

Permission Guard / Policy

↓

Query Service

↓

@Cacheable

↓

Cache Provider

↓

Redis

↓

Kysely

↓

PostgreSQL

If the requested value exists in cache:

Redis

↓

Return Result

Otherwise:

Redis

↓

Cache Miss

↓

Kysely

↓

PostgreSQL

↓

Store in Cache

↓

Return Result

---

# 3. Cache Scope

Caching is applied only to read operations.

Examples:

Permissions

RBAC

Reference Data

Tenant Settings

Regions

Organization Units

Parcel Tracking

Dashboard Statistics

Frequently Used Read Models

Write operations are never cached.

---

# 4. Cache Location

Caching must be implemented using decorators.

Example

@Cacheable(...)

The decorator is applied to Query Services.

Never apply caching inside:

Controllers

Application Services

Domain

Repositories

Business Policies

---

# 5. Cache Provider

The application depends on an abstraction.

interface CacheProvider

Infrastructure provides the implementation.

Example implementations:

Redis

Memory

Dragonfly

Valkey

The application must never depend directly on Redis.

---

# 6. Query Services

Query Services are responsible for read operations.

Every Query Service may expose cacheable methods.

Example

PermissionQueryService

ParcelQueryService

TripQueryService

DashboardQueryService

OrganizationQueryService

---

# 7. Cache Keys

Every cache key must include Tenant information whenever applicable.

Examples

permissions:{tenantId}:{employeeId}

parcel:{tenantId}:{parcelId}

trip:{tenantId}:{tripId}

organization:{tenantId}:{facilityId}

Never generate cache keys without tenant context.

---

# 8. Cache Profiles

Common cache configurations should be centralized.

Example

Permission

TenantSettings

Parcel

Trip

Dashboard

ReferenceData

Each profile defines

TTL

Tags

Serialization

Compression

Developers should use profiles instead of manually defining TTL values.

---

# 9. Decorators

The caching layer provides reusable decorators.

Examples

@Cacheable()

@CachePut()

@CacheEvict()

@CacheInvalidateTag()

Application code should not interact directly with Redis.

---

# 10. Cacheable

Marks a Query Service method as cacheable.

Responsibilities

Generate cache key

Check cache

Return cached value

Execute original method on cache miss

Store result

Return result

Business code remains unchanged.

---

# 11. CachePut

Updates cache after successful execution.

Useful when:

Read model must be refreshed immediately.

---

# 12. CacheEvict

Removes one cache entry.

Useful after:

Update

Delete

Restore

---

# 13. CacheInvalidateTag

Invalidates multiple cache entries belonging to the same business object.

Example

Updating a Parcel should invalidate:

parcel list

parcel details

parcel tracking

dashboard counts

instead of deleting keys individually.

---

# 14. TTL

TTL depends on business requirements.

Examples

Permissions

10 minutes

Tenant Settings

30 minutes

Reference Data

24 hours

Dashboard

30 seconds

Parcel Tracking

30 seconds

TTL should never be hardcoded throughout the project.

Use Cache Profiles.

---

# 15. Serialization

Cache serialization belongs to Infrastructure.

Application code must never serialize objects manually.

---

# 16. Cacheable Data

Suitable

Permissions

Reference Data

Organization Units

Tenant Settings

Parcel Read Models

Trip Read Models

Dashboard Data

Statistics

Unsuitable

Commands

Transactions

Aggregates

Domain Events

Temporary Business Decisions

---

# 17. Multi-Tenant Rules

Cache isolation follows tenant isolation.

Tenant A must never access cached data belonging to Tenant B.

Tenant identifier is mandatory in every cache key.

---

# 18. Business Independence

Business code must never contain:

Redis

Cache Keys

TTL

Serialization

Cache Invalidation

Business code requests data only.

Caching remains completely transparent.

---

# 19. Error Handling

Cache failures must never interrupt business execution.

If Redis becomes unavailable:

↓

Execute Query Service

↓

Read from PostgreSQL

↓

Return Result

Caching is an optimization.

Never a business dependency.

---

# 20. Performance Principles

Cache only expensive read operations.

Avoid caching:

Small queries

Frequently changing data

Write operations

Measure performance before introducing caching.

---

# 21. Forbidden Practices

Never

Import Redis into Domain.

Import Redis into Application Services.

Write Redis code inside Controllers.

Cache Aggregate Roots.

Cache Commands.

Cache Transactions.

Mix business logic with caching.

Bypass Cache Provider abstraction.

---

# 22. Final Principle

Caching is an Infrastructure optimization.

Business behavior must remain identical whether the cache exists or not.

Removing Redis from the system must not require changes to the Domain or Application layers.

The only expected difference is performance.