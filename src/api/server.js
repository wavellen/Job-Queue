import express from 'express';
import routes from './routes.js';
import * as dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { jobQueue, deadLetterQueue } from '../jobs/queue.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// 1. Setup Rate Limiting (Security Hardening)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/jobs', limiter);

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
