# Local Development & Testing Guide

This guide explains how to run, test, and debug the Distributed Job Queue on your local machine.

## 1. Prerequisites
- **Node.js:** v20+
- **Docker Desktop:** For running local Redis and PostgreSQL.

## 2. Local Setup

1. **Start Infrastructure:**
   Ensure your local containers are running:
   ```bash
   sudo docker compose up -d
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/job_queue"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   PORT=3000
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Migrations:**
   ```bash
   node src/db/migrations.js
   ```

## 3. Running the System

### Option A: Manual (Recommended for Debugging)
Open two terminals:
- **Terminal 1 (API):** `node src/api/server.js`
- **Terminal 2 (Worker):** `node src/jobs/worker.js`

### Option B: Unified (Production Simulation)
```bash
npm start
```

## 4. Testing & Validation

### A. Automated E2E Test
Runs a full lifecycle test (Health -> Submit -> Process -> Idempotency -> Rate Limit):
```bash
node src/test/e2e-test.js
```

### B. Stress Test
Push the system to its limits:
```bash
npm run test:stress
```

### C. Chaos Testing
Simulate worker crashes to test resilience:
```bash
npm run test:chaos
```

## 5. Debugging Tips
- **Logs:** View real-time logs in the terminal.
- **UI:** Visit `http://localhost:3000/ui` to see the job dashboard.
- **DB:** Use any PG client to inspect the `jobs` and `job_logs` tables.
