# Decision Record: 0003 - Worker and Dead Letter Queue (DLQ) Design

## Context
We need to process jobs asynchronously, scale horizontally, and handle failures gracefully. The architecture demands a Dead Letter Queue (DLQ) for permanent failures and an explicit retry mechanism with exponential backoff.

## Decision
- **Modular Processors:** We split each job type (`send-email`, `process-image`, `generate-report`) into its own isolated file.
- **Single Worker Instance:** We use a single BullMQ `Worker` instance per Node process with a `concurrency` of 5, rather than spinning up multiple `Worker` classes for each job type.
- **Chaos Engineering:** We injected a 20% random failure rate into the processors to continuously test the retry mechanism.
- **Event-Driven DB Updates:** We use a dedicated BullMQ `QueueEvents` listener to monitor job lifecycles (`completed`, `failed`). This listener synchronizes the state to PostgreSQL and executes the DLQ routing logic.

## Why this approach?
- **Separation of Concerns:** The API adds jobs. The Worker processes jobs. The Event Listener syncs state. This decoupled architecture is highly resilient. If the Event Listener goes down, jobs still process. If the Worker goes down, jobs stay in the queue safely.
- **Explicit DLQ:** BullMQ's default behavior is to leave exhausted jobs in the `failed` set. We specifically trap the `failed` event, check if `attemptsMade >= maxAttempts`, and move the payload to a distinct `dead-letter-queue`. This allows operators to easily isolate permanently broken jobs from transiently failing ones.

## What if this fails?
- **Worker crash (OOM, unhandled rejection):** BullMQ detects the stalled job via Redis locks. After a timeout, it releases the lock and moves the job back to `waiting`. This ensures at-least-once processing.
- **Database unreachable during Event Sync:** The job completes in Redis but remains `pending` in PostgreSQL. 

## Alternatives Considered
- **Updating the DB inside the Processor:** This couples execution logic with state tracking. By using `QueueEvents`, we centralize logging and avoid cluttering the actual job processing logic.
