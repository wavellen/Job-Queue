# src/services/queueService.ts

## 1. Purpose
Provides the business logic for enqueueing new jobs and checking their status. It coordinates state between PostgreSQL (persistence) and BullMQ (execution).

## 2. Why this approach?
We use a two-phase commit approach (sort of):
1. **PostgreSQL First:** We insert the job into the `jobs` table to guarantee long-term persistence, auditability, and generate a UUID. If the client provides a UUID, Postgres enforces uniqueness via Primary Key, inherently satisfying the **Idempotency** requirement.
2. **BullMQ Second:** We push the job to BullMQ using the generated/provided UUID as the `jobId`. BullMQ prevents adding duplicates if a job with the same ID is already waiting or active.

## 3. What if this fails?
- **Postgres fails:** The API will return an error 500, the job is never queued. The client can retry.
- **BullMQ fails after Postgres succeeds:** The job is stuck in `pending` state in PostgreSQL forever but not in Redis. (We will need a periodic cron task in the future to sweep stuck DB jobs, but for Phase 2, this edge case is acknowledged).
- **Duplicate ID:** PostgreSQL throws code `23505`, preventing duplicate submission.

## 4. Alternatives considered
- **BullMQ only:** Rejected. BullMQ is an in-memory queue (mostly). While it persists to Redis, jobs expire. For billing/auditing, we need PostgreSQL.

## 5. Internal Flow
- `enqueueJob`: Checks for `options.jobId`. Inserts into `jobs`. Adds to `jobQueue` using the DB `id`.
- `getJobStatus`: Checks BullMQ for immediate state. Falls back to PostgreSQL if the job was completed/removed from Redis.

## 6. Dependencies
- `../jobs/queue`
- `../db`

## 7. Rebuild Instructions
1. Implement DB insert query returning `id`.
2. Catch unique constraints for idempotency.
3. Call `jobQueue.add` passing the `id` as `jobId`.

## 8. Change Log
- **2026-05-03**: Created QueueService with idempotency handling.
