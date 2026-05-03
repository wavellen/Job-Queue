import { QueueEvents } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { dbPool } from '../db/index.js';
import { deadLetterQueue } from './queue.js';

const QUEUE_NAME = 'default-job-queue';

export const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection,
});

async function logJobState(jobId, status, message) {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    
    // Update main job table
    await client.query(
      'UPDATE jobs SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [status, message, jobId]
    );

    // Insert audit log
    await client.query(
      'INSERT INTO job_logs (job_id, status, message) VALUES ($1, $2, $3)',
      [jobId, status, message]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Failed to log job state for ${jobId}:`, err);
  } finally {
    client.release();
  }
}

// Event Listeners
queueEvents.on('completed', async ({ jobId, returnvalue }) => {
  console.log(`[Event] Job ${jobId} completed successfully.`);
  await logJobState(jobId, 'completed', null);
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  console.log(`[Event] Job ${jobId} failed. Reason: ${failedReason}`);
  
  // Note: We cannot get job attempts easily from QueueEvents directly in V5 without fetching the job.
  // But we can update the status to failed or retrying.
  // In a robust implementation, we would inspect job.attemptsMade. 
  // For simplicity and architecture matching, we mark it failed/retrying.
  
  // Assuming a check would happen here to see if max attempts reached. 
  // Let's implement DLQ routing based on a permanent failure assumption for demo:
  // We will assume if it fails it's retrying, and BullMQ worker will eventually trigger max retries.
  // To strictly follow DLQ pattern, let's fetch the job from Redis:
  const { Job } = await import('bullmq');
  const { jobQueue } = await import('./queue.js');
  
  const job = await Job.fromId(jobQueue, jobId);
  if (job) {
    const maxAttempts = job.opts.attempts || 3;
    if (job.attemptsMade >= maxAttempts) {
      console.log(`[Event] Job ${jobId} exhausted all retries. Routing to DLQ.`);
      await deadLetterQueue.add(job.name, job.data, { jobId });
      await logJobState(jobId, 'permanently_failed', failedReason);
    } else {
      await logJobState(jobId, 'retrying', failedReason);
    }
  } else {
    // Fallback if job is already wiped
    await logJobState(jobId, 'failed', failedReason);
  }
});
