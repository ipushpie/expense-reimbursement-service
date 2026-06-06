# Expense Reimbursement Service — Claude Reference

## Running the project

```bash
cp .env.example .env          # single env file at root, no sub-folder envs
docker-compose up --build     # auto-runs DB migrations + seed
```

Seeded accounts:
| Email | Password | Role | Currency |
|---|---|---|---|
| admin@acme.com | Admin@1234 | ADMIN | USD |
| employer@acme.com | Employer@1234 | EMPLOYER | EUR |
| alice@acme.com | Employee@1234 | EMPLOYEE | USD (Engineering) |
| bob@acme.com | Employee@1234 | EMPLOYEE | INR (Sales) |

MinIO console: http://localhost:9001 (minioadmin / minioadmin123)

## Architecture

See `docs/architecture.md` for the full picture.

## Folder structure — feature-first

```
backend/src/
  config/         env.ts (zod-validated), constants.ts
  modules/        auth/ expenses/ reimbursements/ departments/ audit/
    <domain>/     controller · service · repository · routes · schemas
  shared/
    errors/       AppError + typed subclasses
    middleware/   auth · authorize · validate · upload · error
    utils/        logger · currency · response · storage (MinIO)
  prisma/         client.ts (singleton)
```

## Key patterns

- **Controller → Service → Repository** — no Prisma calls in controllers
- **Zod validation** via `validate({ body?, params?, query? })` middleware
- **JWT payload** `{ userId, email, role, currency, departmentId? }`
- **Role guard** `authorize('EMPLOYER')` factory from `authorize.middleware.ts`
- **Multi-currency** — all converted via USD as intermediate; rate snapshot stored on `ReimbursementItem`
- **Audit logging** — `auditService.log()` called from service layer, fire-and-forget
- **File storage** — MinIO (S3-compatible); multer uses `memoryStorage`, files uploaded to MinIO via `src/shared/utils/storage.ts`; download returns a 1-hour presigned URL

## Rate limiting (app.ts)

| Limiter | Window | Max | Applied to |
|---|---|---|---|
| global | 15 min | 500 | all routes |
| auth | 15 min | 10 (skip success) | /api/auth |
| write | 1 min | 60 | /api/reimbursements |
| upload | 1 hour | 30 per userId | attachment upload routes |

## Environment

Single `.env` at project root. Docker Compose injects vars into each service. No sub-folder `.env` files.

## Infrastructure services

| Service | Port | Purpose |
|---|---|---|
| postgres | 5432 | primary database |
| backend | 4000 | Express API |
| frontend | 3000 | Next.js app |
| minio | 9000 / 9001 | object storage (S3-compatible) |
| redis | 6379 | commented out — reserved for caching/queues |
| caddy | 80 / 443 | commented out — production TLS reverse proxy |
