import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { processEmail } from './processors/sendEmail.js';
import { processImage } from './processors/processImage.js';
import { generateReport } from './processors/generateReport.js';

const QUEUE_NAME = 'default-job-queue';

export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const requestId = job.opts?.metadata?.requestId || 'N/A';
    console.log(`[Worker] Processing job ${job.id} [Type: ${job.name}] [RequestID: ${requestId}]`);
    
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
      case 'reconcile-jobs':
        await runReconciliation();
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
import { runReconciliation } from './reconciliation.js';

// Register Reconciliation Job (Runs every 5 minutes)
const registerReconciliation = async () => {
  // We use a repeatable job on the default queue
  await jobQueue.add(
    'reconcile-jobs',
    {},
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
    }
  );
  console.log('[Worker] Registered reconciliation job (every 5 mins)');
};

// Also add processor for reconciliation if it's not handled by the default switch
// However, it's better to just run it as a separate cron if we don't want to clutter the worker switch.
// But for simplicity, I'll add it to the switch in worker.js or just run it locally.
// Actually, let's add it to the worker switch to keep it consistent.

// Note: I already updated the switch in the previous tool call, I'll update it again to include reconciliation.

registerReconciliation().catch(console.error);
