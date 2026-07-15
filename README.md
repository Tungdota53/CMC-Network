# CampusConnect - Student Social Network Platform

Hệ sinh thái số kết nối sinh viên trường Đại học CMC.

## 📋 Tính năng chính

| Module | Mô tả |
|---|---|
| 🔐 Authentication | Đăng ký email trường, OTP, Google/Microsoft login, 2FA |
| 👤 Student Profile | Hồ sơ sinh viên, MSSV, khoa, ngành, khóa, kỹ năng, chứng chỉ |
| 📱 Social Network | Feed, post (text/image/video/poll), like, comment, share, save |
| 📚 Study Matching | Tạo nhóm học, tìm partner, auto-match theo môn/khoa |
| 📖 Material Hub | Upload/download tài liệu, đánh giá, AI tóm tắt |
| 🎓 Mentor Connect | Kết nối khóa trên-khóa dưới, đặt lịch, rating |
| 🛒 Marketplace | Mua bán đồ cũ: giáo trình, laptop, xe đạp |
| 📅 Event Management | Tạo sự kiện CLB, QR check-in, export Excel |
| 💬 Realtime Chat | Chat cá nhân/nhóm, typing indicator, read receipt |
| 🤖 AI Assistant | Tóm tắt tài liệu, sinh đề cương, flashcard, gợi ý khóa học |
| ⭐ Reputation | Điểm uy tín, huy hiệu, ranking |
| 🛡️ Admin Dashboard | Thống kê DAU/MAU, quản lý user, báo cáo |

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Web Client  │  │ Admin Panel  │                 │
│  │  Next.js 16  │  │ Vite + React │                 │
│  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                          │
│         └────────┬────────┘                          │
│                  ▼                                   │
│  ┌───────────────────────────────┐                   │
│  │       API Gateway (NestJS)    │                   │
│  │  PORT: 3001                   │                   │
│  │  • CORS + Validation          │                   │
│  │  • Reverse Proxy              │                   │
│  │  • Rate Limiting              │                   │
│  └───────┬───┬───┬───┬───┬───┬───┘                   │
│          │   │   │   │   │   │   │                   │
│  ┌───────▼───▼───▼───▼───▼───▼───┐                   │
│  │       Service Layer            │                   │
│  │                                │                   │
│  │  auth-service     :3002        │                   │
│  │  user-service     :3003        │                   │
│  │  social-service   :3004        │                   │
│  │  chat-service     :3005 (WS)   │                   │
│  │  study-service    :3006        │                   │
│  │  material-service :3007        │                   │
│  │  marketplace-svc  :3008        │                   │
│  └──────────┬─────────────────────┘                   │
│             │                                          │
│  ┌──────────▼─────────────────────┐                   │
│  │       Data Layer                │                   │
│  │                                 │                   │
│  │  PostgreSQL  ← Prisma ORM       │                   │
│  │  Redis     ← Session/Cache      │                   │
│  │  S3        ← File Storage       │                   │
│  └─────────────────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js 18+
- npm 10+
- Docker + Docker Compose

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Khởi động Database
```bash
cd infrastructure
docker-compose up -d
```

### Bước 3: Cấu hình database
```bash
cd packages/database
npx prisma generate
npx prisma db push
```

### Bước 4: Chạy development
```bash
npm run dev
```

Các services sẽ chạy tại:
- Web Client: `http://localhost:3000`
- Admin Dashboard: `http://localhost:5173`
- API Gateway: `http://localhost:3001`
- Auth Service: `http://localhost:3002`
- User Service: `http://localhost:3003`
- Social Service: `http://localhost:3004`
- Chat Service: `http://localhost:3005` (WebSocket)
- Study Service: `http://localhost:3006`
- Material Service: `http://localhost:3007`
- Marketplace Service: `http://localhost:3008`

## 📁 Cấu trúc thư mục

```
campus-connect/
├── apps/
│   ├── web-client/          # Next.js 16 - Student frontend
│   ├── admin-dashboard/     # Vite + React - Admin panel
│   ├── api-gateway/         # NestJS - API Gateway + Proxy
│   ├── auth-service/        # NestJS - Authentication
│   ├── user-service/        # NestJS - User profiles
│   ├── social-service/      # NestJS - Posts, comments, likes
│   ├── chat-service/        # NestJS + Socket.IO - Realtime chat
│   ├── study-service/       # NestJS - Study groups
│   ├── material-service/    # NestJS - Study materials
│   └── marketplace-service/ # NestJS - Student marketplace
├── packages/
│   ├── database/            # Prisma ORM + shared schema
│   ├── logger/              # Winston shared logger
│   ├── ui-kit/              # Shared React components
│   └── eslint-config/       # Shared ESLint config
├── infrastructure/
│   └── docker-compose.yml   # PostgreSQL + Redis
├── turbo.json               # Turborepo config
└── API_DESIGN.md            # RESTful API documentation
```

## 🗄️ Database Schema

Xem chi tiết tại: `packages/database/prisma/schema.prisma`

Bao gồm 25+ models:
- User, Friendship, FriendRequest
- Post, Comment, PostLike, PostSave, CommentLike
- StudyGroup, StudyGroupMember, JoinRequest
- Material, MaterialBookmark, MaterialReview
- MentorProfile, MentorBooking, MentorReview
- Product
- Event, EventAttendee
- Conversation, ConversationMember, Message
- UserSkill, UserAchievement, UserCertificate, UserProject
- UserBadge, ReputationHistory

## 🛡️ Security

- JWT Access Token (15 min expiry)
- Refresh Token (7 days)
- 2FA (TOTP)
- RBAC (Student, Teacher, Admin, Club Leader)
- Rate Limiting per endpoint
- XSS Protection
- CSRF Protection
- SQL Injection Protection (Prisma ORM)
- File Upload Validation (type, size)
- Email verification (OTP)

## 🚢 Deployment

PM2/deploy/cache checklist: `DEPLOYMENT_STABILITY_CHECKLIST.md`.

Healthcheck sau deploy:

```bash
npm run deploy:healthcheck
```

## 📊 Ước tính chi phí hạ tầng (10,000 users)

| Service | Plan | Cost/month |
|---|---|---|
| AWS EC2 (t3.medium) | 2 instances | $60 |
| RDS PostgreSQL (db.t3.small) | 20GB | $25 |
| ElastiCache Redis (cache.t3.micro) | - | $12 |
| S3 Storage | 50GB | $1.15 |
| CloudFront CDN | - | $5 |
| **Total** | | **~$103/month** |

## 🗺️ Roadmap 6 tháng

| Tháng | Milestone |
|---|---|
| Tháng 1 | Auth + Profile + Basic Feed |
| Tháng 2 | Social (comment, like, share) + Chat |
| Tháng 3 | Study Groups + Material Hub |
| Tháng 4 | Marketplace + Events |
| Tháng 5 | Mentor Connect + AI Assistant |
| Tháng 6 | Reputation System + Admin Dashboard + Production Deploy |

## 📈 Scale lên 100,000 users

- Horizontal scaling: Auto-scaling groups cho mỗi service
- Database: Read replicas + Connection pooling (PgBouncer)
- Cache: Redis Cluster cho session + feed cache
- Queue: RabbitMQ cho async tasks (email, notifications, AI processing)
- CDN: CloudFront cho static files + images
- Load Balancer: ALB trước API Gateway
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
