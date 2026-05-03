# Deployment Guide - Distributed Job Queue

This guide provides step-by-step instructions for deploying the Distributed Job Queue system to production environments.

## 1. Architecture Overview
The system consists of three main tiers:
- **API (Producer):** Receives jobs and validates them.
- **Workers (Consumers):** Process background tasks.
- **Infrastructure:** PostgreSQL (Persistence) and Redis (Queueing/Coordination).

## 2. Prerequisites
- **Node.js:** v20+ (LTS)
- **Docker & Docker Compose:** For containerized deployment.
- **Infrastructure:**
  - Managed PostgreSQL (e.g., AWS RDS, GCP Cloud SQL).
  - Managed Redis (e.g., AWS ElastiCache, GCP Memorystore) - **Must support Redis 6.2+**.

## 3. Environment Configuration
Create a `.env` file based on `.env.example`.

| Variable | Description | Production Recommended |
| :--- | :--- | :--- |
| `POSTGRES_URL` | Full connection string | Use a private VPC endpoint |
| `REDIS_HOST` | Redis endpoint | Use managed Redis endpoint |
| `REDIS_PORT` | Redis port | Default 6379 |
| `PORT` | API Port | 3000 (standard) |
| `NODE_ENV` | Environment mode | `production` |

## 4. Deployment Strategies

### A. Containerized (Recommended)
The project includes a multi-stage `Dockerfile` optimized for production (alpine-based, minimal footprint).

1. **Build Image:**
   ```bash
   docker build -t job-queue-app .
   ```
2. **Deploy via Docker Compose:**
   Update `docker-compose.yml` to use your production environment variables.
   ```bash
   docker compose up -d
   ```

### B. Managed Services (AWS/GCP/Azure)
1. **Database:** Provision a PostgreSQL instance and run migrations:
   ```bash
   node src/db/migrations.js
   ```
2. **Queue:** Provision a Redis instance with `maxmemory-policy: noeviction` (crucial for job persistence).
3. **API:** Deploy the Docker image to a service like AWS ECS or GCP Cloud Run.
4. **Workers:** Deploy the same Docker image to a scalable cluster, overriding the start command:
   ```bash
   # Start Command for Workers
   node src/jobs/worker.js
   ```

## 5. Scaling Strategy
The system is designed for horizontal scaling.

- **Scaling API:** Use a Load Balancer (ALB/Nginx) to distribute traffic across multiple API containers.
- **Scaling Workers:** Simply increase the number of worker containers. BullMQ natively handles job distribution across multiple instances using Redis locks.
- **Concurrency:** Adjust the `concurrency` parameter in `src/jobs/worker.js` (currently set to 5) based on the CPU/RAM of your instances.

## 6. Monitoring & Health
- **Dashboard:** Access the Bull-Board UI at `https://your-domain.com/ui` to monitor queue health.
- **Metrics:** Use the `GET /metrics` endpoint for Prometheus/Grafana integration.
- **Health Checks:** Configure your orchestrator (ECS/Kubernetes) to monitor `GET /health`.

## 7. Security Best Practices
1. **Network Isolation:** Ensure Redis and PostgreSQL are only accessible from within the VPC.
2. **Rate Limiting:** The API includes native rate-limiting. Adjust the threshold in `src/api/server.js` if necessary.
3. **Idempotency:** Always encourage clients to use the `x-idempotency-key` to prevent duplicate processing during network retries.

## 8. Troubleshooting
- **Jobs Stuck in Waiting:** Check if at least one worker process is running and connected to Redis.
- **Redis Connection Failures:** Ensure `maxRetriesPerRequest: null` is set in the Redis config (this is handled in `src/config/redis.js`).
- **Postgres Lock Contention:** If processing extremely high volumes (>10k req/s), monitor Postgres connection pool usage and increase `max` connections in `src/db/index.js`.
