# Distributed Job Queue

A production-grade, highly scalable background job processing system built with **Node.js**, **Express**, **BullMQ**, **Redis**, and **PostgreSQL**.

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
