# src/api/schemas.ts, routes.ts, server.ts

## 1. Purpose
These files constitute the API Server (Producer) layer. They initialize a Fastify HTTP server (`server.ts`), define REST endpoints (`routes.ts`), and validate incoming payloads using Zod (`schemas.ts`).

## 2. Why this approach?
- **Fastify:** Chosen for its extremely low overhead and high performance.
- **Zod Schema Validation:** Fulfills the strict requirement to define concrete job types (`send-email`, `process-image`, `generate-report`) and validate their schemas before accepting them. Rejecting malformed jobs at the API edge prevents worker crashes.
- **HTTP 202 Accepted:** We return `202 Accepted` because the job is queued for asynchronous processing, not completed immediately.

## 3. What if this fails?
- **Invalid Payload:** `ZodError` is caught and returns HTTP 400.
- **Queue/DB failure during enqueue:** The API catches the error and returns HTTP 500 (or 409 for Idempotency conflicts). The client must retry.
- **Server crash:** Nginx or PM2/Docker will restart it. Active connections will drop.

## 4. Alternatives considered
- Express.js: Rejected because Fastify is faster and provides a better developer experience with built-in async/await routing.
- Manual JSON validation: Rejected because Zod provides runtime safety and clear error messages automatically.

## 5. Internal Flow
- `POST /jobs` receives body -> Validates top-level structure -> Validates specific payload via Zod -> Calls `QueueService.enqueueJob` -> Returns `jobId` and status.
- `GET /health` pings both PostgreSQL and Redis to ensure the infrastructure is healthy.

## 6. Dependencies
- `fastify`
- `zod`
- `QueueService`

## 7. Rebuild Instructions
1. Setup Fastify instance.
2. Define `/health` pinging DB and Redis.
3. Define `/jobs` POST with Zod payload validation.

## 8. Change Log
- **2026-05-03**: Built the core Fastify API, validation schemas, and routing logic.
