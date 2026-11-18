# CampusCare Backend Development Guide

## 1. Setup & Environment

### Prerequisites
- Node.js `v20.0.0` or higher (`v26.13.0` tested)
- PostgreSQL `v15` or higher (`v18.7` tested)
- npm `v10` or higher

### Environment Setup
1. Clone the repository and navigate to the backend directory:
   ```bash
   cd campus-care-backend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Set your local database connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/campuscare"
   TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/campuscare_test"
   PORT=3001
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

---

## 2. Database Migrations & Seeding

### Initializing the Database
Run migrations against your development database:
```bash
npx prisma migrate dev
```

### Seeding Test Data
To populate the database with Dire Dawa University, campuses, buildings, departments, categories, and test accounts:
```bash
npm run prisma:seed # Or: npx tsx prisma/seed.ts
```

### Generating Prisma Client
Whenever `prisma/schema.prisma` is modified:
```bash
npx prisma generate
```

---

## 3. Development Workflow

### Starting the Server
```bash
# Start with watch-mode reload
npm run start:dev

# Start in debug mode
npm run start:debug
```

The server listens at: **`http://localhost:3001`**  
API documentation is at: **`http://localhost:3001/api/docs`**

---

## 4. Coding Standards

1. **ESM Import Syntax:**
   - This project is an ESM module (`"type": "module"`). Relative TypeScript imports must end with `.js`:
     ```typescript
     import { AppModule } from './app.module.js'; // Correct
     import { AppModule } from './app.module';    // Incorrect in ESM
     ```
2. **DTO & Validation:**
   - Use Zod schemas for validation and export corresponding TypeScript types:
     ```typescript
     export const CreateDto = z.object({ ... });
     export type CreateDto = z.infer<typeof CreateDto>;
     ```
   - For Swagger reflection, declare classes decorated with `@ApiProperty`.
3. **Controller Pattern:**
   - Keep controllers thin. Extract request parameters, invoke service methods, and let interceptors format output.

---

## 5. Testing & Quality Checks

Run all verification tools before committing changes:

```bash
# Fast linter with type-awareness
npm run lint

# Code formatter
npm run format

# Run all unit and integration tests
npm test

# Run full end-to-end (E2E) suite with real database integration
npm run test:e2e

# Run production build
npm run build
```
