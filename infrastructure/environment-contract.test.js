const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

test('root environment template contains the complete local routing contract', () => {
  const env = parseEnv(read('.env.example'));
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'NEXT_PUBLIC_API_GATEWAY_URL',
    'AUTH_SERVICE_URL',
    'USER_SERVICE_URL',
    'SOCIAL_SERVICE_URL',
    'CHAT_SERVICE_URL',
    'STUDY_SERVICE_URL',
    'MATERIAL_SERVICE_URL',
    'MARKETPLACE_SERVICE_URL',
  ];

  for (const key of required) assert.ok(env[key], `${key} is required`);
  assert.match(env.DATABASE_URL, /localhost:25432\//);
  assert.equal(env.REDIS_URL, 'redis://localhost:26379');
  assert.equal(env.NEXT_PUBLIC_API_GATEWAY_URL, 'http://localhost:25021');
});

test('development compose uses project-specific host ports and container names', () => {
  const compose = read('infrastructure/docker-compose.yml');
  assert.match(compose, /\$\{POSTGRES_HOST_PORT:-25432\}:5432/);
  assert.match(compose, /\$\{REDIS_HOST_PORT:-26379\}:6379/);
  assert.match(compose, /cmc_network_postgres_dev/);
  assert.match(compose, /cmc_network_redis_dev/);
});

test('standalone backend templates use the same isolated database port', () => {
  const services = [
    'auth-service',
    'chat-service',
    'marketplace-service',
    'material-service',
    'social-service',
    'study-service',
    'user-service',
  ];

  for (const service of services) {
    const env = parseEnv(read(`apps/${service}/.env.example`));
    assert.match(env.DATABASE_URL, /localhost:25432\//, service);
  }
});

test('Vite dashboard is the active admin application', () => {
  const rootPackage = JSON.parse(read('package.json'));
  const ecosystem = read('ecosystem.config.js');

  assert.match(rootPackage.scripts['dev:admin'], /filter=admin-dashboard/);
  assert.match(rootPackage.scripts['dev:web'], /filter=web-client/);
  assert.match(rootPackage.scripts['dev:web'], /filter=admin-dashboard/);
  assert.match(ecosystem, /name:\s*['"]admin-dashboard['"]/);
  assert.ok(
    fs.existsSync(path.join(workspaceRoot, 'docs/ADR-001-CANONICAL-ADMIN.md')),
  );
});

test('root build isolates the Windows Turbo/Next process lifecycle', () => {
  const rootPackage = JSON.parse(read('package.json'));
  assert.equal(
    rootPackage.scripts.build,
    'node --env-file-if-exists=.env scripts/build.js',
  );
  assert.match(rootPackage.scripts['build:workspaces'], /filter=!web-client/);
  assert.equal(
    rootPackage.scripts['build:web'],
    'npm run build --workspace=web-client',
  );
});

test('environment examples remain tracked while runtime env and uploads stay ignored', () => {
  const webIgnore = read('apps/web-client/.gitignore');
  const rootIgnore = read('.gitignore');
  const webEnv = parseEnv(read('apps/web-client/.env.example'));

  assert.match(webIgnore, /!\.env\.example/);
  assert.match(rootIgnore, /apps\/\*\/uploads\/\*\*/);
  assert.equal(webEnv.NEXT_PUBLIC_API_GATEWAY_URL, 'http://localhost:25021');
});

test('lint is read-only and formatting fixes require an explicit command', () => {
  const services = [
    'api-gateway',
    'auth-service',
    'chat-service',
    'marketplace-service',
    'material-service',
    'social-service',
    'study-service',
    'user-service',
  ];

  for (const service of services) {
    const manifest = JSON.parse(read(`apps/${service}/package.json`));
    assert.doesNotMatch(manifest.scripts.lint, /--fix/, service);
    assert.match(manifest.scripts['lint:fix'], /--fix/, service);
  }
});
