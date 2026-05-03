import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { processEmail } from './processors/sendEmail.js';
import { processImage } from './processors/processImage.js';
import { generateReport } from './processors/generateReport.js';

const QUEUE_NAME = 'default-job-queue';

export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    switch (job.name) {
      case 'send-email':
        await processEmail(job);
        break;
      case 'process-image':
        await processImage(job);
        break;
      case 'generate-report':
        await generateReport(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs simultaneously
  }
);

worker.on('ready', () => {
  console.log(`[Worker] Started and listening on queue: ${QUEUE_NAME} with concurrency 5`);
});

worker.on('error', (err) => {
  console.error('[Worker] Unexpected Error:', err);
});

// Import events to start listener node if this file is run directly
import './events.js';
