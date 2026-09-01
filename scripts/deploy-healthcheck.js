#!/usr/bin/env node

const checks = [
  ['api-gateway', 'http://localhost:3001/health'],
  ['auth-service', 'http://localhost:3002/health'],
  ['user-service', 'http://localhost:3003/health'],
  ['social-service', 'http://localhost:3004/health'],
  ['chat-service', 'http://localhost:3005/health'],
  ['study-service', 'http://localhost:3006/health'],
  ['material-service', 'http://localhost:3007/health'],
  ['marketplace-service', 'http://localhost:3008/health'],
  ['ai-service', 'http://localhost:8000/'],
  ['web-client', 'http://127.0.0.1:3000'],
];

const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000);

async function check(name, url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const ok = response.status >= 200 && response.status < 400;
    return { name, url, ok, status: response.status };
  } catch (error) {
    return { name, url, ok: false, error: error.name || error.message };
  } finally {
    clearTimeout(timer);
  }
}

(async () => {
  const results = await Promise.all(checks.map(([name, url]) => check(name, url)));
  for (const result of results) {
    const suffix = result.ok ? `OK ${result.status}` : `FAIL ${result.error || result.status}`;
    console.log(`${result.name.padEnd(20)} ${suffix} ${result.url}`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
})();
