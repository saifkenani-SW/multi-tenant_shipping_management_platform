# Multi-Tenant Shipping Management Platform

This is an Enterprise-grade SaaS platform built for logistics and parcel management, utilizing a multi-tenant architecture to ensure strict data isolation between different shipping companies.

## 🏗 Tech Stack
* **Framework:** NestJS
* **Database:** PostgreSQL (v16)
* **ORM & Query Builder:** Prisma (for CQRS Command-side writes) and Kysely (for CQRS Query-side reads)
* **Cache / Queue:** Redis
* **Infrastructure:** Docker & Docker Compose

---

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:
* **Node.js** (v20 or higher)
* **npm** or **yarn** or **bun**
* **Docker** & **Docker Compose** installed and running on your machine.

---

## 🚀 Getting Started (Local Development)

Follow these steps to get your development environment running.

### 1. Clone the repository and install dependencies
```bash
git clone git@github.com:saifkenani-SW/multi-tenant_shipping_management_platform.git
cd multi-tenant_shipping_management_platform/backend
npm install
```

### 2. Environment Variables Configuration
The `.env.example` file contains the default configuration needed to run the application.
Copy the example environment file:
```bash
cp .env.example .env
```
*Note: The environment variables are not automatically loaded by Prisma by default. The `DATABASE_URL` connects to the local Dockerized database on port 51214.*

### 3. Start the Infrastructure (Database)
We use Docker Compose to spin up the PostgreSQL database in an isolated container. The configuration exposes port 51214 to avoid conflicts with local instances.
```bash
docker compose up -d
```
To verify the database is running, you can check the container status:
```bash
docker ps
```

### 4. Database Setup & Migrations
Once the database is running, generate the Prisma client and apply the migrations to construct the schema:
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Start the Application
Run the NestJS backend server:
```bash
# development
npm run start

# watch mode (Recommended for development)
npm run start:dev
```
The API will be available at `http://localhost:3000` (or the port specified in `.env`).

---

## 🧪 Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```

---

## 🛑 Stopping the Infrastructure
When you are done with development, you can stop the database container without losing data:
```bash
docker compose down
```
*(Data is persisted in the local volume `postgres_data`)*
