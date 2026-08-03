#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { rmSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const webBuild = resolve(root, 'apps/web-client/.next');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Never mutate .next while next start is serving it. Short downtime is safer
// than mixing manifests and chunks from two builds.
run('pm2', ['stop', 'web-client']);
try {
  rmSync(webBuild, { recursive: true, force: true });
  run('npm', ['run', 'build:web']);
  run('pm2', ['startOrReload', 'ecosystem.config.js', '--only', 'web-client', '--update-env']);
  run('npm', ['run', 'deploy:healthcheck']);
  run('pm2', ['save']);
} catch (error) {
  console.error(`Web deployment failed: ${error.message}`);
  process.exitCode = 1;
}
