# PHASE 6: POLISH & LAUNCH
## Testing + Security Audit + Performance + Beta + Production Deployment

> **Duration:** Tuần 25-26 (14 ngày)
> **Prerequisite:** Phase 5 hoàn thành
> **Goal:** Hệ thống sẵn sàng production, beta test với 100 sinh viên, go-live
> **UI Rule:** Tất cả icon dùng inline SVG (Lucide) — KHÔNG dùng emoji.

---

## MỤC LỤC

- [Step 6.1: Security Audit & Hardening](#step-61-security-audit--hardening)
- [Step 6.2: Performance Optimization](#step-62-performance-optimization)
- [Step 6.3: Testing](#step-63-testing)
- [Step 6.4: Beta Testing](#step-64-beta-testing)
- [Step 6.5: Production Deployment](#step-65-production-deployment)
- [Step 6.6: Post-Launch Monitoring](#step-66-post-launch-monitoring)

---

## STEP 6.1: SECURITY AUDIT & HARDENING

> **Duration:** 3 ngày | **Assign:** Dev 1 + Dev 5
> **Prerequisite:** Phase 5

### Security Checklist

#### Authentication & Authorization

```
[ ] JWT tokens have short TTL (15min)
[ ] Refresh tokens rotate on use
[ ] Refresh tokens stored in httpOnly cookies
[ ] Token blacklist on logout (Redis)
[ ] Password hashing: bcrypt, rounds ≥ 12
[ ] Password complexity enforcement
[ ] Account lockout after 5 failed attempts (15min)
[ ] 2FA (TOTP) working correctly
[ ] OAuth2 state parameter validation
[ ] Session timeout (30 days inactive)
[ ] All auth endpoints rate-limited
```

#### API Security

```
[ ] All endpoints require authentication (except public)
[ ] RBAC enforced (Admin endpoints → ADMIN role only)
[ ] Resource ownership check (users can only edit own resources)
[ ] Request validation (class-validator, whitelist: true)
[ ] No mass assignment vulnerabilities
[ ] SQL injection protection (Prisma parameterized queries)
[ ] No raw SQL without parameterization
```

#### Input Validation & Sanitization

```
[ ] All user input validated (class-validator)
[ ] HTML sanitized in post/comment content (DOMPurify)
[ ] File upload validation (MIME type check via magic bytes)
[ ] File size limits enforced
[ ] Filename sanitization (no path traversal)
[ ] JSON payload size limit (10MB)
[ ] Query parameter validation
```

#### HTTP Security Headers (Helmet.js)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "*.campusconnect.dev"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "api.openai.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

#### CORS Configuration

```typescript
app.enableCors({
  origin: [
    'https://campusconnect.yourdomain.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000',
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

#### Rate Limiting

```
[ ] Global: 100 req/min per IP
[ ] Auth login: 10/5min per IP
[ ] Auth register: 5/hour per IP
[ ] Auth resend OTP: 1/3min per IP
[ ] Upload: 10/min per user
[ ] AI: 5/min per user
[ ] Chat send: 30/min per user
[ ] Search: 30/min per user
```

#### Data Protection

```
[ ] Sensitive data encrypted at rest (passwords, 2FA secrets)
[ ] HTTPS enforced (redirect HTTP → HTTPS)
[ ] Database connections via private network
[ ] Environment variables not in code
[ ] .env not committed to git
[ ] Logs don't contain passwords/tokens
[ ] User data export capability (GDPR-like)
[ ] Account deletion capability
```

---

## STEP 6.2: PERFORMANCE OPTIMIZATION

> **Duration:** 3 ngày | **Assign:** Dev 1 (BE) + Dev 3 (FE)
> **Prerequisite:** Phase 5

### Backend Optimization

```
[ ] Redis caching for frequently accessed data:
    ├── User profiles: 5min TTL
    ├── Feed: 2min TTL
    ├── Faculties/Majors list: 1hour TTL
    ├── Badge list: 1hour TTL
    └── Leaderboard: 15min TTL
[ ] Database query optimization:
    ├── All queries use proper indexes
    ├── N+1 queries eliminated (Prisma include/select)
    ├── Pagination is cursor-based for large datasets
    └── EXPLAIN ANALYZE on slow queries
[ ] Connection pooling:
    ├── Prisma connection pool: 10-20
    └── Redis connection pool
[ ] Response compression: gzip/brotli
[ ] Image optimization:
    ├── Auto-resize on upload (thumbnail + medium + original)
    ├── WebP format conversion
    └── CDN caching for static files
[ ] Lazy loading for heavy operations
[ ] Background jobs for async processing
```

### Frontend Optimization

```
[ ] Next.js optimizations:
    ├── Image optimization (next/image)
    ├── Font optimization (next/font)
    ├── Dynamic imports for heavy components
    ├── Route-based code splitting (automatic)
    └── Static generation where possible
[ ] React optimizations:
    ├── React.memo for expensive components
    ├── useMemo/useCallback where needed
    ├── Virtual scrolling for long lists (react-window)
    └── Debounced search input (300ms)
[ ] Asset optimization:
    ├── Bundle size analysis (next-bundle-analyzer)
    ├── Tree shaking
    ├── CSS purging (Tailwind automatic)
    └── Preload critical assets
[ ] Caching:
    ├── React Query cache configuration
    ├── Service Worker for offline support (optional)
    └── Browser cache headers
[ ] UX optimizations:
    ├── Skeleton loading for all pages
    ├── Optimistic updates (like, save, etc.)
    ├── Infinite scroll with intersection observer
    └── Progressive image loading
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response (P50) | < 100ms | Prometheus |
| API Response (P95) | < 300ms | Prometheus |
| API Response (P99) | < 1s | Prometheus |
| Feed Load | < 500ms | Chrome DevTools |
| Chat Message Delivery | < 200ms | Socket.IO logs |
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Lighthouse Performance | ≥ 85 | Lighthouse |
| Lighthouse Accessibility | ≥ 90 | Lighthouse |
| Bundle Size (JS) | < 200KB gzipped | next-bundle-analyzer |

---

## STEP 6.3: TESTING

> **Duration:** 5 ngày | **Assign:** Toàn team
> **Prerequisite:** Step 6.1, 6.2

### Backend Tests

#### Unit Tests (Jest)

```
Target: ≥80% coverage for services

Phải test:
├── auth.service.ts
│   ├── register (validate email domain, duplicate check, hash, OTP)
│   ├── verifyEmail (OTP validation, activation)
│   ├── login (password check, 2FA, token generation)
│   ├── refreshToken (rotation, revocation)
│   └── changePassword, forgotPassword, resetPassword
├── users.service.ts
│   ├── getProfile, updateProfile
│   ├── Skills/Achievements/Certificates/Projects CRUD
│   └── searchUsers
├── posts.service.ts
│   ├── createPost, updatePost, deletePost
│   ├── likePost, unlikePost
│   └── feed algorithm
├── chat service (message delivery, room management)
├── materials service (upload, download, rating)
├── mentors service (booking, review)
├── products service (CRUD, favorites, reports)
├── events service (registration, QR, check-in)
├── reputation service (points, badges)
└── admin service (stats, moderation)
```

#### Integration Tests (E2E)

```
Target: Critical user flows

├── Auth flow: register → verify → login → refresh → logout
├── Social flow: create post → like → comment → share
├── Chat flow: create conversation → send message → read
├── Study flow: create group → join → approve
├── Material flow: upload → download → rate
├── Mentor flow: register → book → confirm → complete → review
├── Marketplace flow: post → contact → mark sold
├── Event flow: create → publish → register → QR → check-in
└── Admin flow: ban user → resolve report → approve material
```

### Frontend Tests

#### Component Tests (React Testing Library)

```
Target: All UI components + key page components

├── UI components: Button, Input, Card, Modal, Toast
├── Auth forms: LoginForm, RegisterForm, OtpInput
├── Feed: PostCard, CommentList, ReactionPicker
├── Chat: MessageBubble, ConversationList
└── Profile: ProfileHeader, SkillList, BadgeGrid
```

#### E2E Tests (Playwright)

```typescript
// tests/e2e/auth.spec.ts
test('complete registration flow', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@sv.hcmue.edu.vn');
  await page.fill('[name="password"]', 'SecureP@ss123');
  await page.fill('[name="fullName"]', 'Test User');
  await page.fill('[name="studentId"]', 'K65TEST001');
  await page.selectOption('[name="facultyId"]', 'CNTT');
  await page.selectOption('[name="majorId"]', 'CNPM');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/verify-email/);
});

// tests/e2e/feed.spec.ts
test('create and interact with post', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/feed');
  await page.fill('[data-testid="create-post-input"]', 'Hello CampusConnect!');
  await page.click('[data-testid="submit-post"]');
  await expect(page.locator('[data-testid="post-card"]').first()).toContainText('Hello');
  await page.click('[data-testid="like-button"]');
  await expect(page.locator('[data-testid="like-count"]')).toContainText('1');
});
```

### Test Coverage Report

```bash
# Backend
cd backend && npm run test -- --coverage
# Target: statements ≥80%, branches ≥70%, functions ≥80%, lines ≥80%

# Frontend
cd frontend && npm run test -- --coverage
# Target: statements ≥70%, branches ≥60%, functions ≥70%, lines ≥70%

# E2E
cd frontend && npx playwright test
# Target: all critical flows pass
```

---

## STEP 6.4: BETA TESTING

> **Duration:** 5 ngày | **Assign:** Dev 5 (deploy) + toàn team (fix bugs)
> **Prerequisite:** Step 6.3

### Beta Plan

1. **Tuyển 50-100 beta testers** (sinh viên thật)
2. **Deploy staging trên VPS**
3. **Monitoring setup**
4. **Feedback collection**

### Beta Deployment

```bash
# Deploy lên VPS staging
ssh staging-vps

# 1. Pull code
cd /opt/campusconnect
git pull origin develop

# 2. Build & start
docker compose -f docker-compose.staging.yml up -d --build

# 3. Run migrations
docker compose exec api npx prisma migrate deploy

# 4. Seed data
docker compose exec api npx prisma db seed

# 5. Health check
curl -f https://staging.campusconnect.yourdomain.com/api/v1/health
```

### Beta Feedback Channels

- Google Form cho bug reports
- Discord/Telegram group cho feedback trực tiếp
- In-app feedback button (bottom-right corner)
- Sentry for automatic error tracking

### Beta Checklist

```
[ ] Staging VPS setup & deployed
[ ] SSL certificate configured
[ ] 50-100 beta users registered
[ ] All 12 modules functional
[ ] Mobile responsiveness verified by users
[ ] Bug tracking spreadsheet/board setup
[ ] Daily bug triage meetings
[ ] Critical bugs fixed within 24h
[ ] Feedback collected and categorized
[ ] Performance under real usage acceptable
[ ] No data loss or corruption
```

---

## STEP 6.5: PRODUCTION DEPLOYMENT

> **Duration:** 2 ngày | **Assign:** Dev 1 + Dev 5
> **Prerequisite:** Step 6.4 (beta sign-off)

### Pre-deployment Checklist

```
PRE-DEPLOYMENT:
[ ] All critical/high bugs from beta fixed
[ ] All tests passing (unit + integration + E2E)
[ ] Security audit completed
[ ] Performance targets met
[ ] Database backed up
[ ] Environment variables configured for production
[ ] SSL certificate ready (Let's Encrypt)
[ ] Domain DNS configured
[ ] Monitoring tools setup
[ ] Error tracking (Sentry) configured
[ ] Logging configured (structured JSON)
[ ] Rate limiting configured
[ ] CORS whitelist production domains only
[ ] Email sending configured
[ ] File storage (MinIO) data migrated
```

### VPS Production Setup

```bash
# 1. VPS Requirements
# Ubuntu 22.04 LTS
# 8 vCPU, 16GB RAM, 160GB SSD (for 10K users)
# Docker + Docker Compose installed

# 2. Security hardening
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. Install Docker
curl -fsSL https://get.docker.com | sh
sudo apt install docker-compose-plugin

# 4. SSL with Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d campusconnect.yourdomain.com

# 5. Clone & deploy
git clone https://github.com/your-org/campusconnect.git /opt/campusconnect
cd /opt/campusconnect

# 6. Configure production env
cp backend/.env.example backend/.env.production
# Edit with production values

# 7. Build & launch
docker compose -f docker-compose.prod.yml up -d --build

# 8. Run migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# 9. Seed initial data
docker compose -f docker-compose.prod.yml exec api npx prisma db seed

# 10. Setup auto-renewal for SSL
sudo crontab -e
# 0 0 1 * * certbot renew --quiet && docker compose -f /opt/campusconnect/docker-compose.prod.yml restart nginx

# 11. Setup automated backups
# Backup script chạy daily
cat > /opt/campusconnect/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/campusconnect"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
docker compose -f /opt/campusconnect/docker-compose.prod.yml exec -T db \
  pg_dump -U campusconnect campusconnect | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF
chmod +x /opt/campusconnect/backup.sh

# Cron: daily at 3 AM
# 0 3 * * * /opt/campusconnect/backup.sh
```

### Post-deployment Verification

```
DEPLOYMENT:
[ ] Docker containers running healthy
[ ] API health endpoint responding
[ ] Frontend loading correctly
[ ] Database migrations applied
[ ] SSL working (HTTPS)
[ ] WebSocket connections working
[ ] Email sending working
[ ] File upload/download working
[ ] AI features working
[ ] Search (PostgreSQL FTS) working

POST-DEPLOYMENT (first 30 min):
[ ] Register new account flow works
[ ] Login works
[ ] Create post works
[ ] Chat works
[ ] Upload material works
[ ] No 500 errors in Sentry
[ ] API response times acceptable
[ ] No memory leaks visible
```

---

## STEP 6.6: POST-LAUNCH MONITORING

> **Duration:** Ongoing
> **Assign:** Dev 5 (DevOps) + rotating on-call

### Monitoring Stack

```yaml
# Thêm vào docker-compose.prod.yml

  # Prometheus (metrics collection)
  prometheus:
    image: prom/prometheus
    container_name: cc-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: always

  # Grafana (dashboards)
  grafana:
    image: grafana/grafana
    container_name: cc-grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - cc_grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: always

  # Node Exporter (system metrics)
  node-exporter:
    image: prom/node-exporter
    container_name: cc-node-exporter
    restart: always
```

### Key Dashboards

1. **System Health**
   - CPU/Memory/Disk usage
   - Docker container status
   - Network traffic

2. **Application Metrics**
   - Request rate (req/sec)
   - Response time (P50, P95, P99)
   - Error rate (4xx, 5xx)
   - Active WebSocket connections

3. **Business Metrics**
   - Active users (realtime)
   - New registrations
   - Messages sent
   - Posts created
   - Materials uploaded

### Alerting Rules

| Alert | Condition | Channel |
|-------|-----------|---------|
| API Down | Health check fails 3x | Telegram + Email |
| High Error Rate | 5xx > 5% for 5min | Telegram |
| High CPU | > 85% for 10min | Email |
| High Memory | > 90% for 5min | Telegram |
| Disk Full | > 85% | Telegram + Email |
| DB Connections | > 80% pool | Email |
| SSL Expiry | < 7 days | Email |

### Runbook

```
🔴 API DOWN:
1. Check Docker: docker compose ps
2. Check logs: docker compose logs api --tail 100
3. Restart: docker compose restart api
4. Check DB: docker compose exec db pg_isready
5. Check Redis: docker compose exec redis redis-cli ping

🟡 HIGH MEMORY:
1. Check processes: docker stats
2. Check for memory leaks: node --inspect
3. Restart API: docker compose restart api
4. Consider scaling up VPS

🟡 HIGH ERROR RATE:
1. Check Sentry for error details
2. Check API logs: docker compose logs api --tail 200
3. Check recent deployments
4. Rollback if needed: git revert && redeploy
```

---

## FINAL DELIVERABLES CHECKLIST

```
✅ CODEBASE
[ ] Frontend: Next.js app (all 12 modules)
[ ] Backend: NestJS app (all 12 modules)
[ ] Database: PostgreSQL with all tables + indexes
[ ] Cache: Redis configured
[ ] Queue: BullMQ workers (Redis-based)
[ ] Search: PostgreSQL Full-Text Search (tsvector + pg_trgm)
[ ] Storage: Local disk / S3 for files
[ ] Docker: docker-compose.dev.yml + docker-compose.prod.yml

✅ DOCUMENTATION
[ ] README.md (setup + run instructions)
[ ] API documentation (Swagger / OpenAPI)
[ ] Database ERD diagram
[ ] Architecture diagram
[ ] Deployment guide
[ ] Plans folder (this series of files)

✅ TESTING
[ ] Unit tests (≥80% BE, ≥70% FE)
[ ] Integration tests (critical flows)
[ ] E2E tests (Playwright)
[ ] Security audit passed
[ ] Performance audit passed

✅ INFRASTRUCTURE
[ ] CI/CD pipeline (GitHub Actions)
[ ] VPS deployment working
[ ] SSL configured
[ ] Monitoring (Prometheus + Grafana)
[ ] Error tracking (Sentry)
[ ] Automated backups
[ ] Alerting configured

✅ OPERATIONS
[ ] Runbook for common issues
[ ] On-call rotation defined
[ ] Incident response process
[ ] Backup restoration tested
```

---

> **LAUNCH DAY**
>
> Mở đăng ký cho sinh viên, quảng bá qua các kênh trường đại học.
> Target: 1,000 users trong tuần đầu tiên.
>
> **Post-launch:** Tiếp tục iterate dựa trên user feedback, phát triển mobile app (React Native) trong Phase tiếp theo.
