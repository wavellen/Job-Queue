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
- `x-idempotency-key` (Optional): A unique UUID string. If provided, the system ensures this specific job is only processed once.

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

**Response (202 Accepted):**
```json
{
  "id": "8afa4542-1f1f-423a-bed3-8e711f2ff133",
  "status": "enqueued"
}
```

---

### [GET] `/jobs/:id` - Check Job Status
Fetch the current state of a job from the database.

---

### [GET] `/health` - Infrastructure Health
Verifies connectivity to PostgreSQL and Redis.

---

## 3. Resilience Parameters
- **Retries:** Every job automatically retries **3 times** on failure.
- **Backoff:** Uses **Exponential Backoff** (1s, 2s, 4s...) to avoid hammering failing external services.
- **DLQ:** Jobs that fail all 3 retries are moved to the **Dead Letter Queue (DLQ)** for manual inspection via the UI.
- **Rate Limit:** The API is protected by a threshold of **100 requests per minute per IP**.
