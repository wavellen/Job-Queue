# src/config/redis.ts

## 1. Purpose
Initializes a singleton `ioredis` connection specifically tailored for BullMQ.

## 2. Why this approach?
BullMQ strongly recommends using `ioredis` with `maxRetriesPerRequest: null` to avoid issues with blocking commands (like `BLPOP`) which it uses to poll for jobs efficiently. Using a centralized connection prevents connection leaks and ensures that all queues reuse the same robust connection settings.

## 3. What if this fails?
If Redis is down or unreachable, the `error` event will log the failure. BullMQ queues initialized with this connection will fail to enqueue jobs, and the API will reject new job submissions. The worker nodes will similarly fail to poll for jobs.

## 4. Alternatives considered
- Standard `redis` package: BullMQ explicitly uses and requires `ioredis` due to its robust handling of cluster modes, sentinels, and complex Lua script execution.
- Inline connection: Rejected. We separate it here so that producers, workers, and events listeners can import the exact same connection configuration.

## 5. Internal Flow
- Imports `ioredis` and `dotenv`.
- Instantiates a `Redis` client with `maxRetriesPerRequest: null`.
- Attaches basic error/connect event listeners for observability.

## 6. Dependencies
- `ioredis`
- `dotenv`

## 7. Rebuild Instructions
1. Install `ioredis`.
2. Export a `new Redis(options)` with `maxRetriesPerRequest` explicitly set to `null`.

## 8. Change Log
- **2026-05-03**: Created the centralized Redis connection.
