# CampusCare Backend

CampusCare is an enterprise university maintenance management platform designed to streamline infrastructure reporting, dispatch, workflow tracking, and facility oversight. Initially launched for **Dire Dawa University (DDU)**, the platform is architected for seamless multi-university expansion.

---

## Tech Stack & Architecture

- **Framework:** NestJS 12 (ESM, modular architecture)
- **Language:** TypeScript 6
- **Database:** PostgreSQL 18
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Security:** Argon2id password hashing, HttpOnly session cookies, CSRF protection, strict CORS, and Helmet headers
- **Validation:** Zod schemas and NestJS Validation Pipes
- **Testing:** Vitest & Supertest (Unit & End-to-End test suites)
- **API Standard:** RESTful JSON at `/api/v1` with Swagger/OpenAPI documentation at `/api/docs`

---

## Core Capabilities

1. **Multi-Tenancy & Hierarchy:**
   - Strict university-scoped data isolation.
   - Normalized hierarchy: University -> Campus -> Building -> Department.
2. **Role-Based Access Control:**
   - `STUDENT`: Submit maintenance requests, track progress, comment, upload photos, close/reopen their own requests.
   - `MAINTENANCE_STAFF`: Receive assigned tasks, acknowledge work, update progress to `IN_PROGRESS`/`ON_HOLD`/`RESOLVED`, post internal and public notes.
   - `ADMIN`: Review, approve/reject requests, manually assign staff members, manage users, and inspect facility performance dashboards.
3. **11-Stage Workflow Engine:**
   - Supported statuses: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `ASSIGNED`, `IN_PROGRESS`, `ON_HOLD`, `RESOLVED`, `CLOSED`, `REJECTED`, `CANCELLED`, `REOPENED`.
   - Comprehensive status transition audit history with actor IDs, timestamps, and justification notes.
4. **Secure File Storage:**
   - Private, authenticated image attachment upload with magic byte content validation and random UUID key storage.
5. **Real-time In-App Notifications:**
   - Database-backed notifications for request assignments, status changes, and discussion updates.
6. **Analytics & Dashboards:**
   - Non-hardcoded, live database metrics tailored per role: request counts, resolution times, category/priority breakdowns, and staff workloads.

---

## Quick Start

### 1. Prerequisites
- Node.js `v20+` (tested on `v26.13.0`)
- PostgreSQL `v15+` (tested on `v18.7`)

### 2. Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` matches your local PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/campuscare"
PORT=3001
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

### 3. Migrations & Seeding
```bash
# Run database migrations
npx prisma migrate dev

# Seed Dire Dawa University, hierarchy, categories, and sample users
npx tsx prisma/seed.ts
```

### 4. Running the Server
```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The backend starts at: **`http://localhost:3001`**  
API documentation is accessible at: **`http://localhost:3001/api/docs`**  
Health check endpoint: **`http://localhost:3001/api/v1/health`**

---

## Seed Accounts (Development)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ddu.edu.et` | `Admin123!` | Facilities Administrator |
| **Staff (Electrical)** | `staff.electrical@ddu.edu.et` | `Staff123!` | Electrical Maintenance |
| **Staff (Plumbing)** | `staff.plumbing@ddu.edu.et` | `Staff123!` | Plumbing Maintenance |
| **Student** | `student.abebe@ddu.edu.et` | `Student123!` | Main Campus Dorm B01 |
| **Student** | `student.chala@ddu.edu.et` | `Student123!` | IoT Campus |

---

## Verification & Testing

```bash
# Run unit tests
npm test

# Run End-to-End (E2E) integration tests
npm run test:e2e

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## Documentation Index

- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture, module boundaries, multi-tenancy, and state machine.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — Relational schema, 18 models, indexes, and delete behaviors.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — REST API endpoints, DTO contracts, and frontend integration guide.
- [SECURITY.md](SECURITY.md) — Security baseline, Argon2id, session management, CSRF, and tenant isolation.
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) — Developer guidelines, coding standards, and testing workflows.
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — Production deployment with Docker, reverse proxy, and environment configs.
- [BACKUP_AND_RESTORE.md](BACKUP_AND_RESTORE.md) — PostgreSQL backup strategies, automated cron dumps, and disaster recovery.
