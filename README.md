# Distributed Job Queue

A production-grade, highly scalable background job processing system built with **Node.js**, **Express**, **BullMQ**, **Redis**, and **PostgreSQL**.

Traditional synchronous APIs struggle under long-running or burst-heavy workloads. This project explores how distributed queue systems improve scalability, reliability, and throughput using asynchronous processing patterns.

The system is designed around distributed workers, Redis-backed queues, job orchestration workflows, retry mechanisms, and operational visibility tooling. The primary goal was to understand how production-grade async processing systems behave under concurrent workloads and failure conditions.

The architecture separates API ingestion from background processing using queue-based workflows, allowing workloads to be processed asynchronously while maintaining system responsiveness.

The system was benchmarked under concurrent queued workloads with a focus on throughput, reliability, and operational visibility.

## 💭 Key Engineering Concepts

• Distributed queues • Async processing • Worker orchestration • Concurrent job execution • Retry strategies • Dead-letter queues • Queue reconciliation • Rate limiting • Backpressure handling • Structured logging • Operational monitoring • Reliability engineering

## 🏛️ Architecture Explanation

Client requests are first received by the API server. Instead of processing long-running tasks synchronously, jobs are pushed into Redis-backed queues using BullMQ.

Dedicated workers consume queued jobs asynchronously and process workloads independently. PostgreSQL is used for persistent storage and job-related metadata.

The system includes retry workflows, dead-letter queues, and reconciliation logic to recover failed or missing jobs automatically.

Monitoring dashboards and structured logging provide operational visibility into queue health, processing behavior, failures, and retries.

## 🚀 Key Features
- **Two-Phase Commit Persistence**: Uses PostgreSQL as the source of truth and Redis for high-performance execution.
- **Production Hardening**: API Key authentication, rate limiting, and structured error responses.
- **Advanced Reliability**: Exponential backoff (1s, 2s, 4s), Dead Letter Queue (DLQ), and Backpressure handling (10k threshold).
- **Self-Healing**: Built-in reconciliation job that automatically syncs DB and Redis states every 5 minutes.
- **Observability**: Distributed tracing with `x-request-id` propagation and a visual dashboard (Bull-Board).
- **Scalable**: Stateless worker architecture designed for horizontal scaling via Docker/Cloud replicas.

## 🛠 Tech Stack
- **API Layer**: Express (with Zod validation)
- **Queue Layer**: BullMQ + Redis (Upstash recommended for production)
- **Persistence Layer**: PostgreSQL (Supabase recommended for production)
- **Monitoring**: Bull-Board UI

## 📂 Project Structure
- `src/api`: API server and route definitions.
- `src/jobs`: Job processors, queue configuration, and worker logic.
- `src/services`: Business logic and database interactions.
- `docs/`: Technical architecture and deployment guides.

## Scaling Challenges & Learnings

- One major challenge was maintaining reliability during concurrent workloads while preventing worker overload.

- Backpressure control and rate-limiting workflows were introduced to stabilize processing under burst-heavy traffic scenarios.

- Another important learning was handling failure recovery reliably. Retry policies alone were not enough, which led to implementing reconciliation workflows and dead-letter queue handling for failed jobs.

- The project also highlighted the importance of observability, structured logging, and operational monitoring in distributed systems.

## Engineering Decisions
### Why Redis?

Redis provides extremely fast in-memory operations, making it suitable for queue-based async workloads and distributed processing systems.

### Why BullMQ?

BullMQ provides worker orchestration, retry workflows, delayed jobs, queue monitoring support, and scalable async processing patterns.

### Why PostgreSQL?

PostgreSQL was chosen for reliable relational storage, transactional guarantees, and structured persistence.

### Why Async Processing?

Async processing improves responsiveness, scalability, and workload isolation by moving heavy or long-running operations outside synchronous request cycles.

## 🚦 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   Copy `.env.example` to `.env` and fill in your database and redis credentials.

3. **Run migrations:**
   ```bash
   node src/db/migrations.js
   ```

4. **Start the system:**
   ```bash
   npm start
   ```

## 📖 Documentation
- [User Manual](USER_MANUAL.md) - Detailed guide on API usage and features.
- [Architecture](docs/architecture.md) - System design and reliability strategies.
- [Cloud Deployment](docs/cloud-deployment-guide.md) - Guide for deploying to Railway/Supabase.

## 🤝 Contributing
Feel free to open issues or submit pull requests to improve the system.

## 📄 License
MIT
