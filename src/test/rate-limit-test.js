async function runRateLimitTest() {
  console.log('🛡️ Starting Rate Limit Validation Test...');
  const totalRequests = 150;
  let completed = 0;
  let rateLimited = 0;

  console.log(`Sending ${totalRequests} rapid requests to /jobs...`);

  const makeRequest = async () => {
    try {
      const res = await fetch('http://localhost:3000/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'send-email', payload: { to: 'test@example.com', subject: 'Rate', body: 'Limit' } }),
      });
      if (res.status === 429) {
        rateLimited++;
      } else if (res.ok) {
        completed++;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const promises = [];
  for (let i = 0; i < totalRequests; i++) {
    promises.push(makeRequest());
  }
  
  await Promise.all(promises);
  
  console.log(`\n✅ Rate Limit Test Completed`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successfully queued: ${completed}`);
  console.log(`Blocked (429 Too Many Requests): ${rateLimited}`);

  if (rateLimited > 0 && completed <= 100) {
    console.log('🔒 SUCCESS: Rate Limiting is active and protecting the system from Job Flooding!');
  } else {
    console.log('❌ FAILURE: Rate Limiting did not engage correctly.');
  }
}

runRateLimitTest();
