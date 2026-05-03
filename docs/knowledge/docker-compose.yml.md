# docker-compose.yml

## 1. Purpose
Defines the local development infrastructure required to run the Distributed Job Queue. It provisions PostgreSQL for persistence and Redis for the message broker/cache.

## 2. Why this approach?
Docker Compose ensures that every developer (and the AI agent) runs the exact same versions of Redis and PostgreSQL, avoiding the "works on my machine" problem. It's the standard for isolated local development.

## 3. What if this fails?
If Docker Compose fails to start, the API and Workers will not be able to connect to the database or queue. The application will crash on startup or throw connection timeouts. We use `healthcheck` blocks to ensure dependent services wait until DB and Redis are fully ready.

## 4. Alternatives considered
- Installing PostgreSQL and Redis locally: Rejected because it clutters the host machine and leads to version mismatches.
- Using cloud managed services for dev: Rejected due to cost and latency.

## 5. Internal Flow
- `docker-compose up -d` pulls the `postgres:15-alpine` and `redis:7-alpine` images.
- Starts containers with environment variables defined in `.env`.
- Exposes ports 5432 and 6379 to the host network.
- Creates persistent volumes (`postgres_data`, `redis_data`) so data survives container restarts.

## 6. Dependencies
- Requires Docker and Docker Compose installed on the host.

## 7. Rebuild Instructions
1. Ensure `.env` is configured with `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.
2. Run `docker-compose up -d --build`.

## 8. Change Log
- **2026-05-03**: Created initial configuration with Redis 7 and PostgreSQL 15, including persistent volumes and healthchecks.
