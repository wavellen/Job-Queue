# Distributed Job Queue - User Manual

This manual provides a comprehensive guide on how to use and manage the Distributed Job Queue system.

## 1. Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: Managed instance (e.g., Supabase) or local
- **Redis**: Managed instance (e.g., Upstash) or local

### Environment Setup
Create a `.env` file based on `.env.example`:
```bash
PORT=3000
DATABASE_URL=your_postgresql_url
REDIS_URL=your_redis_url
API_KEY=your_secret_key
```

---

## 2. API Authentication
All API requests (except `/health`) require an API key passed in the headers.

**Header:** `x-api-key: your_secret_key`

---

## 3. Core Features & Usage

### A. Submitting a Job
**Endpoint:** `POST /jobs`

**Headers:**
- `Content-Type: application/json`
- `x-api-key`: Required
- `x-idempotency-key`: Optional (prevents duplicate processing)
- `x-request-id`: Optional (for distributed tracing)

**Example Payload:**
```json
{
  "type": "send-email",
  "priority": 1,
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome",
    "body": "Hello World!"
  }
}
```

### B. Monitoring Jobs
**Endpoint:** `GET /jobs/:id`  
Check the status, error messages, and timestamps of a specific job.

**Endpoint:** `GET /jobs`  
List all jobs with pagination and filtering.
- `limit`: default 10
- `offset`: default 0
- `status`: filter by status (pending, completed, failed)

### C. Health & Metrics
- **Health Check:** `GET /health` (Public)
- **Queue Metrics:** `GET /metrics` (Requires Auth)

---

## 4. Advanced Reliability

### Backpressure Handling
The system automatically rejects new jobs if the queue depth exceeds **10,000 items**. If you receive a `503 QUEUE_OVERLOADED` error, wait for the workers to catch up before retrying.

### Reconciliation (Self-Healing)
A background process runs every **5 minutes** to ensure Postgres and Redis stay in sync. If a job is committed to the database but fails to reach Redis, the system will automatically re-enqueue it.

### Dead Letter Queue (DLQ)
Jobs that fail all 3 retry attempts are moved to the DLQ. You can inspect and retry these jobs via the **Job Dashboard**.

---

## 5. Job Dashboard (UI)
Access the visual dashboard at: `http://localhost:3000/ui` (or your production domain).
- Monitor real-time throughput.
- Inspect job payloads and stack traces for failures.
- Manually trigger retries for failed jobs.

---

## 6. Integration Example (JavaScript)
```javascript
async function enqueue(type, data) {
  const response = await fetch('https://your-api.up.railway.app/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-secret-key'
    },
    body: JSON.stringify({ type, payload: data })
  });
  return await response.json();
}
```
