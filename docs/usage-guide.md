# Distributed Job Queue - Usage Guide

This document explains how to interact with the Job Queue system, understand its parameters, and manage background jobs effectively.

## 1. System Access
- **Local API:** `http://localhost:3000`
- **Cloud API:** `https://your-app-name.up.railway.app`
- **Job Dashboard (UI):** `/ui` (e.g., `https://your-app.up.railway.app/ui`)
  - Use the UI to monitor real-time queue state, inspect failed jobs, and view completion metrics.

## 2. API Endpoints

### [POST] `/jobs` - Submit a New Job
Use this endpoint to offload work to the background.

**Headers:**
- `Content-Type: application/json`
- `x-api-key`: **Required**. Your production access key.
- `x-idempotency-key` (Optional): A unique UUID string. If provided, the system ensures this specific job is only processed once.
- `x-request-id` (Optional): A tracking ID for distributed tracing. If not provided, the system generates one.

**Body Parameters:**
- `type`: The job type.
- `payload`: Data required for the job.
- `priority` (Optional): Integer between **1 (Highest)** and **5 (Lowest)**. Defaults to no priority (BullMQ default).

**Payload Examples:**

#### A. Send Email Job
```json
{
  "type": "send-email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "Thank you for joining our platform."
  }
}
```

#### B. Process Image Job
```json
{
  "type": "process-image",
  "payload": {
    "imageUrl": "https://example.com/photo.jpg",
    "width": 1920,
    "height": 1080,
    "format": "webp"
  }
}
```

#### C. High-Priority Report
```json
{
  "type": "generate-report",
  "priority": 1,
  "payload": {
    "reportType": "daily",
    "userId": "8afa4542-1f1f-423a-bed3-8e711f2ff133"
  }
}
```

**Response (202 Accepted):**
```json
{
  "id": "8afa4542-1f1f-423a-bed3-8e711f2ff133",
  "status": "enqueued"
}
```

---

### [GET] `/jobs` - List All Jobs (Paginated)
Fetch a list of jobs with filtering options.

**Query Parameters:**
- `limit` (Optional): Number of jobs to return (default: 10).
- `offset` (Optional): Number of jobs to skip (default: 0).
- `status` (Optional): Filter by status (e.g., `pending`, `completed`, `failed`).
- `type` (Optional): Filter by job type (e.g., `send-email`).

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 125,
    "limit": 10,
    "offset": 0
  }
}
```

---

### [GET] `/jobs/:id` - Check Job Status
Fetch the current state of a single job from the database.

---

### [GET] `/health` - Infrastructure Health
Verifies connectivity to PostgreSQL and Redis. (Publicly accessible).

---

## 3. Integration Example (SDK-style)
Here is how you can integrate the Job Queue into your application using standard `fetch`.

```javascript
const JOB_API_URL = 'http://localhost:3000';
const API_KEY = 'your-secret-key';

async function submitJob(type, payload, idempotencyKey = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  if (idempotencyKey) {
    headers['x-idempotency-key'] = idempotencyKey;
  }

  const response = await fetch(`${JOB_API_URL}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Job submission failed: ${errorData.error} - ${errorData.message}`);
  }

  return await response.json();
}

// Usage
submitJob('send-email', { to: 'user@example.com', subject: 'Hello', body: 'World' })
  .then(res => console.log('Job enqueued:', res.id))
  .catch(err => console.error(err));
```

## 4. Resilience Parameters
- **Retries:** Every job automatically retries **3 times** on failure.
- **Backoff:** Uses **Exponential Backoff** (1s, 2s, 4s...) to avoid hammering failing external services.
- **DLQ:** Jobs that fail all 3 retries are moved to the **Dead Letter Queue (DLQ)** for manual inspection via the UI.
- **Rate Limit:** The API is protected by a threshold of **100 requests per minute per IP**.
