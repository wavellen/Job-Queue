export async function processImage(job) {
  const { imageUrl, format } = job.data;
  console.log(`[Worker] Starting process-image job ${job.id}...`);

  // Simulate heavy processing (CPU bound mock)
  await new Promise(res => setTimeout(res, 2000));

  if (Math.random() < 0.2) {
    throw new Error('Simulated Image Corrupt Exception');
  }

  console.log(`[Worker] Finished process-image job ${job.id}. Format: ${format}`);
}
