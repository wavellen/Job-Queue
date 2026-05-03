# src/jobs/queue.ts

## 1. Purpose
Initializes the BullMQ `Queue` instances (`default-job-queue` and `dead-letter-queue`). It establishes the baseline configuration for all jobs, including default retry attempts and exponential backoff settings.

## 2. Why this approach?
Centralizing the queue definitions ensures that producers (API) and consumers (Workers) reference the exact same queue names and Redis connections. Setting `defaultJobOptions` here guarantees that every job inherits resilience (3 retries, exponential backoff) even if the API forgets to specify it, fulfilling the strict failure handling requirements.

## 3. What if this fails?
If queue instantiation fails, the application will crash on startup because it cannot connect to Redis. If jobs are added but Redis fails midway, BullMQ relies on Redis persistence to ensure the job isn't lost if it was already saved.

## 4. Alternatives considered
- Native Redis LPUSH/RPOP: Rejected. BullMQ handles atomic locking, delayed execution, and backoff internally using complex Lua scripts, saving us from rewriting a state machine.
- Multiple separated queues for each job type: Rejected for simplicity in Phase 2. We use a single `default-job-queue` and route internally based on `job.name`. This is simpler to scale until throughput demands partition by job type.

## 5. Internal Flow
- Imports the singleton `redisConnection`.
- Creates `jobQueue` with exponential backoff defaults.
- Creates `deadLetterQueue` (DLQ) which will be populated later by the worker logic when jobs fail all attempts.

## 6. Dependencies
- `bullmq`
- `../config/redis`

## 7. Rebuild Instructions
1. Import `Queue` from `bullmq`.
2. Instantiate with connection and `defaultJobOptions.backoff`.

## 8. Change Log
- **2026-05-03**: Initialized Default Queue and Dead Letter Queue.
