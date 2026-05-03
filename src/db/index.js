import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export const dbPool = process.env.POSTGRES_URL 
  ? new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false } // Required for Supabase/Railway external connections
    })
  : new Pool({
      user: process.env.POSTGRES_USER || 'admin',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'job_queue_db',
      password: process.env.POSTGRES_PASSWORD || 'secret123',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

dbPool.on('error', (err, client) => {
  console.error('Unexpected error on idle DB client', err);
  process.exit(-1);
});
