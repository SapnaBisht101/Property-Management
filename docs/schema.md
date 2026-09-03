# Database Schema Design

## Overview

The database uses MongoDB with Mongoose schemas to define data structures, types, indexes, and document relationships.

---

## Entity Schemas & Collections

### 1. `users`

Stores user accounts, authentication credentia ̰ls, and system roles.

| Field          | Type       | Constraints                 | Description                            |
| -------------- | ---------- | --------------------------- | -------------------------------------- |
| `_id`          | `ObjectId` | Primary Key, Auto-generated | Unique user identifier                 |
| `name`         | `String`   | Required                    | User's full name                       |
| `email`        | `String`   | Required, Unique, Indexed   | User login email                       |
| `passwordHash` | `String`   | Required                    | Bcrypt salted hash                     |
| `role`         | `String`   | Required, Enum              | `'PROPERTY_MANAGER'` or `'CONTRACTOR'` |
| `createdAt`    | `Date`     | Auto-generated              | System timestamp                       |
| `updatedAt`    | `Date`     | Auto-generated              | System timestamp                       |

### 2. `units`

Represents physical rental property units.

| Field         | Type       | Constraints                 | Description                  |
| ------------- | ---------- | --------------------------- | ---------------------------- |
| `_id`         | `ObjectId` | Primary Key, Auto-generated | Unique unit identifier       |
| `unitNumber`  | `String`   | Required, Unique, Indexed   | e.g., "Apt 4B"               |
| `address`     | `String`   | Required                    | Physical property address    |
| `monthlyRent` | `Number`   | Required, Min: 0            | Expected monthly rent amount |
| `tenantName`  | `String`   | Required                    | Current primary tenant name  |
| `isArchived`  | `Boolean`  | Default: `false`, Indexed   | Soft-deletion flag           |
| `createdAt`   | `Date`     | Auto-generated              | System timestamp             |
| `updatedAt`   | `Date`     | Auto-generated              | System timestamp             |

### 3. `rent_payments`

Logs rent payments recorded by property managers against units.

| Field         | Type       | Constraints                    | Description              |
| ------------- | ---------- | ------------------------------ | ------------------------ |
| `_id`         | `ObjectId` | Primary Key, Auto-generated    | Payment record ID        |
| `unitId`      | `ObjectId` | Required, Ref: `Unit`, Indexed | Target unit reference    |
| `monthYear`   | `String`   | Required, Format: `"YYYY-MM"`  | Rent billing period      |
| `amountPaid`  | `Number`   | Required, Min: 0               | Total payment received   |
| `paymentDate` | `Date`     | Default: `Date.now`            | Recording timestamp      |
| `recordedBy`  | `ObjectId` | Required, Ref: `User`          | Property manager user ID |

### 4. `maintenance_requests`

Tracks maintenance issues logged for rental units.

| Field                 | Type         | Constraints                    | Description                                            |
| --------------------- | ------------ | ------------------------------ | ------------------------------------------------------ |
| `_id`                 | `ObjectId`   | Primary Key, Auto-generated    | Request ID                                             |
| `unitId`              | `ObjectId`   | Required, Ref: `Unit`, Indexed | Associated unit ID                                     |
| `description`         | `String`     | Required, Text Search Index    | Maintenance issue details                              |
| `priority`            | `String`     | Required, Enum, Indexed        | `'Low'`, `'Medium'`, `'High'`, `'Urgent'`              |
| `status`              | `String`     | Required, Enum, Indexed        | `'Reported'`, `'Triaged'`, `'Scheduled'`, `'Resolved'` |
| `assignedContractors` | `[ObjectId]` | Ref: `User`, Indexed           | Array of assigned contractor IDs                       |
| `createdBy`           | `ObjectId`   | Required, Ref: `User`          | Creator user ID                                        |
| `createdAt`           | `Date`       | Auto-generated, Indexed        | Ticket creation timestamp                              |
| `updatedAt`           | `Date`       | Auto-generated                 | Ticket update timestamp                                |

### 5. `request_timelines`

Immutable audit log tracking every lifecycle change, assignment shift, and note added.

| Field        | Type       | Constraints                                  | Description                                                           |
| ------------ | ---------- | -------------------------------------------- | --------------------------------------------------------------------- |
| `_id`        | `ObjectId` | Primary Key, Auto-generated                  | Audit log ID                                                          |
| `requestId`  | `ObjectId` | Required, Ref: `MaintenanceRequest`, Indexed | Target request ID                                                     |
| `actorId`    | `ObjectId` | Required, Ref: `User`                        | User who made the change                                              |
| `actionType` | `String`   | Required, Enum                               | `'CREATED'`, `'STATUS_CHANGE'`, `'ASSIGNMENT_CHANGE'`, `'NOTE_ADDED'` |
| `details`    | `Object`   | Required                                     | Action-specific metadata (e.g., `{ oldStatus, newStatus, noteText }`) |
| `createdAt`  | `Date`     | Immutable, Auto-generated                    | Timestamp of historical event                                         |

### 6. `dismissed_alerts`

Tracks rent alert dismissals per unit per month.

| Field         | Type       | Constraints                   | Description              |
| ------------- | ---------- | ----------------------------- | ------------------------ |
| `_id`         | `ObjectId` | Primary Key, Auto-generated   | Alert record ID          |
| `unitId`      | `ObjectId` | Required, Ref: `Unit`         | Target unit ID           |
| `monthYear`   | `String`   | Required, Format: `"YYYY-MM"` | Billing period dismissed |
| `dismissedBy` | `ObjectId` | Required, Ref: `User`         | Property manager user ID |

_Compound Unique Index:_ `{ unitId: 1, monthYear: 1 }` prevents redundant dismissal entries.

---

## Data Relationships

- **One-to-Many (1:N):**
  - `units` → `rent_payments` (One unit has many monthly payments)
  - `units` → `maintenance_requests` (One unit has many maintenance tickets)
  - `maintenance_requests` → `request_timelines` (One maintenance ticket has many timeline logs)
- **Many-to-Many (M:N):**
  - `maintenance_requests` ↔ `users` (Contractors): Implemented as an array of `ObjectId` references (`assignedContractors`) inside the `maintenance_requests` document.

---

## Constraints: Database vs. Application Layer

### Database Constraints (MongoDB Level)

- **Unique Constraints:** `users.email`, `units.unitNumber`, and compound unique index on `dismissed_alerts(unitId, monthYear)`.
- **Data Types:** Enforced strictly by Mongoose Schema validation rules before query execution.

### Application Constraints (Express / Business Logic Level)

- **State Machine Rules:** Rejection of illegal status transitions (e.g., `Reported` → `Resolved`).
- **Assignment Guard:** Rejection of transition to `Scheduled` status if `assignedContractors.length === 0`.
- **Audit Trail Immutability:** API router exposes `POST` (create log) but completely omits `PUT`, `PATCH`, and `DELETE` endpoints on `request_timelines`.
- **RBAC Controls:** Rejection of payment creation or contractor assignment by non-manager users.

---

## Deliberate Denormalization

- **Alert Computation:** Rent status (Overdue vs Paid) is dynamically evaluated on demand rather than storing a mutable `isOverdue` status on the `Unit` document. This avoids asynchronous stale data sync issues when bulk rent processing occurs.

---

## Scaling Analysis: What Breaks First at 100x Data?

1. **Dashboard Aggregations & Analytics:**
   - _Problem:_ Real-time `$facet` pipelines computing historical 8-week analytics and overdue calculations across tens of thousands of records will introduce high CPU utilization and latency.
   - _Fix:_ Introduce pre-computed background materialized views or Redis caching layer for key KPI metrics.

2. **Unindexed Timeline Queries:**
   - _Problem:_ Fetching full timeline histories on high-frequency maintenance tickets without index optimization.
   - _Fix:_ Compound index established on `request_timelines(requestId: 1, createdAt: -1)`.

3. **In-Memory Rent Exporter:**
   - _Problem:_ Generating large CSV exports by loading the entire portfolio into Node.js heap memory will crash backend container instances with `ERR_STRING_TOO_LONG` or OOM exceptions.
   - _Fix:_ Refactor CSV generation to use MongoDB cursor streams direct to Express response streams (`res.write()`).
