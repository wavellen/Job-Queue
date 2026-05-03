# src/db/index.ts

## 1. Purpose
Provides a centralized connection pool to interact with the PostgreSQL database. It exports a `query` helper and the underlying `dbPool` object.

## 2. Why this approach?
We use connection pooling (`pg.Pool`) instead of single clients to handle concurrent database queries efficiently. This is crucial for a distributed system where multiple API requests and worker processes might attempt to interact with the DB simultaneously. 

## 3. What if this fails?
If the connection pool cannot be established (e.g., wrong credentials or DB is down), database queries will timeout or throw immediately. The system will fail to fetch job configurations or save job states, effectively halting operations. 

## 4. Alternatives considered
- Single `Client` instances: Rejected because they do not scale under load and can easily exceed PostgreSQL connection limits.
- Full ORM (Prisma/TypeORM): We opted for the raw `pg` driver combined with SQL migrations to retain full control over performance and schema transparency, satisfying the strict explanation and rebuilding requirements.

## 5. Internal Flow
- Initializes a `Pool` with configuration from environment variables.
- Sets connection limits (`max: 20`).
- Provides a centralized `query` wrapper function.

## 6. Dependencies
- `pg` (node-postgres)
- `dotenv` (for loading `.env` configuration)

## 7. Rebuild Instructions
1. Install `pg` and `@types/pg`.
2. Create a new `Pool` instance using environment variables.
3. Export a `query` helper function.

## 8. Change Log
- **2026-05-03**: Created the centralized DB connection pool.
