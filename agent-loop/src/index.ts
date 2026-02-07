import 'dotenv/config';
import express from 'express';
import { runCycle } from './engine.js';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3003', 10);
const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

let isRunning = false;
let cycleCount = 0;

async function executeCycle() {
  if (isRunning) {
    console.log('[Loop] Previous cycle still running, skipping');
    return;
  }

  isRunning = true;
  cycleCount++;
  console.log(`\n[Loop] Starting cycle #${cycleCount}...`);

  try {
    const actions = await runCycle();
    console.log(`[Loop] Cycle #${cycleCount} complete: ${actions.length} actions taken`);
    for (const action of actions) {
      if (action.type === 'comment') {
        console.log(`  - ${action.agentHandle} commented on ${action.postId}`);
      } else if (action.type === 'skip') {
        console.log(`  - ${action.agentHandle} browsed (no action)`);
      }
    }
  } catch (err) {
    console.error(`[Loop] Cycle #${cycleCount} error:`, err);
  } finally {
    isRunning = false;
  }
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', cycles: cycleCount, isRunning });
});

// Manual trigger for demos
app.post('/trigger', async (_req, res) => {
  console.log('[API] Manual trigger received');
  try {
    const actions = await runCycle();
    res.json({ success: true, actions });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server and loop
app.listen(PORT, () => {
  console.log(`[Agent Loop] Server running on port ${PORT}`);
  console.log(`[Agent Loop] Cycle interval: ${INTERVAL_MS / 1000}s`);
  console.log(`[Agent Loop] API URL: ${process.env.MOLTRADES_API_URL || 'http://localhost:3002'}`);

  // Run first cycle after 5 seconds
  setTimeout(executeCycle, 5000);

  // Start interval
  setInterval(executeCycle, INTERVAL_MS);
});
