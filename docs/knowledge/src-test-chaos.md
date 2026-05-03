# src/test/stress-test.yaml & chaos-killer.ts

## 1. Purpose
These scripts fulfill the mandatory "Advanced Testing & Breaking the System" requirement from the architecture spec. 
- `stress-test.yaml`: Configures Artillery to blast the API with up to 200 requests per second, simulating high burst traffic.
- `chaos-killer.ts`: A Chaos Monkey script that randomly seeks out the active worker process and sends a `SIGKILL` (-9), forcibly terminating it mid-execution.

## 2. Why this approach?
We cannot assume a distributed system works until we break it. 
- The stress test verifies that Fastify can handle high throughput, our database connection pool (`max: 20`) is sufficient, and BullMQ doesn't drop jobs under heavy Redis load.
- The Chaos Killer specifically targets the hardest failure scenario: A worker crashing *while* holding a job. By verifying that BullMQ detects the stalled job (via Redis lock expiration) and safely returns it to the queue, we prove "at-least-once" delivery semantics.

## 3. What if this fails?
- **Stress Test failure:** If the API returns 500s, it usually means the PostgreSQL connection pool is exhausted or Redis is throttling. We would need to increase `max` in `dbPool` or scale horizontally.
- **Chaos failure:** If jobs are lost when a worker is killed, it means our lock duration or stalled interval is misconfigured. BullMQ defaults usually handle this perfectly.

## 4. Alternatives considered
- `k6`: Also excellent, but Artillery's YAML format is extremely readable for queue endpoint load testing.

## 5. Internal Flow
- Artillery gradually ramps up simulated users hitting `POST /jobs`.
- Concurrently, `chaos-killer.ts` loops, waiting 10-30s, greps for the worker PID, kills it without warning, and restarts it 5s later.

## 6. Dependencies
- `artillery` (dev dependency)
- Node `child_process`

## 7. Rebuild Instructions
1. Define phases in `stress-test.yaml` (warmup, ramp up, sustained load).
2. Write an infinite loop in Node that finds the process ID via `ps -ax` and runs `kill -9`.

## 8. Change Log
- **2026-05-03**: Built the final chaos engineering validation suite.
