/**
 * PM2 Ecosystem — CampusConnect
 *
 * Usage:
 *   npm run build          # build all packages + services first
 *   pm2 start ecosystem.config.js
 *   pm2 status
 *   pm2 logs
 *   pm2 reload all         # zero-downtime reload
 *   pm2 stop all
 *   pm2 delete all
 *
 * Each service runs in cluster mode with N instances (auto = CPU count).
 * Memory threshold auto-restart at 400MB to prevent OOM crashes.
 */
module.exports = {
  apps: [
    // --- API Gateway ---
    {
      name: 'api-gateway',
      cwd: './apps/api-gateway',
      script: 'dist/main.js',
      instances: 1,           // gateway is stateless proxy — 1 instance is enough
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },

    // --- Auth Service ---
    {
      name: 'auth-service',
      cwd: './apps/auth-service',
      script: 'dist/main.js',
      instances: 2,            // CPU-bound (bcrypt hashing)
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },

    // --- User Service ---
    {
      name: 'user-service',
      cwd: './apps/user-service',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
    },

    // --- Social Service ---
    {
      name: 'social-service',
      cwd: './apps/social-service',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
    },

    // --- Chat Service ---
    {
      name: 'chat-service',
      cwd: './apps/chat-service',
      script: 'dist/main.js',
      instances: 2,            // Redis adapter handles cross-instance WS
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },

    // --- Study Service ---
    {
      name: 'study-service',
      cwd: './apps/study-service',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
    },

    // --- Material Service ---
    {
      name: 'material-service',
      cwd: './apps/material-service',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
      },
    },

    // --- Marketplace Service ---
    {
      name: 'marketplace-service',
      cwd: './apps/marketplace-service',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
      },
    },

    // --- Web Client (Next.js) ---
    {
      name: 'web-client',
      cwd: './apps/web-client',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },

    // --- Admin Dashboard (Vite preview) ---
    {
      name: 'admin-dashboard',
      cwd: './apps/admin-dashboard',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --host 0.0.0.0 --port 5173',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};