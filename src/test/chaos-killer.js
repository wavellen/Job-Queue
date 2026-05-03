import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runChaos() {
  console.log('👿 Chaos Monkey: Started...');
  
  while (true) {
    const delay = Math.floor(Math.random() * 20000) + 10000;
    console.log(`👿 Chaos Monkey: Waiting ${delay/1000}s before next strike...`);
    await new Promise(res => setTimeout(res, delay));

    try {
      const { stdout } = await execAsync("ps -ax | grep 'node src/jobs/worker.js' | grep -v grep | awk '{print $1}'");
      const pid = stdout.trim();

      if (pid) {
        console.log(`👿 Chaos Monkey: Found worker PID ${pid}. Executing SIGKILL...`);
        await execAsync(`kill -9 ${pid}`);
        console.log(`👿 Chaos Monkey: Worker ${pid} killed! BullMQ should detect stalled jobs and re-queue them.`);
        
        console.log(`👿 Chaos Monkey: Restarting worker in 5 seconds...`);
        await new Promise(res => setTimeout(res, 5000));
        
        exec("node src/jobs/worker.js &", (err) => {
          if (err) console.error("Failed to restart worker", err);
        });
      } else {
        console.log('👿 Chaos Monkey: No worker found to kill.');
      }
    } catch (err) {
      console.log('👿 Chaos Monkey: Error finding/killing worker:', err);
    }
  }
}

runChaos();
