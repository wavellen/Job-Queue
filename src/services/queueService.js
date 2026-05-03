import { v4 as uuidv4 } from 'uuid';
import { dbPool } from '../db/index.js';
import { jobQueue } from '../jobs/queue.js';

export class QueueService {
  /**
   * Enqueues a job with two-phase commit strategy for idempotency.
   */
  static async enqueueJob(type, payload, clientJobId, options = {}) {
    const { priority, requestId } = options;
    const jobId = clientJobId || uuidv4();

    // 0. Backpressure Handling: Reject jobs if queue is too full
    const jobCount = await jobQueue.getJobCountByTypes(['waiting', 'delayed', 'prioritized']);
    const QUEUE_THRESHOLD = 10000;
    if (jobCount >= QUEUE_THRESHOLD) {
      const error = new Error('System under high load. Try again later.');
      error.status = 503;
      error.code = 'QUEUE_OVERLOADED';
      throw error;
    }

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
          const error = new Error('Job ID already exists');
          error.status = 409;
          error.code = 'IDEMPOTENCY_VIOLATION';
          throw error;
        }
        throw dbError;
      }

      // 2. Add to BullMQ
      // Use the DB generated UUID as the BullMQ Job ID to link them
      await jobQueue.add(type, payload, { 
        jobId,
        priority,
        metadata: { requestId } // Store requestId for distributed tracing
      });

      await client.query('COMMIT');
      return { id: jobId, status: 'enqueued', requestId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async listJobs(filters = {}) {
    const { status, type, limit = 10, offset = 0 } = filters;
    
    let query = 'SELECT id, type, status, created_at, updated_at FROM jobs';
    const values = [];
    const conditions = [];

    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (type) {
      conditions.push(`type = $${values.length + 1}`);
      values.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await dbPool.query(query, values);
    
    // Also get total count for pagination metadata
    const countQuery = conditions.length > 0 
      ? `SELECT COUNT(*) FROM jobs WHERE ${conditions.join(' AND ')}`
      : 'SELECT COUNT(*) FROM jobs';
    const countResult = await dbPool.query(countQuery, conditions.length > 0 ? values.slice(0, -2) : []);
    
    return {
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    };
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
