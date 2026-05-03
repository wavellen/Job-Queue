import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// ioredis connection singleton
export const redisConnection = REDIS_URL 
  ? new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: REDIS_URL.startsWith('rediss://') ? {} : undefined
    })
  : new Redis(REDIS_PORT, REDIS_HOST, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisConnection.once('ready', () => {
  console.log('Successfully connected to Redis.');
});
