# Distributed Job Queue - Architecture

## 1. System Overview
The Distributed Job Queue is a highly scalable, robust system designed to handle asynchronous tasks. It uses a client-server model where producers push jobs into a queue, and distributed, stateless workers consume and process them.

## 2. System Diagrams

### 2.1 High-Level Architecture
```mermaid
flowchart LR
    Client[Client] --> API[API Server Fastify]
    API -->|Validates & Enqueues| DB[(PostgreSQL)]
    API -->|Pushes ID & Payload| Queue[(Redis / BullMQ)]
    Queue -->|Consumes| Worker1[Worker Node]
    Queue -->|Consumes| Worker2[Worker Node]
    Worker1 -->|Updates Status| EventListener[Global Event Listener]
    Worker2 -->|Updates Status| EventListener
    EventListener -->|Syncs| DB
```

### 2.2 Job Lifecycle Sequence
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB as PostgreSQL
    participant Queue as Redis/BullMQ
    participant Worker
    
    Client->>API: POST /jobs {type, payload}
    API->>API: Zod Validation
    API->>DB: INSERT into jobs (idempotency check)
    DB-->>API: returns UUID
    API->>Queue: jobQueue.add(type, payload, { jobId: UUID })
    API-->>Client: 202 Accepted {id: UUID}
    
    Queue->>Worker: Delivers Job
    Worker->>Worker: Executes Processor Logic
    Worker-->>Queue: Job Completed / Failed
```

### 2.3 Failure & DLQ Flow
```mermaid
flowchart TD
    Job[Job Fails in Worker] --> Check{Attempts >= Max?}
    Check -- No --> Retry[Exponential Backoff]
    Retry --> Queue[(Wait in Queue)]
    Check -- Yes --> DLQ[(Dead Letter Queue)]
    DLQ --> EventSync[Event Listener Updates DB to permanently_failed]
```

### 2.4 Scaling Strategy
```mermaid
flowchart TD
    subgraph Web_Tier
        API1[API Server 1]
        API2[API Server 2]
    end
    
    subgraph DB_Tier
        Redis[(Redis Cluster)]
        PG[(PostgreSQL)]
    end
    
    subgraph Worker_Tier
        W1[Worker Node 1 (Concurrency 5)]
        W2[Worker Node 2 (Concurrency 5)]
        W3[Worker Node 3 (Concurrency 5)]
        Wn[Worker Node N...]
    end
    
    Web_Tier --> Redis
    Web_Tier --> PG
    Redis --> Worker_Tier
```

## 3. Tech Stack Justification
- **Express:** Industry standard, highly robust web framework for the API layer. Chosen for widespread familiarity and ecosystem support.
- **BullMQ + Redis:** Industry standard for robust job processing in Node.js. Handles all complex queueing logic natively.
- **PostgreSQL:** Reliable ACID-compliant relational DB for persistent state and auditing.
