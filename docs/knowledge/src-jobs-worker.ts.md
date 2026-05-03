# src/jobs/worker.ts

## 1. Purpose
Initializes a BullMQ `Worker` instance to consume and process jobs from the `default-job-queue`. It acts as the routing layer, mapping the incoming `job.name` to the correct isolated processor function.

## 2. Why this approach?
We separate the worker setup from the processors. By defining a mapping object (`processors`), the actual `new Worker` constructor logic remains extremely thin. We also set `concurrency: 5`, allowing a single Node.js process to handle up to 5 async jobs simultaneously, maximizing throughput without blocking the event loop excessively.

## 3. What if this fails?
If the worker crashes, the Node process exits. BullMQ ensures that any jobs currently being processed by this worker are released back to the queue (after a stall timeout) so another worker instance can pick them up. This guarantees "at-least-once" delivery even under severe crash scenarios.

## 4. Alternatives considered
- `concurrency: 1`: Safe but slow. We use 5 because our simulated jobs are mostly I/O bound (waiting on delays/timers), so Node's event loop can easily handle multiples.

## 5. Internal Flow
- Imports isolated processors.
- Connects to `redisConnection`.
- Starts pulling jobs.
- Dispatches execution.
- Returns result back to BullMQ (or throws error).

## 6. Dependencies
- `bullmq`
- `./processors/*`

## 7. Rebuild Instructions
1. Instantiate `Worker(QUEUE_NAME, async (job) => {...})`.
2. Map `job.name` to a function.
3. Pass `concurrency` option.

## 8. Change Log
- **2026-05-03**: Built the main worker with routing map and concurrency control.
