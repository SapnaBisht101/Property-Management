# Property Management

A small full-stack property management application for rental units, rent payments, and maintenance requests.

## Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Recharts, and Axios
- Backend: Node.js, Express 5, and JWT authentication
- Database: MongoDB with Mongoose
- Local defaults: API on `http://localhost:5001` and client on `http://localhost:5173`

## Project Structure

```text
.
|-- config/                       MongoDB connection
|-- middleware/                   Authentication and role middleware
|-- models/                       Mongoose schemas
|-- routes/                       Express API routes
|-- docs/                         Architecture, schema, and planning notes
|-- server.js                     Backend entry point
|-- seed.js                       Local demo data seeder
|-- package.json                  Backend scripts and dependencies
`-- property-management-client/   React/Vite frontend
    `-- src/
        |-- api/                  Axios client
        |-- context/              Authentication context
        |-- pages/                Dashboard, units, rent, login, and requests
        |-- App.jsx               Client routes and navigation
        `-- main.jsx              React entry point
```

## Prerequisites

- Node.js and npm
- MongoDB running locally, or a reachable MongoDB instance

The backend reads these variables from `.env`:

```env
MONGO_URI=mongodb://localhost:27017/property_management
JWT_SECRET=replace_with_a_local_secret
```

The repository's existing `.env` values are suitable only for local development. Do not use the sample JWT secret or demo passwords in a deployed environment.

## Install

Install backend dependencies from the repository root:

```bash
npm install
```

Install frontend dependencies:

```bash
cd property-management-client
npm install
cd ..
```

## Run Locally

Start MongoDB first, then use two terminal windows.

Backend, from the repository root:

```bash
npm start
```

The backend listens on port `5001` by default. For automatic restart during development:

```bash
npm run dev
```

Frontend, from `property-management-client`:

```bash
npm run dev
```

Open `http://localhost:5173`. The frontend currently sends API requests to `http://localhost:5001/api`; this URL is defined in `src/api/client.js`.

## Seed Demo Data

To reset the local demo data and create sample users, units, and maintenance requests:

```bash
node seed.js
```

The seeder deletes existing documents from the `users`, `units`, and `maintenance_requests` collections before inserting its sample records. Use it only against a disposable development database.

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Property manager | `manager@example.com` | `manager123` |
| Contractor | `contractor@example.com` | `contractor123` |

## Application Roles

- Property managers can use the dashboard, manage units, process bulk rent payments, export the current rent roll, create maintenance requests, assign contractors, and update request status.
- Contractors can sign in and view maintenance requests assigned to them.
- API requests require a bearer token returned by `POST /api/auth/login`.

## Maintenance Lifecycle

Requests follow these transitions:

```text
Reported -> Triaged -> Scheduled -> Resolved
Resolved -> Triaged
```

A request must have at least one assigned contractor before it can move to `Scheduled`. Maintenance status changes and contractor assignments create timeline records.

## API Overview

All protected endpoints require an `Authorization: Bearer <token>` header.

| Area | Endpoints and purpose |
| --- | --- |
| Health | `GET /` confirms that the backend is operational. |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/contractors`. |
| Units | `GET /api/units`, `POST /api/units`, and `PATCH /api/units/:id/archive`. |
| Requests | `GET /api/requests` supports search, filters, sorting, and pagination; `POST /api/requests` creates a request; `PATCH /api/requests/:id/status` changes status; `PATCH /api/requests/:id/assign` assigns contractors; `GET /api/requests/:id/timeline` returns history. |
| Rent | `POST /api/rent/bulk` records a batch and classifies entries as matched, underpaid, overpaid, or unmatched; `GET /api/rent/export-csv` downloads the current rent roll. |
| Dashboard | `GET /api/dashboard` returns request and current-month rent metrics. |

## Validation Commands

From the frontend directory:

```bash
npm run build
npm run lint
npm run preview
```

From the backend directory, `npm test` is currently a placeholder and exits with an error because no backend test suite is configured.

## Troubleshooting

- MongoDB connection errors: confirm MongoDB is running and that `MONGO_URI` points to the intended database.
- Authentication failures: confirm `JWT_SECRET` is set and that the client is sending the token returned by login.
- Frontend API errors: confirm the backend is running on port `5001`. The frontend API URL is currently hard-coded for local development.
- Port conflicts: set the backend `PORT` environment variable to another port, then update `src/api/client.js` to match before starting the client.
- CORS errors: the backend currently allows the local frontend origin `http://localhost:5173`.