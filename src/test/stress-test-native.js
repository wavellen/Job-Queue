async function runStressTest() {
  console.log('🚀 Starting Native Stress Test...');
  const totalRequests = 1000;
  const concurrency = 50;
  let completed = 0;
  let failed = 0;

  const payloads = [
    { type: 'send-email', payload: { to: 'test@example.com', subject: 'Stress', body: 'Load test' } },
    { type: 'process-image', payload: { imageUrl: 'http://example.com/a.png', width: 100, height: 100, format: 'jpeg' } },
    { type: 'generate-report', payload: { reportType: 'daily', userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' } },
  ];

  const makeRequest = async () => {
    const job = payloads[Math.floor(Math.random() * payloads.length)];
    try {
      const res = await fetch('http://localhost:3000/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (res.ok) {
        completed++;
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }
  };

  const pool = new Set();
  const startTime = Date.now();

  for (let i = 0; i < totalRequests; i++) {
    const p = makeRequest().finally(() => pool.delete(p));
    pool.add(p);
    if (pool.size >= concurrency) {
      await Promise.race(pool);
    }
  }
  
  await Promise.all(pool);
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Stress Test Completed in ${duration}s`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${completed}`);
  console.log(`Failed (or Rate Limited): ${failed}`);
  console.log(`Throughput: ${(totalRequests / duration).toFixed(2)} req/s`);
}

runStressTest();
