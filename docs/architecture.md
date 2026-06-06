# System Architecture

## Overview

Expense Reimbursement Service is a multi-tenant, multi-currency platform where employees record expenses and submit reimbursement requests that employers review and approve.

## Service Map

```
┌────────────────────────────────────────────────────────┐
│                     Client Browser                      │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP
         ┌─────────────▼─────────────┐
         │    Next.js Frontend :3000  │
         │  (React + shadcn/ui)       │
         └─────────────┬─────────────┘
                       │ REST /api/*
         ┌─────────────▼─────────────┐
         │   Express Backend :4000    │
         │  Node 22 · TypeScript      │
         │  Prisma ORM · Pino logs    │
         └──────┬────────────┬────────┘
                │            │
   ┌────────────▼──┐   ┌─────▼──────────┐
   │  PostgreSQL   │   │     MinIO       │
   │  :5432        │   │  :9000 (API)   │
   │  (primary DB) │   │  :9001 (UI)    │
   └───────────────┘   └────────────────┘

  ── Commented out (not running) ──────────────────────────
  Redis :6379      — for caching / job queues (future)
  Caddy :80/:443   — production TLS proxy (enable for prod)
```

## Request Flow

```
Browser → Frontend (Next.js)
       → /api/* → Backend (Express)
                → Prisma → PostgreSQL
                → MinIO  (file upload/download)
```

Download attachments use **presigned URLs** (1-hour TTL) so the browser fetches the file directly from MinIO — no proxying through the backend.

## Auth Flow

```
POST /api/auth/login
  → validate credentials (bcrypt)
  → sign JWT { userId, email, role, currency, departmentId }
  → client stores token in cookie

Subsequent requests:
  Authorization: Bearer <token>
  → authMiddleware: verify + attach req.user
  → authorize('EMPLOYER'): role guard
```

## Multi-Currency Flow

All monetary values are normalized to **USD** as the universal intermediate.

```
Employee submits expense (INR 4000)
  → stored as INR 4000

Employee submits reimbursement request
  → amountUSD = 4000 / 83.12 = 48.12 USD    (snapshot rate stored on ReimbursementItem)
  → totalAmountUSD stored on ReimbursementRequest

Employer (EUR) views request
  → totalInApproverCurrency = totalAmountUSD × 0.92
  → displayed alongside USD total
```

Exchange rates are hardcoded in `backend/src/shared/utils/currency.ts`. The snapshot is immutable — historical records remain stable even if rates change.

## File Storage Flow

```
Employee uploads receipt (JPEG/PNG/PDF, max 10MB)
  → multer memoryStorage: file.buffer in memory
  → storage.uploadFile(key, buffer, mimeType)   ← MinIO put
  → DB stores object key as Attachment.storedPath

Employee/Employer downloads attachment
  → backend generates presigned URL (1h TTL)
  → res.redirect(presignedUrl)
  → browser fetches directly from MinIO
```

## Budget Warning (soft check)

```
Employee submits reimbursement
  → query: SUM(totalAmountUSD) of APPROVED requests in same dept+month
  → compare to department.monthlyBudget (converted to USD)
  → if over: response includes { budgetWarning: true }
  → does NOT block submission
  → frontend shows amber Alert
```

## Layered Architecture (backend)

```
HTTP Request
  └── Route (express router)
        └── Middleware chain
              ├── authMiddleware     (JWT verify)
              ├── authorize(role)    (role guard)
              ├── validate(schema)   (Zod parse)
              └── Controller
                    └── Service       (business logic)
                          ├── Repository  (Prisma queries)
                          ├── storage.ts  (MinIO ops)
                          └── auditService.log()  (fire-and-forget)
```

## Infrastructure Decisions

| Decision | Choice | Reason |
|---|---|---|
| ORM | Prisma | Type-safe, great DX, first-class migrations |
| File storage | MinIO | S3-compatible, self-hosted, no vendor lock-in |
| Auth | JWT (stateless) | No session store needed; pairs naturally with role in payload |
| Currency | Hardcoded USD rates | Sufficient for demo; easy swap to live API |
| Logging | Pino | Fastest Node.js logger; structured JSON for prod |
| Rate limiting | express-rate-limit | 4 tiers: global / auth / write / upload |
| UI | shadcn/ui + Radix | Accessible primitives, full design control |
