# src/jobs/processors/

## 1. Purpose
Contains the isolated business logic for processing specific job types (`send-email`, `process-image`, `generate-report`).

## 2. Why this approach?
Separating the actual business logic from the BullMQ Worker runtime ensures high testability. You can import these functions and unit test them purely as async functions without needing a Redis instance.
Furthermore, we have introduced a **20% artificial failure rate** into these processors. This strictly satisfies the "Advanced Testing & Breaking the System" requirement by continually forcing the system to demonstrate its retry and DLQ mechanisms during development.

## 3. What if this fails?
If a processor throws an error (simulated or real), BullMQ catches it. The job transitions to the `delayed` state according to our exponential backoff config (e.g., waiting 1s, then 2s, then 4s). If it exhausts all 3 attempts, it transitions to `failed` permanently.

## 4. Alternatives considered
- **Inline processing in the Worker:** Rejected. Putting switch/case statements and all business logic directly inside the BullMQ `new Worker(...)` constructor leads to massive, unmaintainable files.

## 5. Internal Flow
- `job.data` is destructured.
- A delay is simulated.
- An intentional error is thrown roughly 1 in 5 times.
- If successful, a JSON object is returned (which BullMQ stores as the job return value).

## 6. Dependencies
- Native `bullmq` types (`Job`).

## 7. Rebuild Instructions
1. Export a default async function taking `job: Job`.
2. Extract data, execute logic, throw on error, return result on success.

## 8. Change Log
- **2026-05-03**: Created the three mandatory processors with simulated chaos testing.
