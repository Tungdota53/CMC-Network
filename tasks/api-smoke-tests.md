# API Smoke Tests Per Module

Run from `/root/CMC-Network` after PM2 services are online.

## Health

```bash
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:3001/health
curl -fsS http://localhost:3002/health || curl -fsS http://localhost:3002/
curl -fsS http://localhost:3003/health || curl -fsS http://localhost:3003/
curl -fsS http://localhost:3004/health || curl -fsS http://localhost:3004/
curl -fsS http://localhost:3005/health || curl -fsS http://localhost:3005/
curl -fsS http://localhost:3006/health || curl -fsS http://localhost:3006/
curl -fsS http://localhost:3007/health || curl -fsS http://localhost:3007/
curl -fsS http://localhost:3008/health || curl -fsS http://localhost:3008/
curl -fsS http://localhost:8000/health
```

## Gateway module probes

These probes verify route reachability without requiring destructive mutations.

| Module | Gateway probe | Expected |
|---|---|---|
| Auth | `GET /api/health` includes `auth` | 200 |
| Users | `GET /api/users/me` without token | 401 |
| Mentors | `GET /api/mentors` | 200 or auth-gated 401/403 |
| Reputation | `GET /api/reputation/leaderboard` | 200 |
| Grades | `GET /api/grades` without token | 401 |
| Timetable | `GET /api/timetable/events` without token | 401 |
| Professors | `GET /api/professors` | 200 |
| Clubs | `GET /api/clubs` | 200 |
| Notifications | `GET /api/notifications` without token | 401 or 400 |
| Admin | `GET /api/admin/analytics` without admin token | 401/403 |
| Reports | `GET /api/reports` without token | 401/403 |
| Search | `GET /api/search?q=cmc` | 200 |
| Posts | `GET /api/posts/feed` | 200 or auth-gated 401 |
| Chat | `GET /api/chat/conversations` without token | 401 |
| Study groups | `GET /api/study-groups` | 200 |
| Events | `GET /api/events` | 200 |
| Materials | `GET /api/materials` | 200 |
| Marketplace | `GET /api/marketplace` | 200 |
| AI | `POST /api/ai/ask` with question | 200 if AI service/provider healthy |

## One-shot smoke script

```bash
base=http://localhost:3000/api
for path in \
  /health \
  /mentors \
  /reputation/leaderboard \
  /professors \
  /clubs \
  '/search?q=cmc' \
  /study-groups \
  /events \
  /materials \
  /marketplace
 do
  printf '%-35s' "$path"
  curl -s -o /tmp/cmc-smoke.out -w '%{http_code}\n' "$base$path"
 done
```

## Current verification

- Gateway rebuilt and restarted: ✅
- Runtime `/api/health` includes all source prefixes: ✅
- Non-destructive smoke list documented: ✅
- Full authenticated mutation smoke needs seeded test user/admin token before production launch.
