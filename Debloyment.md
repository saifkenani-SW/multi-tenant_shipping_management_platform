# Multi-Tenant Shipping Management Platform

Production deployment guide.

---

# Requirements

- Ubuntu 24.04 LTS
- Docker Engine
- Docker Compose Plugin
- Git
- Nginx
- Domain name
- SSL (Let's Encrypt)

---

# Directory Structure

```text
~/apps/
└── multi-tenant_shipping_management_platform/
    ├── backend/
    ├── docker-compose.production.yml
    └── ...
```

---

# First Time Server Setup

Clone project

```bash
git clone <repository-url>

cd ~/apps/multi-tenant_shipping_management_platform
```

Create network

```bash
docker network create app-network
```

Create production environment file

```text
backend/.env.production
```

Start infrastructure

```bash
docker compose -f docker-compose.production.yml up -d postgres redis
```

Build application

```bash
docker compose -f docker-compose.production.yml build
```

Run database migrations

```bash
docker compose -f docker-compose.production.yml run --rm migration
```

Start backend

```bash
docker compose -f docker-compose.production.yml up -d backend
```

Verify

```bash
docker compose ps
```

---

# Deployment

After every new release

```bash
git pull

docker compose -f docker-compose.production.yml build

docker compose -f docker-compose.production.yml run --rm migration

docker compose -f docker-compose.production.yml up -d backend
```

---

# View Logs

Backend

```bash
docker compose logs -f backend
```

PostgreSQL

```bash
docker compose logs -f postgres
```

Redis

```bash
docker compose logs -f redis
```

Migration

```bash
docker compose run --rm migration
```

---

# Restart Services

Backend

```bash
docker compose restart backend
```

Everything

```bash
docker compose restart
```

---

# Stop

```bash
docker compose down
```

Keep database data.

---

# Stop And Remove Volumes

⚠️ Warning

This permanently deletes the database.

```bash
docker compose down -v
```

---

# Rebuild

```bash
docker compose build --no-cache
```

---

# Database Migration

Run pending migrations

```bash
docker compose -f docker-compose.production.yml run --rm migration
```

Expected output

```text
No pending migrations to apply.
```

---

# Health Check

Backend

```bash
curl http://localhost:3000/health
```

Docker

```bash
docker compose ps
```

---

# Docker Images

Application

```
multi-tenant-backend:latest
```

Shared by

- backend
- migration

---

# Backup PostgreSQL

```bash
docker exec \
multi-tenant_shipping_management_platform-postgres-1 \
pg_dump \
-U postgres \
multi_tenant_shipping_platform \
> backup.sql
```

---

# Restore PostgreSQL

```bash
cat backup.sql | docker exec -i \
multi-tenant_shipping_management_platform-postgres-1 \
psql \
-U postgres \
multi_tenant_shipping_platform
```

---

# Useful Commands

Containers

```bash
docker ps
```

Images

```bash
docker images
```

Volumes

```bash
docker volume ls
```

Networks

```bash
docker network ls
```

Disk Usage

```bash
docker system df
```

Cleanup

```bash
docker image prune

docker builder prune
```

---

# Production Notes

- Never execute `prisma migrate dev` in production.
- Only use `prisma migrate deploy`.
- Backend and Migration share the same Docker image.
- Always run migrations before restarting the backend.
- PostgreSQL data is persisted using Docker Volumes.
- Redis data is persisted using Docker Volumes.
- Nginx is responsible for SSL termination and reverse proxy.