# ADR-002: Dual Database Access Strategy (Prisma for Writes, Kysely for Reads)

## Status
Accepted

## Context
Full-featured ORMs like Prisma excel at declarative schema definition, migrations, relation mapping, and transactional mutation safety. However, for complex analytical read queries, hierarchical path matching (`ltree`), geospatial lookups (`postgis`), and high-volume data projections, ORMs often generate suboptimal SQL or suffer from entity hydration overhead.

## Decision
We adopted a **CQRS-style persistence split**:
- **Command (Write) Path**: Managed by **Prisma ORM**.
- **Query (Read) Path**: Managed by **Kysely Query Builder**, with TypeScript types auto-generated from the Prisma schema via `prisma-kysely`.

## Why
1. **Migrations & Integrity**: Prisma provides a centralized, schema-first migration workflow (`prisma/schema.prisma`) with type-safe client models for write mutations.
2. **Explicit SQL Control for Reads**: Kysely enables engineers to write typed SQL queries with arbitrary projections, selective column extraction, subqueries, and PostgreSQL extensions (`ltree`, `postgis`) without escaping into untyped raw strings.
3. **No Entity Hydration on Projections**: Kysely returns plain objects matching API response DTOs directly from the database connection pool (`pg.Pool`), reducing memory overhead on read-heavy listing and reporting endpoints.

## Alternatives Considered
- **Prisma for Everything**: Rejected because complex read queries required awkward nested includes or raw SQL strings (`prisma.$queryRaw`) which lack compile-time type safety.
- **TypeORM / MikroORM**: Rejected due to higher boilerplate, complex active-record or identity-map caching bugs, and less reliable migration tooling compared to Prisma.
- **Kysely for Everything**: Rejected because Prisma's declarative migration generator and migration engine (`prisma migrate dev`) simplify database schema evolution significantly compared to writing raw SQL migration files manually.

## Consequences
### Positive
- Strict compile-time typing across both writes and reads.
- Single source of truth for the database schema in `prisma/schema.prisma`.
- Clean separation between write-side entity validation and read-side projection logic.

### Negative
- Requires maintaining two database connection configurations in `DatabaseModule`.
- Database connection pool sizes must be budgeted carefully to ensure Prisma and `pg.Pool` combined do not exceed PostgreSQL server connection limits.

## Implementation
- `src/infrastructure/database/database.module.ts`: Configures `PrismaService` and `KYSELY_INSTANCE`.
- `prisma/schema.prisma`: Configures `generator client` and `generator kysely`.
- Command repositories inject `TransactionalPrismaService`; query repositories inject `KYSELY_INSTANCE`.
