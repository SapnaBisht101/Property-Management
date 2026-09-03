## 1. Project Scaffolding & Architecture setup

### Prompt 1.1: Express Backend & Database Schema
* **Intent:** Generate the initial Express.js server boilerplate, Mongoose database schemas, and JWT authentication structure for two roles (`PROPERTY_MANAGER` and `CONTRACTOR`).
* **Prompt:**
  > "I am building a Property Rental & Maintenance system using Node.js, Express, and MongoDB/Mongoose. Create data schemas for Users (roles: PROPERTY_MANAGER, CONTRACTOR), Units, Maintenance Requests, and Rent Payments. Enforce strict role-based authorization middleware."
* **Result:** Successfully generated Mongoose models (`User.js`, `Unit.js`, `Request.js`, `RentPayment.js`) and role enforcement middleware (`auth.js`).

---

## 2. Business Logic & State Machine Constraints

### Prompt 2.1: Lifecycle Transition Rules & Immutability
* **Intent:** Enforce status progression rules (*Reported → Triaged → Scheduled → Resolved*) and generate immutable timeline entries on updates.
* **Prompt:**
  > "Write an Express route for updating maintenance request status. Require that transitioning to 'Scheduled' is rejected if no contractor is assigned (`assignedContractors.length === 0`). Transitioning from 'Resolved' back to another status must set status to 'Triaged'. Record every change automatically in an immutable timeline array with timestamp, actor, old status, and new status."
* **Result:** Generated the `PATCH /api/requests/:id/status` controller enforcing state rules and logging timeline entries.

---

## 3. Server-Side Filtering, Search & Dashboard Aggregations

### Prompt 3.1: Server-Side Query Filtering
* **Intent:** Implement server-side search, multi-field filtering, sorting, and pagination.
* **Prompt:**
  > "Create a `GET /api/requests` endpoint that handles text searching in descriptions, filter by unit, status, priority, and assigned contractor, sort by date or status, and handle pagination on the server side using MongoDB."
* **Result:** Created full database query pipelines returning paginated results along with metadata.

---

## 4. Bulk Actions & CSV Export

### Prompt 4.1: Bulk Rent Match Processing
* **Intent:** Allow property managers to record rent for multiple units in a single batch and return match classifications.
* **Prompt:**
  > "Write a controller function for `POST /api/rent/bulk`. It receives an array of `{ unitId, amountPaid, monthYear }`. Process each entry and classify the result as matched (exact rent amount), underpaid, overpaid, or unmatched (invalid unit ID). Return a structured per-unit summary."
* **Result:** Successfully built the bulk processing handler and classification reporter.

---

## 5. UI Components & Role-Based Visual Adjustments

### Prompt 5.1: Dashboard and Request Components
* **Intent:** Create dashboard overview charts using Recharts and manage requests visually based on user permissions.
* **Prompt:**
  > "Create a React component using Tailwind CSS and Recharts for a property management dashboard displaying portfolio KPIs, an 8-week request resolution bar chart, and request breakdowns by status."
* **Result:** Generated the initial dashboard overview layout with responsive charts.

---

## 6. Prompt That Produced Flawed Output & How It Was Fixed

### Prompt 6.1: Request Creation UI Visibility (Failed Prompt)
* **Intent:** Add a creation modal to `Requests.jsx` allowing users to log new maintenance tickets.
* **Prompt:**
  > "Add a modal and a 'Log New Request' button to the `Requests.jsx` page so users can create maintenance requests."
* **What went wrong:**
  The AI rendered the "Log New Request" button universally for all logged-in roles without checking permissions. When testing with a `CONTRACTOR` account, the contractor could view the "Log New Request" action button, violating Requirement 1 (contractors should not create requests).
* **Fix & Adjustment:**
  Manually wrapped the action button inside a conditional authorization check checking the active session role (`{isManager && (<button>...</button>)}`) and verified that backend endpoints enforce strict role verification independently.