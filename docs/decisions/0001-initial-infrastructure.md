# Decision Record: 0001 - Initial Infrastructure

## Context
We are building a highly scalable Distributed Job Queue System. We need to choose the foundational data stores for persisting jobs and managing the message queue. 

## Decision
We have chosen **PostgreSQL** for data persistence and **Redis** for the queue and cache layer. Both are provisioned locally via **Docker Compose**. We will interface with the database using the standard `pg` driver and plain SQL migrations for maximum transparency and performance. We have chosen **TypeScript** to provide strong typing across the system.

## Why this approach?
- **Redis + BullMQ:** BullMQ is the de facto standard for job queues in Node.js, and it relies heavily on Redis for its atomic operations (Lua scripts) to guarantee queue integrity.
- **PostgreSQL:** Offers ACID compliance, robust relational integrity, and JSONB support which is ideal for storing arbitrary job payloads (`JSON`).
- **Docker Compose:** Ensures consistency across development environments and simplifies dependency management.
- **Pure `pg` Driver vs ORM:** While ORMs like Prisma are powerful, using the native `pg` driver and writing plain SQL migrations allows us to build the database layer strictly according to the architecture spec, ensuring we understand the underlying schema completely. It aligns with the requirement to explain all design choices and rebuild the system from scratch.
- **TypeScript:** Enforces strict contracts for job payloads and database schemas, which is a hallmark of production-grade systems.

## What if this fails?
- **Redis crash:** BullMQ has built-in retry mechanisms. However, a prolonged Redis outage will pause job processing. Persistent jobs already running will be tracked, but new jobs will fail to queue.
- **PostgreSQL crash:** The system will fail to write audit logs or long-term history. The API might reject new jobs if DB logging is synchronous.
- **Mitigation:** In production, both services will be managed (e.g., AWS RDS, Elasticache) with multi-AZ high availability. Local development relies on Docker restart policies.

## Alternatives Considered
- **RabbitMQ or Kafka (Queue):** RabbitMQ is excellent for complex routing, and Kafka for high-throughput event streaming. However, BullMQ over Redis offers a simpler mental model, native Node.js ecosystem support, and is extremely fast for general-purpose job queueing (delay, retry, rate limit).
- **MongoDB (Database):** While schema-less design is tempting for job payloads, PostgreSQL's JSONB provides the same flexibility with the added benefit of robust relational querying and transactional safety.
