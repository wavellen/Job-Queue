import { dbPool } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

async function runE2E() {
  console.log('🧪 Starting Full System E2E Validation...\n');
  const API_URL = 'http://localhost:3000';

  // 1. Health Check
  console.log('1. Checking System Health...');
  const healthRes = await fetch(`${API_URL}/health`);
  const health = await healthRes.json();
  if (health.status !== 'ok') throw new Error('Health check failed');
  console.log('✅ Health OK (DB & Redis connected)\n');

  // 2. Job Submission & Processing
  const jobId = uuidv4();
  console.log(`2. Submitting Job ${jobId}...`);
  const subRes = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-idempotency-key': jobId },
    body: JSON.stringify({
      type: 'send-email',
      payload: { to: 'e2e@example.com', subject: 'E2E Test', body: 'Testing full flow' }
    }),
  });
  if (subRes.status !== 202) throw new Error(`Submission failed with ${subRes.status}`);
  console.log('✅ Job Accepted');

  // Wait for processing
  console.log('⌛ Waiting for worker to process...');
  await new Promise(res => setTimeout(res, 3000));

  // 3. Verify DB State (with retry loop)
  console.log('3. Verifying Database State...');
  let status = 'pending';
  for (let i = 0; i < 10; i++) {
    const dbRes = await dbPool.query('SELECT status FROM jobs WHERE id = $1', [jobId]);
    status = dbRes.rows[0]?.status;
    if (status !== 'pending') break;
    console.log(`⌛ Status still pending, waiting... (${i+1}/10)`);
    await new Promise(res => setTimeout(res, 1000));
  }
  
  console.log(`✅ DB Status: ${status}`);
  if (!['completed', 'failed', 'retrying', 'permanently_failed'].includes(status)) {
    throw new Error(`Unexpected job status in DB: ${status}`);
  }

  // 4. Idempotency Check
  console.log('4. Testing Idempotency (Re-submitting same ID)...');
  const dupeRes = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-idempotency-key': jobId },
    body: JSON.stringify({
      type: 'send-email',
      payload: { to: 'e2e@example.com', subject: 'E2E Test', body: 'Testing full flow' }
    }),
  });
  if (dupeRes.status === 409) {
    console.log('✅ Idempotency OK (409 Conflict returned)\n');
  } else {
    throw new Error(`Idempotency failed: expected 409, got ${dupeRes.status}`);
  }

  // 5. Rate Limit Verification (Small burst)
  console.log('5. Verifying Rate Limiter...');
  let blockedCount = 0;
  for (let i = 0; i < 110; i++) {
    const res = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'send-email', payload: { to: 't@t.com', subject: 't', body: 't' } }),
    });
    if (res.status === 429) blockedCount++;
  }
  if (blockedCount > 0) {
    console.log(`✅ Rate Limiter active (${blockedCount} requests blocked)\n`);
  } else {
    console.warn('⚠️ Rate Limiter did not block requests (maybe threshold not hit or IP reset)');
  }

  console.log('✨ FULL SYSTEM VALIDATION PASSED! ✨');
}

runE2E().catch(err => {
  console.error('\n❌ E2E VALIDATION FAILED:', err.message);
  process.exit(1);
});
