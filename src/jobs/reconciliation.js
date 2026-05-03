import { dbPool } from '../db/index.js';
import { jobQueue } from './queue.js';

/**
 * Reconciliation Job: Fixes "stuck" pending jobs in DB that failed to enqueue in Redis.
 * This ensures consistency between PostgreSQL (Source of Truth) and Redis (Execution Layer).
 */
export async function runReconciliation() {
  console.log('[Reconciliation] Starting sync job...');
  
  try {
    // 1. Find jobs stuck in 'pending' for more than 5 minutes
    const result = await dbPool.query(`
      SELECT id, type, payload 
      FROM jobs 
      WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '5 minutes'
      LIMIT 100
    `);

    if (result.rows.length === 0) {
      console.log('[Reconciliation] No stuck jobs found.');
      return;
    }

    console.log(`[Reconciliation] Found ${result.rows.length} potentially stuck jobs. Validating...`);

    for (const row of result.rows) {
      // 2. Check if job exists in BullMQ (using the DB ID)
      const job = await jobQueue.getJob(row.id);

      if (!job) {
        console.warn(`[Reconciliation] Job ${row.id} missing in Redis. Re-enqueuing...`);
        // 3. Re-enqueue if missing
        await jobQueue.add(row.type, row.payload, { jobId: row.id });
      } else {
        // If it exists in Redis but status is pending in DB, it might just be waiting.
        // But if it's been 5 mins, we should probably check if it's active/completed.
        const state = await job.getState();
        console.log(`[Reconciliation] Job ${row.id} exists in Redis with state: ${state}`);
      }
    }

    console.log('[Reconciliation] Sync completed.');
  } catch (error) {
    console.error('[Reconciliation] Error during sync:', error);
  }
}
