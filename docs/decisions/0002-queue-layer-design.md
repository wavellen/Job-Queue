# Decision Record: 0002 - Queue Layer and Producer API Design

## Context
We need to establish how jobs are accepted from clients and pushed into the queue, ensuring validation, rate limiting (future phase), and idempotency.

## Decision
- **API Framework:** Fastify.
- **Validation:** Zod schemas.
- **Queue Technology:** BullMQ with `ioredis`.
- **Idempotency Strategy:** Two-phase commit using PostgreSQL as the source of truth for IDs.

## Why this approach?
- Fastify is chosen for its speed. Zod enforces strict typing at the edge, preventing malformed payloads from crashing workers.
- BullMQ is highly reliable. We configure `maxRetriesPerRequest: null` as strictly required by BullMQ's polling mechanisms.
- **Idempotency:** By generating the job ID in PostgreSQL *first*, or accepting a client-provided UUID and inserting it into a unique primary key column, we guarantee that no duplicate job processing can be initiated. If the insert succeeds, we pass that ID to BullMQ. BullMQ natively respects the `jobId` and prevents duplicates.

## What if this fails?
- If the Redis connection drops, BullMQ queues will pause, and new job additions will fail. The API catches this and returns a 500 error.
- If PostgreSQL drops, the idempotency check and long-term logging fail, also resulting in a 500 error.
- Zod catches malformed data and safely returns a 400 Bad Request, protecting the internal system.

## Alternatives Considered
- Express.js: Slower than Fastify.
- Generating IDs strictly in Redis (BullMQ defaults): BullMQ generates IDs sequentially if not provided, but this doesn't help with true client-side idempotency across network retries. Using DB UUIDs is far more robust.
