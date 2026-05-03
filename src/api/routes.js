import { Router } from 'express';
import { QueueService } from '../services/queueService.js';
import { createJobSchema } from './schemas.js';
import { dbPool } from '../db/index.js';
import { redisConnection } from '../config/redis.js';
import { jobQueue, deadLetterQueue } from '../jobs/queue.js';

const router = Router();

// 1. Health Check
router.get('/health', async (req, res) => {
  try {
    await dbPool.query('SELECT 1');
    await redisConnection.ping();
    res.json({ status: 'ok', db: 'connected', redis: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Infrastructure unavailable' });
  }
});

// 2. Submit Job
router.post('/jobs', async (req, res) => {
  try {
    // Validate request body
    const result = createJobSchema.safeParse({ body: req.body });
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors });
    }

    const { type, payload } = result.data.body;
    
    // Accept optional client-provided jobId for idempotency
    const clientJobId = req.headers['x-idempotency-key'];

    const jobResult = await QueueService.enqueueJob(type, payload, clientJobId);
    
    res.status(202).json(jobResult);
  } catch (error) {
    if (error.message.includes('Idempotency Key Violation')) {
      return res.status(409).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Get Job Status
router.get('/jobs/:id', async (req, res) => {
  try {
    const status = await QueueService.getJobStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// 4. Metrics Endpoint
router.get('/metrics', async (req, res) => {
  try {
    const defaultCounts = await jobQueue.getJobCounts();
    const dlqCounts = await deadLetterQueue.getJobCounts();
    
    res.json({
      queues: {
        default: defaultCounts,
        dlq: dlqCounts,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
