# Architectural & Design Decisions

## Decision 1: Hybrid State Machine Enforcement (Server-First with UI Guardrails)

* **Context:** Requirement 4 mandates a strict maintenance request lifecycle (*Reported → Triaged → Scheduled → Resolved*), requiring that requests cannot be scheduled without an assigned contractor and reopening returns status to *Triaged*.

* **Options Considered:**
  1. Frontend-only UI restriction (disabling illegal dropdown options in React).
  2. Pure server-side validation rejecting invalid state payloads with explicit `400 Bad Request` messages.
  3. Hybrid approach: Server-enforced state machine paired with UI-filtered action options.
* **Decision:** Option 3 (Hybrid approach).
* **Rationale:** Relying solely on client-side logic makes system integrity vulnerable to API inspection tools like Postman or curl. The backend enforces transition logic independently, while the UI dynamically computes allowed next states based on current request state, preventing bad requests before they happen.

---

## Decision 2: Embedded Document Array vs. Separate Collection for Request Timelines

* **Context:** Requirement 9 requires an immutable timeline tracking all status changes, actor details, assignments, and notes for every maintenance request.
* **Options Considered:**
  1. Embed timeline events directly inside the `Request` document schema as an array of subdocuments.
  2. Create a separate `AuditLog` collection and reference `requestId`.
* **Decision:** Option 1 (Embedded subdocument array).
* **Rationale:** Maintenance requests typically accumulate fewer than 50 timeline events over their entire lifecycle. Embedding the array inside the `Request` document guarantees atomic updates (saving request updates and timeline entries in a single query) and eliminates expensive database JOINs when rendering request histories.

---

## Decision 3: Server-Side Query Execution for Request Search, Filtering, and Pagination

* **Context:** Requirement 6 requires multi-criteria search, filtering, sorting, and pagination across all maintenance requests and specifies that filtering must happen on the server.
* **Options Considered:**
  1. Fetch all requests in a single payload and filter/paginate client-side using JavaScript `Array.prototype.filter()`.
  2. Server-side pipeline using MongoDB `$regex`, `$match`, `$sort`, `$skip`, and `$limit`.
* **Decision:** Option 2 (Server-side MongoDB pipeline).
* **Rationale:** Client-side processing degrades rapidly as portfolio volume grows and exposes data belonging to unauthorized units. Offloading search, sort, and pagination parameters (`search`, `status`, `priority`, `page`, `limit`) to the database ensures scale stability and enforces security boundaries before data leaves the server.

---

## Decision 4: Granular Error Classification Response Model for Bulk Rent Processing

* **Context:** Requirement 7 requires bulk recording of monthly rent payments and returning per-unit classifications (*matched*, *underpaid*, *overpaid*, or *unmatched*).
* **Options Considered:**
  1. Fail the entire transaction if any single row contains an error (atomic all-or-nothing).
  2. Process valid rows and fail invalid ones silently.
  3. Process the full batch in a single pass and return an itemized classification response object listing status for each row.
* **Decision:** Option 3 (Itemized classification response).
* **Rationale:** Real-world property managers process batch payments containing mixed checks or manual entries. An itemized response gives immediate visibility into underpayments and missing unit records without stopping valid payments from recording.

---

## Decision 5 (REVERSED): Maintenance Request Creation Permissions

* **Context:** Requirement 1 specifies role capabilities for Property Managers and Maintenance Contractors.
* **Initial Decision:** Allow both Property Managers and Maintenance Contractors to create new maintenance requests from the UI.
* **Reversal & Final Decision:** Restrict maintenance request creation capabilities to **Property Managers only**.
* **Reason for Reversal:** While contractors can update status and append notes to assigned requests (Requirement 3), allowing contractors to create brand-new requests introduced security and logical flaws—contractors could log requests against unassigned units across the portfolio, bypassing manager oversight and scope limits. Restricting creation to Property Managers enforces proper operational hierarchy and prevents unauthorized portfolio visibility.