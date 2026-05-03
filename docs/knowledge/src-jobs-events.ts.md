# src/jobs/events.ts

## 1. Purpose
Provides a global event listener (`QueueEvents`) for the `default-job-queue`. It monitors jobs as they complete or fail, synchronizes their final status back to the PostgreSQL database, and implements the Dead Letter Queue (DLQ) routing logic.

## 2. Why this approach?
- **Decoupling:** Workers just throw errors or return values. The `events.ts` layer independently monitors these state changes. This ensures that DB logging and DLQ pushing don't slow down or clutter the fast-path of the worker processor.
- **DLQ implementation:** When a job fails, BullMQ naturally transitions it to a `failed` set in Redis. However, the spec demands an explicit Dead Letter Queue. By listening to the `failed` event, fetching the job, and comparing `attemptsMade` vs `maxAttempts`, we definitively identify permanent failures. We then inject the payload into a separate `deadLetterQueue` where a human operator (or future repair process) can inspect it.

## 3. What if this fails?
If the event listener crashes, jobs will process fine, but PostgreSQL will not be updated (jobs will remain marked as `pending` or `retrying` forever in the DB), and permanent failures will stay in the BullMQ `failed` set instead of moving to our custom DLQ. Restarting the event listener will not retroactively trigger these events, so this is a critical observability component.

## 4. Alternatives considered
- **Updating DB directly inside `processor`:** Rejected because it mixes business logic with system state management, and if the processor crashes entirely (OOM), the `finally` block might not run. `QueueEvents` operates at the Redis pub/sub layer, making it much more robust.

## 5. Internal Flow
- Listens to `completed`: Updates DB status to `completed` and writes a log entry.
- Listens to `failed`: Fetches the `Job` instance. If `attemptsMade >= maxAttempts`, it pushes the job to `deadLetterQueue` and marks DB as `failed`. Otherwise, marks DB as `retrying`.

## 6. Dependencies
- `bullmq` (`QueueEvents`, `Job`)
- `../db`

## 7. Rebuild Instructions
1. Instantiate `QueueEvents`.
2. Listen for `completed`.
3. Listen for `failed`. Calculate attempt exhaustion and route to `deadLetterQueue`.

## 8. Change Log
- **2026-05-03**: Created decoupled event listener with PostgreSQL sync and DLQ routing.
