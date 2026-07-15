# PM2 / deploy / cache stability checklist

## Pre-deploy gate

1. Install dependencies with lockfile:
   - `npm ci`
2. Generate Prisma client:
   - `cd packages/database && npx prisma generate`
3. Run database migration/push for target environment:
   - production migration preferred: `npx prisma migrate deploy`
   - dev/staging fallback: `npx prisma db push`
4. Build shared packages and apps:
   - `npm run build`
5. Verify frontend production build:
   - `cd apps/web-client && npx next build`
6. Verify Python AI service syntax:
   - `cd apps/ai-service && python3 -m py_compile main.py`

## Required environment

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `REDIS_URL` or local Redis host/port
- `AUTH_SERVICE_URL`
- `USER_SERVICE_URL`
- `SOCIAL_SERVICE_URL`
- `CHAT_SERVICE_URL`
- `STUDY_SERVICE_URL`
- `MATERIAL_SERVICE_URL`
- `MARKETPLACE_SERVICE_URL`
- `AI_SERVICE_URL`
- `OPENAI_API_KEY` or `AI_API_KEY` for full AI responses

Do not commit real secret values. Keep them in PM2 env, shell env, `.env` on server, or secret manager.

## PM2 release sequence

1. Pull code.
2. Run pre-deploy gate.
3. Start or reload:
   - first start: `pm2 start ecosystem.config.js`
   - update: `pm2 reload ecosystem.config.js --update-env`
4. Persist process list:
   - `pm2 save`
5. Inspect status:
   - `pm2 status`
   - `pm2 logs --lines 80`
6. Run healthcheck:
   - `node scripts/deploy-healthcheck.js`

## Health endpoints

- API Gateway: `http://localhost:3001/health`
- Auth Service: `http://localhost:3002/health`
- User Service: `http://localhost:3003/health`
- Social Service: `http://localhost:3004/health`
- Chat Service: `http://localhost:3005/health`
- Study Service: `http://localhost:3006/health`
- Material Service: `http://localhost:3007/health`
- Marketplace Service: `http://localhost:3008/health`
- AI Service: `http://localhost:8000/`
- Web Client: `http://localhost:3000`

## Cache stability

- Redis must be reachable before starting production services.
- Rate limit uses Redis when ready, with in-memory fallback for single-instance dev.
- In production, avoid multi-instance in-memory-only rate limiting; configure Redis.
- After deploy, verify rate limit headers on API responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
- For stale frontend data, clear Next build cache only before rebuild:
  - `rm -rf apps/web-client/.next`

## Rollback

1. `pm2 stop all`
2. Checkout previous tag/commit.
3. `npm ci && npm run build`
4. `pm2 start ecosystem.config.js --update-env`
5. `pm2 save`
6. Run `node scripts/deploy-healthcheck.js`.
