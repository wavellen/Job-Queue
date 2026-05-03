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
    const result = createJobSchema.safeParse({ body: req.body, priority: req.body.priority });
    if (!result.success) {
      return res.status(400).json({ 
        error: 'VALIDATION_FAILED', 
        message: 'The request body does not match the required schema.',
        details: result.error.errors 
      });
    }

    const { type, payload } = result.data.body;
    const priority = result.data.priority;
    
    // Accept optional client-provided jobId for idempotency
    const clientJobId = req.headers['x-idempotency-key'];
    const requestId = req.requestId;

    const jobResult = await QueueService.enqueueJob(type, payload, clientJobId, { priority, requestId });
    
    res.status(202).json(jobResult);
  } catch (error) {
    if (error.code === 'IDEMPOTENCY_VIOLATION') {
      return res.status(409).json({ error: error.code, message: error.message });
    }
    if (error.code === 'QUEUE_OVERLOADED') {
      return res.status(503).json({ error: error.code, message: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
  }
});

// 2.5 List Jobs (Pagination & Filtering)
router.get('/jobs', async (req, res) => {
  try {
    const { status, type, limit, offset } = req.query;
    const result = await QueueService.listJobs({ 
      status, 
      type, 
      limit: limit ? parseInt(limit) : 10, 
      offset: offset ? parseInt(offset) : 0 
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to retrieve jobs.' });
  }
});

// 3. Get Job Status
router.get('/jobs/:id', async (req, res) => {
  try {
    const status = await QueueService.getJobStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'JOB_NOT_FOUND', message: `Job with ID ${req.params.id} could not be found.` });
    }
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'FETCH_FAILED', message: 'Failed to fetch job status.' });
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
