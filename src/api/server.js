import express from 'express';
import routes from './routes.js';
import * as dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { jobQueue, deadLetterQueue } from '../jobs/queue.js';
import rateLimit from 'express-rate-limit';

import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// 0. Distributed Tracing Middleware (Request ID propagation)
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// 1. Authentication Middleware (Production Hardening)
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'dev-secret-key';
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'AUTH_REQUIRED',
      message: 'A valid API key is required to access this resource.'
    });
  }
  next();
};

// 2. Setup Rate Limiting (Security Hardening)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.'
  },
  handler: (req, res, next, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
    res.status(options.statusCode).send(options.message);
  }
});
app.use('/jobs', limiter);
app.use('/metrics', limiter);

// Apply Auth to sensitive routes
app.use('/jobs', authMiddleware);
app.use('/metrics', authMiddleware);

// 2. Setup Bull-Board Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/ui');

createBullBoard({
  queues: [new BullMQAdapter(jobQueue), new BullMQAdapter(deadLetterQueue)],
  serverAdapter,
});

app.use('/ui', serverAdapter.getRouter());

// 3. Register API Routes
app.use('/', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const start = () => {
  const port = parseInt(process.env.PORT || '3000');
  app.listen(port, '0.0.0.0', () => {
    console.log(`API Server listening on port ${port}`);
    console.log(`Job Dashboard available at http://localhost:${port}/ui`);
  });
};

start();

export { app, start };
