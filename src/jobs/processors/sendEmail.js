export async function processEmail(job) {
  const { to, subject } = job.data;
  console.log(`[Worker] Starting send-email job ${job.id} for ${to}...`);

  // Simulate external API call latency
  await new Promise(res => setTimeout(res, 500));

  // Chaos Engineering: 20% failure rate
  if (Math.random() < 0.2) {
    throw new Error('Simulated Email Provider Timeout');
  }

  console.log(`[Worker] Finished send-email job ${job.id}. Sent to ${to}.`);
}
