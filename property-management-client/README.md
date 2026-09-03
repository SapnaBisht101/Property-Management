# Property Management Client

The frontend is a React single-page application built with Vite. It provides the browser interface for the property management API in the parent project.

## Screens and Routes

- `/login`: sign in with a property manager or contractor account.
- `/dashboard`: property manager metrics and request/rent summaries.
- `/units`: property manager unit management.
- `/rent`: property manager bulk rent processing and CSV export.
- `/requests`: maintenance request search, filtering, assignment, and status updates.

Dashboard, units, and rent routes are restricted to property managers. Maintenance requests are available to authenticated users, with contractors receiving their assigned request view.

## Backend Dependency

Start the backend from the parent directory before using the client:

```bash
npm start
```

The client currently uses the fixed API base URL `http://localhost:5001/api`, configured in `src/api/client.js`. The backend must therefore be available on port `5001` during local development.

## Install and Run

```bash
npm install
npm run dev
```

Vite normally serves the client at `http://localhost:5173`.

Available scripts:

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

## Authentication

After a successful login, the client stores the returned JWT and user information in browser `localStorage`. Axios adds the token as a bearer token on API requests. A `401` response clears the stored session and redirects to `/login`.

For demo accounts and full project setup, see the [root project README](../README.md).
