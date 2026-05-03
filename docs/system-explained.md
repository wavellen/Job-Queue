# System Explained (Interview Guide)

## What is this system?
This is a **Distributed Job Queue System**. Simply put, it's a traffic cop for heavy, time-consuming tasks. Instead of forcing a user to wait 10 seconds for an email to send or a report to generate, the API immediately says "Got it!" and hands the task to a background Worker to process independently.

## How it works (Step-by-Step Lifecycle)
1. **Produce:** A client makes a `POST /jobs` request to our Fastify API.
2. **Validate:** The API validates the payload using Zod (e.g., ensuring `send-email` actually has an email address).
3. **Idempotency Check:** The API inserts a record into PostgreSQL. If the client sent a `jobId` that already exists, Postgres blocks it. This prevents double-processing.
4. **Queue:** The API pushes the job into Redis via BullMQ.
5. **Consume:** A stateless Node.js Worker pulls the job from Redis and executes the appropriate processor.
6. **Complete/Fail:** 
   - If successful, a global Event Listener updates PostgreSQL to `completed`.
   - If it fails, BullMQ automatically retries using **Exponential Backoff**.
   - If it exhausts all retries (e.g., 3 attempts), the Event Listener pushes the job to a explicit **Dead Letter Queue (DLQ)** and marks it `permanently_failed` in Postgres.

## Where is it used?
Real-world systems rely heavily on this pattern:
- **E-commerce:** Sending order confirmation emails.
- **Social Media:** Processing and compressing uploaded images/videos.
- **Analytics:** Generating heavy monthly PDF reports without timing out the web server.

## How to use it
- **Integration:** Services call our internal `POST /jobs` endpoint with a specific `type` and `payload`.
- **Monitoring:** Operators visit `http://<domain>/ui` to see the Bull-Board dashboard, monitoring active queues, viewing stack traces of failed jobs, and inspecting the DLQ.

## How this differs from others
- **Compared to simple Cron Jobs:** Cron jobs run on a fixed schedule (e.g., "every minute"). Our queue is event-driven; it processes instantly when a job arrives.
- **Compared to Basic Queues (In-memory Array):** If a basic Node.js array queue crashes, all pending jobs are lost. Our system stores jobs in Redis/Postgres, meaning they survive server reboots.
- **Compared to SQS/RabbitMQ:** RabbitMQ is a complex message broker. SQS is a managed cloud queue. We built this on **Redis/BullMQ** because it's incredibly fast, natively supports delayed jobs and retries out-of-the-box, and is standard in the Node.js ecosystem.

## Why this design? (Trade-offs)
- **Why BullMQ over RabbitMQ/Kafka?** Simplicity vs. Complexity. BullMQ uses Redis, which we likely already use for caching. It provides exact features we need (retries, delay, DLQ) without the overhead of maintaining a massive Kafka cluster.
- **Why Postgres for Idempotency?** BullMQ has built-in ID checking, but Redis data is ephemeral. By generating the ID and logging the state in Postgres, we have a permanent, queryable audit log for billing or debugging long after the job has cleared Redis.
- **Why Express?** It's the most widely adopted and battle-tested web framework in the Node ecosystem. It guarantees high maintainability and is universally understood by JavaScript developers.

## Failure Handling Strategies
During an interview, explicitly mention:
1. **Worker Crashes:** "BullMQ uses Redis locks. If a worker dies mid-job, the lock expires, and another worker picks it up. We guarantee at-least-once delivery."
2. **External API Timeouts:** "We built in exponential backoff. If an email provider is down, we wait 1s, then 2s, then 4s, rather than spamming a broken API."
3. **Poison Pills:** "If a job has a fundamental error (e.g., malformed image) and fails all retries, it is routed to the Dead Letter Queue (DLQ). This ensures it doesn't block the rest of the queue indefinitely."
4. **Job Flooding (DDoS):** "We implemented strict Rate Limiting at the API edge using `@fastify/rate-limit`. This drops excess requests (HTTP 429) before they can exhaust the database connection pool or flood Redis."
