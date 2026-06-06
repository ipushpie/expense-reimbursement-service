# Data Model

## Entity Relationship

```
Department ──< User ──< Expense ──< Attachment
                  │          │
                  │          └──< ReimbursementItem >── ReimbursementRequest
                  │                                              │
                  └─── (approver) ──────────────────────────────┘
                  │
                  └──< AuditLog
```

## Enums

```
UserRole:             EMPLOYEE | EMPLOYER | ADMIN
ExpenseStatus:        DRAFT | SUBMITTED | APPROVED | REJECTED | CANCELLED
ReimbursementStatus:  PENDING | APPROVED | REJECTED | CANCELLED
ExpenseCategory:      TRAVEL | MEALS | ACCOMMODATION | OFFICE_SUPPLIES |
                      SOFTWARE | TRAINING | MEDICAL | COMMUNICATION |
                      ENTERTAINMENT | OTHER
```

## Models

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | String UNIQUE | |
| passwordHash | String | bcrypt, 12 rounds |
| name | String | |
| role | UserRole | default EMPLOYEE |
| currency | String | home currency (USD/EUR/INR/etc.) |
| departmentId | UUID? FK | links to Department |

### Department
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | String UNIQUE | |
| monthlyBudget | Decimal(12,2) | in `currency` |
| currency | String | default USD |

### Expense
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| userId | UUID FK | owner |
| title | String | |
| amount | Decimal(12,2) | in `currency` |
| currency | String | employee's home currency |
| category | ExpenseCategory | |
| description | String? | |
| expenseDate | DateTime | |
| month / year | Int | derived from expenseDate, indexed |
| status | ExpenseStatus | default DRAFT |

Unique constraint: `(userId, title, amount, expenseDate)` — duplicate guard

### Attachment
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| expenseId | UUID FK | cascades on delete |
| filename | String | original filename |
| storedPath | String | MinIO object key (`receipts/<userId>/...`) |
| mimeType | String | image/jpeg · image/png · application/pdf |
| sizeBytes | Int | max 10MB enforced by multer |

### ReimbursementRequest
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| employeeId | UUID FK | submitter |
| approverId | UUID? FK | set on approval/rejection |
| status | ReimbursementStatus | default PENDING |
| totalAmountUSD | Decimal(12,2) | sum of all items, in USD |
| approverCurrency | String | employer's currency at submission time |
| totalInApproverCurrency | Decimal(12,2) | converted total |
| notes | String? | employee notes |
| rejectionReason | String? | set on rejection |
| month / year | Int | billing period |
| submittedAt | DateTime | |
| processedAt | DateTime? | set on approve/reject |

### ReimbursementItem
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| reimbursementRequestId | UUID FK | cascades on delete |
| expenseId | UUID FK | |
| originalAmount | Decimal(12,2) | expense amount in original currency |
| originalCurrency | String | |
| amountUSD | Decimal(12,2) | converted at submission time |
| exchangeRateToUSD | Decimal(10,6) | rate snapshot — immutable historical record |

### AuditLog
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| userId | UUID FK | who performed the action |
| action | String | e.g. EXPENSE_CREATED, REQUEST_APPROVED |
| entityType | String | Expense \| ReimbursementRequest |
| entityId | String | |
| oldValues | Json? | before state |
| newValues | Json? | after state |
| ipAddress | String? | |
| createdAt | DateTime | immutable |

Indexes: `(entityType, entityId)`, `(userId)`

## Indexes summary

```sql
-- Expense
CREATE INDEX ON "Expense"("userId", "month", "year");
CREATE INDEX ON "Expense"("status");

-- ReimbursementRequest
CREATE INDEX ON "ReimbursementRequest"("employeeId", "status");
CREATE INDEX ON "ReimbursementRequest"("approverId", "status");

-- AuditLog
CREATE INDEX ON "AuditLog"("entityType", "entityId");
CREATE INDEX ON "AuditLog"("userId");
```
