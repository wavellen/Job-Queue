import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

const QUEUE_NAME = 'default-job-queue';
const DLQ_NAME = 'dead-letter-queue';

export const jobQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Global retry limit
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s...
    },
    removeOnComplete: true, // Keep redis clean
    removeOnFail: false, // We want to inspect failures or move them to DLQ
  },
});

export const deadLetterQueue = new Queue(DLQ_NAME, {
  connection: redisConnection,
});
