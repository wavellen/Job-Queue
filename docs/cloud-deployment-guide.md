# Cloud Deployment Guide (Production)

This guide details the production architecture and deployment steps for the Distributed Job Queue using external managed databases.

## 1. Production Architecture
The system is optimized to run as a **Unified Node** on a cloud provider (e.g., Railway, Render, Fly.io) while utilizing specialized external providers for data persistence.

- **Application (Railway):** Runs a single container that boots both the API and Worker.
- **Persistence (Supabase):** Managed PostgreSQL for audit logs and job state.
- **Queueing (Upstash):** Managed Redis (Serverless) for low-latency job coordination.

## 2. Infrastructure Setup

### A. Database (Supabase)
1. Create a project on [Supabase](https://supabase.com).
2. Go to **Project Settings** -> **Database**.
3. Copy the **Connection String** (URI format).

### B. Redis (Upstash)
1. Create a database on [Upstash](https://upstash.com).
2. Ensure you copy the **Node.js (ioredis)** connection string starting with `rediss://`.

## 3. Deployment Steps (Railway Example)

1. **Link Repository:** Connect your GitHub repository to Railway.
2. **Configure Variables:** Add the following environment variables to your service:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `POSTGRES_URL`: `postgresql://postgres:[password]@[host]:5432/postgres`
   - `REDIS_URL`: `rediss://default:[password]@[host]:6379`
3. **Automatic Deployment:** Railway will detect the `Dockerfile` and execute `npm start` (which runs `start-production.sh`).

## 4. Operational Commands

### Running Migrations
Before the first deployment, run migrations against the production database from your local terminal:
```bash
POSTGRES_URL="your-production-url" node src/db/migrations.js
```

### Monitoring the Queue
Access the Bull-Board UI via your production URL:
`https://your-app-name.up.railway.app/ui`

## 5. Scaling in Production
To scale processing power, simply increase the **Replica Count** of your cloud service. Each replica will run both an API and a Worker, horizontally scaling both throughput and processing capacity.
