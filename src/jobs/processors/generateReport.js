export async function generateReport(job) {
  const { userId, reportType } = job.data;
  console.log(`[Worker] Starting generate-report job ${job.id} for user ${userId}...`);

  // Simulate DB aggregation query latency
  await new Promise(res => setTimeout(res, 1500));

  if (Math.random() < 0.2) {
    throw new Error('Simulated DB Deadlock Exception');
  }

  console.log(`[Worker] Finished generate-report job ${job.id}. Type: ${reportType}`);
}
