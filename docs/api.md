# API Reference

Base URL: `http://localhost:4000/api`

All protected routes require: `Authorization: Bearer <jwt>`

---

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register (employee / employer / admin) |
| POST | `/auth/login` | Public | Login → JWT |
| GET | `/auth/me` | Any | Current user profile |

**Register body**
```json
{
  "name": "Alice",
  "email": "alice@acme.com",
  "password": "Employee@1234",
  "role": "EMPLOYEE",
  "currency": "USD",
  "departmentId": "<uuid>"   // optional, employee only
}
```

**Login body** `{ "email": "...", "password": "..." }`

---

## Expenses

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/expenses` | EMPLOYEE | Create expense (starts as DRAFT) |
| GET | `/expenses` | EMPLOYEE | List own expenses |
| GET | `/expenses/:id` | EMPLOYEE | Get single expense |
| PATCH | `/expenses/:id` | EMPLOYEE | Update (DRAFT only) |
| DELETE | `/expenses/:id` | EMPLOYEE | Delete (DRAFT only) |
| POST | `/expenses/:id/attachments` | EMPLOYEE | Upload receipt (multipart/form-data, field: `file`) |
| DELETE | `/expenses/:id/attachments/:attachId` | EMPLOYEE | Delete attachment |
| GET | `/expenses/:id/attachments/:attachId` | EMPLOYEE / EMPLOYER | Download (redirects to MinIO presigned URL) |

**Create/update body**
```json
{
  "title": "Team lunch",
  "amount": 45.00,
  "currency": "USD",
  "category": "MEALS",
  "description": "Optional notes",
  "expenseDate": "2024-11-15"
}
```

**List query params**: `month`, `year`, `status`, `page` (default 1), `limit` (default 20)

**Categories**: `TRAVEL` `MEALS` `ACCOMMODATION` `OFFICE_SUPPLIES` `SOFTWARE` `TRAINING` `MEDICAL` `COMMUNICATION` `ENTERTAINMENT` `OTHER`

**Expense status lifecycle**: `DRAFT → SUBMITTED → APPROVED / REJECTED`

---

## Reimbursements

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/reimbursements` | EMPLOYEE | Submit request |
| GET | `/reimbursements` | EMPLOYEE | List own requests |
| GET | `/reimbursements/:id` | EMPLOYEE (owner) / EMPLOYER | Request detail |
| GET | `/reimbursements/pending` | EMPLOYER | All pending requests |
| PATCH | `/reimbursements/:id/approve` | EMPLOYER | Approve |
| PATCH | `/reimbursements/:id/reject` | EMPLOYER | Reject with reason |

**Submit body**
```json
{
  "expenseIds": ["<uuid>", "<uuid>"],
  "month": 11,
  "year": 2024,
  "notes": "November reimbursements"
}
```

**Reject body** `{ "rejectionReason": "Missing receipts for items 2 and 3" }`

**Submit response** includes `budgetWarning: true` if submission would exceed the department's monthly budget (soft warning — does not block).

---

## Departments

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/departments` | EMPLOYER / ADMIN | List all departments |
| POST | `/departments` | ADMIN | Create department |
| GET | `/departments/:id/budget` | EMPLOYER | Budget status for current month |

**Budget response**
```json
{
  "department": { "name": "Engineering", "monthlyBudget": 10000, "currency": "USD" },
  "month": 11, "year": 2024,
  "budgetUSD": 10000,
  "approvedUSD": 3240.50,
  "remainingUSD": 6759.50,
  "budgetInEmployerCurrency": 9200,
  "approvedInEmployerCurrency": 2981.26,
  "overBudget": false
}
```

---

## Audit Logs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/audit-logs` | EMPLOYER / ADMIN | Paginated audit trail |

**Query params**: `entityType` (Expense / ReimbursementRequest), `entityId`, `userId`, `page`, `limit`

---

## Error responses

```json
{
  "success": false,
  "error": {
    "message": "Human-readable message",
    "code": "NOT_FOUND"
  }
}
```

| HTTP | Code | Meaning |
|---|---|---|
| 400 | VALIDATION_ERROR | Invalid request body / params |
| 401 | UNAUTHORIZED | Missing or invalid JWT |
| 403 | FORBIDDEN | Insufficient role or ownership |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Duplicate expense (same user + title + amount + date) |
| 429 | RATE_LIMIT | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
