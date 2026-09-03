# Production Deployment Submission

## Live Deployment Links
- **Frontend (Vercel):** https://property-management-client-wine.vercel.app
- **Backend API (Render):** https://property-management-api-ii0w.onrender.com
- **GitHub Repository:** https://github.com/SapnaBisht101/Property-Management

## Architecture Overview
- **Database:** MongoDB Atlas
- **Backend:** Node.js / Express API deployed on Render
- **Frontend:** React / Vite client deployed on Vercel
- **Authentication:** JWT with Role-Based Access Control (RBAC)

## Demo Login Credentials

### 1. Property Manager
- **Email:** manager@example.com
- **Password:** manager123
- **Access:** Full administrative privileges (dashboard stats, request creation/assignment, unit controls).

### 2. Maintenance Contractor
- **Email:** contractor@example.com
- **Password:** contractor123
- **Access:** Restricted privileges (viewing assigned maintenance tasks and updating work progress status).

## Deployment & Hosting Notes
- **Cold Starts:** Render's free web service spins down after 15 minutes of inactivity. Initial API calls after a period of idle time may require 50–60 seconds for the instance to spin up.
- **CORS & Environment Settings:** Configured with dynamic base URL injection (`https://property-management-api-ii0w.onrender.com/api`) for seamless cross-origin request handling.