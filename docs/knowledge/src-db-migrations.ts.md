# src/db/migrations.ts

## 1. Purpose
This script initializes the PostgreSQL database schema for the Distributed Job Queue. It creates the necessary tables (`users`, `jobs`, `job_logs`) and indexes required for efficient querying.

## 2. Why this approach?
Instead of an ORM migration tool (which abstracts away the schema), we use a raw SQL string executed via the `pg` driver. This approach enforces a deep understanding of the database structure and makes the exact schema instantly readable and explainable, satisfying the strict requirements of the architecture spec. We use `JSONB` for the job payload to allow arbitrary schemas for different job types.

## 3. What if this fails?
If the script fails to execute, the database will be left in an incomplete state. The application cannot start properly without these tables. The script will throw an error and `process.exit(1)`, halting any CI/CD or startup sequence.

## 4. Alternatives considered
- ORMs (Prisma, TypeORM): Rejected in favor of raw SQL to maintain maximum transparency and avoid hidden abstractions for this specific core challenge.
- Pre-packaged PostgreSQL images with init scripts: We chose an explicit Node.js migration script to allow programmatic control over when and how migrations run.

## 5. Internal Flow
- Connects directly to PostgreSQL using a temporary single `Client`.
- Executes `CREATE TABLE IF NOT EXISTS` commands.
- Closes the connection and exits.

## 6. Dependencies
- Node `pg` package.

## 7. Rebuild Instructions
1. Define the schema in a raw SQL string. Include `users`, `jobs`, and `job_logs`.
2. Connect a `pg` `Client`.
3. Await `client.query(schema)`.

## 8. Change Log
- **2026-05-03**: Created the initial schema including `users`, `jobs`, and `job_logs` with UUIDs and JSONB payloads.
