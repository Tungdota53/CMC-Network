const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { isProjectOwnedProcess } = require('./port-ownership');

const PORTS = [
  25080, 25443, 25021, 22022, 23306, 38888, 38080, 38081, 38082, 38083,
];
const workspaceRoot = path.resolve(__dirname, '..');
const shouldKillOwned = process.argv.includes('--kill-owned');

function parseJsonList(output) {
  const trimmed = output.trim();
  if (!trimmed) return [];
  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function getWindowsListeners() {
  const portList = PORTS.join(',');
  const command = [
    `$ports = @(${portList})`,
    '$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }',
    '$result = foreach ($listener in $listeners) {',
    '  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue',
    '  [PSCustomObject]@{ port = $listener.LocalPort; pid = $listener.OwningProcess; name = $process.Name; commandLine = $process.CommandLine }',
    '}',
    '$result | Sort-Object port,pid -Unique | ConvertTo-Json -Compress',
  ].join('; ');

  const output = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', command],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );

  return parseJsonList(output);
}

function getUnixListeners() {
  const output = execFileSync(
    'lsof',
    ['-nP', '-iTCP', '-sTCP:LISTEN'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const listeners = [];

  for (const line of output.split(/\r?\n/).slice(1)) {
    const columns = line.trim().split(/\s+/);
    const portMatch = line.match(/:(\d+)\s+\(LISTEN\)$/);
    const pid = Number(columns[1]);
    const port = Number(portMatch?.[1]);
    if (!PORTS.includes(port) || !Number.isInteger(pid)) continue;

    const processOutput = execFileSync(
      'ps',
      ['-p', String(pid), '-o', 'comm=', '-o', 'args='],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
    const [name = '', ...commandParts] = processOutput.split(/\s+/);
    listeners.push({
      port,
      pid,
      name,
      commandLine: commandParts.join(' '),
    });
  }

  return listeners;
}

function getListeners() {
  return process.platform === 'win32'
    ? getWindowsListeners()
    : getUnixListeners();
}

function terminateOwnedProcess(listener) {
  if (process.platform === 'win32') {
    execFileSync(
      'taskkill.exe',
      ['/PID', String(listener.pid), '/T', '/F'],
      { stdio: 'pipe' },
    );
    return;
  }
  process.kill(listener.pid, 'SIGTERM');
}

function describe(listener, owned) {
  const owner = owned ? 'project-owned' : 'foreign';
  return `port ${listener.port}: PID ${listener.pid} (${listener.name || 'unknown'}, ${owner})`;
}

function main() {
  let listeners;
  try {
    listeners = getListeners();
  } catch (error) {
    console.error('Unable to inspect development ports safely. No process was terminated.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (listeners.length === 0) {
    console.log('Development ports are available.');
    return;
  }

  const classified = listeners.map((listener) => ({
    ...listener,
    owned: isProjectOwnedProcess(listener.commandLine, workspaceRoot),
  }));

  if (!shouldKillOwned) {
    console.error('Development cannot start because required ports are already in use:');
    for (const listener of classified) console.error(`- ${describe(listener, listener.owned)}`);
    console.error('No process was terminated. Run `npm run dev:cleanup` to stop project-owned listeners only.');
    process.exitCode = 1;
    return;
  }

  let hasForeignConflict = false;
  for (const listener of classified) {
    if (!listener.owned) {
      hasForeignConflict = true;
      console.error(`Left running: ${describe(listener, false)}`);
      continue;
    }

    try {
      terminateOwnedProcess(listener);
      console.log(`Stopped ${describe(listener, true)}`);
    } catch (error) {
      hasForeignConflict = true;
      console.error(`Could not stop ${describe(listener, true)}`);
      console.error(error instanceof Error ? error.message : String(error));
    }
  }

  if (hasForeignConflict) {
    console.error('One or more ports are still occupied. Stop the foreign process or change the local port configuration.');
    process.exitCode = 1;
  }
}

main();
