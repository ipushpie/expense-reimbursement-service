# Expense Reimbursement Service

A full-stack expense reimbursement platform for teams. Employees record and submit expenses; employers approve or reject them — with multi-currency support, receipt storage, departmental budgets, and a full audit trail.

## Stack

| Layer | Tech |
|---|---|
| Backend | Node.js 22 · Express · TypeScript · Prisma |
| Database | PostgreSQL 16 |
| File storage | MinIO (S3-compatible) |
| Frontend | Next.js 15 · React 19 · shadcn/ui · Tailwind CSS |
| Infrastructure | Docker · Docker Compose · Caddy (production TLS) |

## Quick Start

```bash
git clone git@github.com:ipushpie/expense-reimbursement-service.git
cd expense-reimbursement-service

cp .env.example .env          # single env file — no per-folder envs
docker-compose up --build     # builds images, runs DB migrations, seeds data
```

Services:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api |
| MinIO Console | http://localhost:9001 |

## Demo Accounts

| Email | Password | Role | Currency |
|---|---|---|---|
| alice@acme.com | Employee@1234 | Employee | USD |
| bob@acme.com | Employee@1234 | Employee | INR |
| employer@acme.com | Employer@1234 | Employer | EUR |
| admin@acme.com | Admin@1234 | Admin | USD |

## Features

- **Expense management** — Create, edit, delete draft expenses with receipt uploads (JPEG/PNG/PDF, max 10 MB)
- **Reimbursement workflow** — Submit grouped requests; employers approve or reject with notes
- **Multi-currency** — 10 supported currencies; all totals normalised to USD; exchange rate snapshot stored at submission time for immutable history
- **Departmental budgets** — Soft budget warnings (does not block submission); utilisation shown on employer dashboard
- **Audit trail** — Every action logged with before/after values; queryable by employers
- **Rate limiting** — 4 tiers: global (500/15 min), auth brute-force (10/15 min), write (60/1 min), upload (30/hr per user)
- **Object storage** — MinIO replaces local disk; downloads use presigned URLs (1-hour TTL)

## Project Structure

```
expense-service/
├── backend/                  Node.js API
│   ├── src/
│   │   ├── modules/          Feature modules (auth/expenses/reimbursements/departments/audit)
│   │   └── shared/           Middleware, utils, errors
│   └── prisma/               Schema + seed
├── frontend/                 Next.js app
│   └── src/
│       ├── app/              Pages (App Router)
│       ├── components/       shadcn UI + layout
│       └── lib/              API client, auth, utils
├── docs/                     Architecture, API reference, data model
├── Caddyfile                 Production reverse proxy config
├── docker-compose.yml
└── .env.example
```

See [`docs/`](./docs/) for:
- [Architecture](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Data Model](./docs/data-model.md)

## Production Deployment

1. Point your DNS A record to your server
2. Set `CADDY_DOMAIN=yourdomain.com` in `.env`
3. Uncomment the `caddy` service in `docker-compose.yml`
4. Remove `ports:` from `backend` and `frontend` services (Caddy handles routing)
5. `docker-compose up -d`

Caddy automatically provisions TLS certificates via Let's Encrypt.

## API Reference

See [`docs/api.md`](./docs/api.md) for the full endpoint list.

Base URL: `http://localhost:4000/api`

All protected routes require: `Authorization: Bearer <jwt>`

## Environment Variables

Single `.env` file at project root (copied from `.env.example`).

| Variable | Description |
|---|---|
| `POSTGRES_DB/USER/PASSWORD` | Database credentials |
| `JWT_SECRET` | JWT signing secret (min 16 chars) |
| `JWT_EXPIRES_IN` | Token expiry (default `7d`) |
| `MINIO_ENDPOINT/PORT/ACCESS_KEY/SECRET_KEY/BUCKET` | MinIO object storage |
| `NEXT_PUBLIC_API_URL` | Backend URL visible to browser |
| `FRONTEND_URL` | Allowed CORS origin for backend |
