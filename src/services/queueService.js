import { v4 as uuidv4 } from 'uuid';
import { dbPool } from '../db/index.js';
import { jobQueue } from '../jobs/queue.js';

export class QueueService {
  /**
   * Enqueues a job with two-phase commit strategy for idempotency.
   */
  static async enqueueJob(type, payload, clientJobId) {
    const jobId = clientJobId || uuidv4();
    const client = await dbPool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Insert into Postgres for idempotency and tracking
      try {
        await client.query(
          'INSERT INTO jobs (id, type, status, payload) VALUES ($1, $2, $3, $4)',
          [jobId, type, 'pending', payload]
        );
      } catch (dbError) {
        // 23505 is PostgreSQL unique violation error code
        if (dbError.code === '23505') {
          await client.query('ROLLBACK');
          throw new Error('Idempotency Key Violation: Job ID already exists');
        }
        throw dbError;
      }

      // 2. Add to BullMQ
      // Use the DB generated UUID as the BullMQ Job ID to link them
      await jobQueue.add(type, payload, { jobId });

      await client.query('COMMIT');
      return { id: jobId, status: 'enqueued' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getJobStatus(jobId) {
    const result = await dbPool.query(
      'SELECT id, type, status, error_message, created_at, updated_at FROM jobs WHERE id = $1',
      [jobId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }
}
