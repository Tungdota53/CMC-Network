const { spawnSync } = require('node:child_process');

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('npm_execpath is unavailable; run this build through `npm run build`.');
  process.exit(1);
}
const steps = [
  ['shared packages and backend workspaces', ['run', 'build:workspaces']],
  ['Next.js web client', ['run', 'build:web']],
];

for (const [label, args] of steps) {
  console.log(`\nBuilding ${label}...`);
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
