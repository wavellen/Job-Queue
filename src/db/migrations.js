import { dbPool } from './index.js';

async function runMigrations() {
  console.log('Connecting to database...');
  const client = await dbPool.connect();

  try {
    await client.query('BEGIN');

    // Users table for generating reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Jobs table for idempotency and state tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payload JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT
      );
    `);

    // Job Execution Logs for auditing
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_logs (
        id SERIAL PRIMARY KEY,
        job_id UUID REFERENCES jobs(id),
        status VARCHAR(20) NOT NULL,
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Running migrations...');
    console.log('Migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    // Exit process only if this script is run directly
    if (process.argv[1] && process.argv[1].includes('migrations.js')) {
      process.exit(0);
    }
  }
}

if (process.argv[1] && process.argv[1].includes('migrations.js')) {
  runMigrations();
}

export { runMigrations };
