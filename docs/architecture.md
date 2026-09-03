# System Architecture

## Overview & System Topology

The Property Rental & Maintenance system is built on a standard decoupled MERN stack architecture:

* **Frontend:** React SPA built with Vite and styled using Tailwind CSS, deployed on Vercel.
* **Backend:** Node.js server using Express framework for RESTful API endpoints, deployed on Render.
* **Database:** MongoDB Atlas multi-tenant transactional document store.
* **Authentication:** Stateless JWT (JSON Web Tokens) stored in HttpOnly cookies / Authorization headers.
┌─────────────────────────┐        HTTP / REST (JSON)        ┌─────────────────────────┐
│       React SPA         │ ───────────────────────────────> │     Express.js API      │
│  (Tailwind CSS / Vite)   │ <─────────────────────────────── │     (Node.js Runtime)   │
└─────────────────────────┘                                  └────────────┬────────────┘
│
Mongoose │ ORM
▼
┌─────────────────────────┐
│      MongoDB Atlas      │
└─────────────────────────┘


---

## Moving Pieces & Communication

1. **Client (Browser / React SPA):**
   * Handles user interaction, local state, form validations, and routing via React Router.
   * Communicates asynchronously with the backend API via `axios` or native `fetch`.
   * Enforces role-specific UI rendering (e.g., hiding bulk rent upload controls from Contractors).

2. **Server (Node.js + Express API):**
   * **Authentication & Authorization Middleware:** Intercepts requests, verifies JWT token signatures, and enforces server-side Role-Based Access Control (RBAC).
   * **State Machine Validation Layer:** Enforces valid lifecycle transitions (`Reported` → `Triaged` → `Scheduled` → `Resolved`) and conditional business rules before writing to MongoDB.
   * **Audit Logger Subsystem:** Intercepts maintenance updates and automatically appends immutable events into the timeline collection.

3. **Database (MongoDB Atlas):**
   * Stores relational domain models in document collections using MongoDB cross-document references (`ObjectId`).
   * Enforces strict index uniqueness on emails, unit numbers, and monthly alert dismissals.

---

## End-to-End Request Path

### Representative Action: Moving a Maintenance Request to `Scheduled`

[React SPA] ───(1) PUT /api/requests/:id/status ───> [Auth & RBAC Middleware]
│ (2) Validates JWT & Role
▼
[Request Validation Controller]
│ (3) Checks State Transition Rules
│     & Contractor Assignment
▼
[Mongoose DB Session]
│ (4) Update Request Status
│ (5) Insert Immutable Log
▼
[React SPA] <───(6) HTTP 200 OK + Payload ─────────────── [MongoDB Atlas]


1. **Client Action:** Property Manager selects a contractor and changes request status to `Scheduled` in the UI.
2. **Network Request:** `PUT /api/requests/64f1a.../status` sent with body `{ "status": "Scheduled" }` along with bearer token.
3. **Authentication & Authorization:**
   * Server middleware `authenticateUser` parses and verifies the JWT.
   * Middleware `requireRole(['PROPERTY_MANAGER'])` verifies the user's role. If unauthorized, returns `403 Forbidden`.
4. **State Machine & Rule Enforcement:**
   * Controller verifies current status is `Triaged`.
   * Controller checks `assignedContractors.length > 0`. If no contractor is assigned, returns `400 Bad Request` with message *"Cannot schedule request without assigned contractors."*
5. **Database Mutation & Audit Trail:**
   * Updates `status` on `maintenance_requests` document.
   * Appends a new document to `request_timelines` logging: `{ actionType: "STATUS_CHANGE", oldStatus: "Triaged", newStatus: "Scheduled", actorId: req.user._id }`.
6. **Response:** Server returns `200 OK` with updated request payload; client updates UI state.

---

## Architectural Choices & What We Decided NOT to Build

* **Decoupled Architecture over Monolith (SSR):** Selected a separated React frontend and Express REST API to cleanly separate rendering concerns from business rule enforcement.
* **No WebSockets for Real-Time Updates:** Used standard REST endpoints with client-side re-fetching on interaction instead of WebSockets, staying within the 12-hour build budget.
* **Soft Deletes for Units:** Decided to soft-archive units using an `isArchived` flag rather than hard deleting, maintaining complete historical context for past rent payments and maintenance requests.
* **No Direct File Storage / S3 Bucket Integration:** Decided not to add physical photo storage to maintain focus on the core 10 requirements and zero-cost hosting deployment.