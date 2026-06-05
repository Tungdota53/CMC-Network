const { execSync } = require('child_process');

const PORTS = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008];

PORTS.forEach((port) => {
  try {
    const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const pids = new Set();
    result.split('\n').forEach((line) => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && /^\d+$/.test(pid)) pids.add(pid);
    });

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'pipe' });
        console.log(`Killed PID ${pid} on port ${port}`);
      } catch {
        try {
          execSync(`wmic process where ProcessId=${pid} call terminate`, { stdio: 'pipe' });
          console.log(`WMIC killed PID ${pid} on port ${port}`);
        } catch {
          console.warn(`Could not kill PID ${pid} on port ${port} - may already be dead`);
        }
      }
    });
  } catch {
    // No process on this port
  }
});

console.log('Port cleanup done.');
