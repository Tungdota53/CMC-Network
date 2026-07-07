# PHASE 1: FOUNDATION
## Project Setup + Database + Authentication + Student Profile

> **Duration:** Tuần 1-6 (42 ngày)
> **Team focus:** Toàn bộ 5 người
> **Goal:** Có hệ thống chạy được với đăng ký, đăng nhập, profile
> **UI Rule:** Tất cả icon dùng inline SVG (Lucide) — KHÔNG dùng emoji. Xem Icon Mapping Table trong 00-MASTER-PLAN.md.

---

## MỤC LỤC

- [Step 1.1: Project Setup](#step-11-project-setup--monorepo--docker)
- [Step 1.2: Database Schema](#step-12-database-schema--prisma)
- [Step 1.3: Auth Backend](#step-13-auth-module-backend)
- [Step 1.4: Auth Frontend](#step-14-auth-frontend)
- [Step 1.5: Profile Backend](#step-15-profile-module-backend)
- [Step 1.6: Profile Frontend](#step-16-profile-frontend)
- [Step 1.7: Integration & Testing](#step-17-integration--testing)

---

## STEP 1.1: PROJECT SETUP — MONOREPO + DOCKER

> **Duration:** 3-4 ngày | **Assign:** Dev 1 (Tech Lead) + Dev 5 (DevOps)
> **Prerequisite:** Không

### Mục tiêu
- Setup monorepo structure
- Docker Compose chạy được toàn bộ services
- CI/CD cơ bản với GitHub Actions
- ESLint + Prettier cấu hình chung

### Tasks

#### 1.1.1 Khởi tạo Repository

```bash
# Cấu trúc monorepo
campusconnect/
├── frontend/                  # Next.js app
├── backend/                   # NestJS app
├── docker/                    # Docker configs
│   ├── nginx/
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql
├── plans/                     # Plan files (thư mục này)
├── docs/                      # Documentation
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docker-compose.yml         # Development
├── docker-compose.prod.yml    # Production
├── .gitignore
├── .editorconfig
└── README.md
```

#### 1.1.2 Backend Setup (NestJS)

```bash
# Tạo NestJS project
npx -y @nestjs/cli new backend --skip-git --package-manager npm

# Cài dependencies
cd backend
npm install @nestjs/config @nestjs/passport @nestjs/jwt passport passport-jwt
npm install @nestjs/swagger swagger-ui-express
npm install @prisma/client prisma
npm install @nestjs/bullmq bullmq ioredis      # BullMQ thay RabbitMQ (dùng Redis)
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install bcryptjs class-validator class-transformer
npm install helmet cors cookie-parser
npm install nodemailer uuid isomorphic-dompurify  # DOMPurify cho XSS protection
npm install file-type                              # Magic bytes file validation
npm install -D @types/bcryptjs @types/passport-jwt @types/nodemailer @types/uuid
```

**Cấu trúc backend ban đầu:**

```
backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── config/
│   │   ├── app.config.ts          # PORT, NODE_ENV
│   │   ├── database.config.ts     # DATABASE_URL
│   │   ├── jwt.config.ts          # JWT_SECRET, TTL
│   │   ├── redis.config.ts        # REDIS_URL
│   │   └── mail.config.ts         # SMTP config
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   └── api-response.dto.ts
│   ├── exceptions/
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── middleware/
│   │   └── request-id.middleware.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── utils/
│       ├── hash.util.ts           # bcrypt wrapper
│       ├── otp.util.ts            # OTP generation
│       └── pagination.util.ts
├── database/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── modules/
    ├── auth/                      # Phase 1
    └── users/                     # Phase 1
```

**File chi tiết:**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CampusConnect API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

```typescript
// src/common/dto/api-response.dto.ts
export class ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

```typescript
// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data: data?.data ?? data,
        meta: data?.meta ?? undefined,
      })),
    );
  }
}
```

```typescript
// src/common/exceptions/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || exception.message;
      code = res.code || this.getErrorCode(status);
      details = Array.isArray(res.message) ? res.message.map(m => ({ message: m })) : undefined;
    }

    response.status(status).json({
      success: false,
      error: { code, message: Array.isArray(message) ? message[0] : message, details },
    });
  }

  private getErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[status] || 'INTERNAL_ERROR';
  }
}
```

```typescript
// src/common/utils/hash.util.ts
import * as bcrypt from 'bcryptjs';

export class HashUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

```typescript
// src/common/utils/otp.util.ts
export class OtpUtil {
  static generate(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}
```

#### 1.1.3 Frontend Setup (Next.js)

```bash
# Tạo Next.js project
npx -y create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias

# Cài dependencies
cd frontend
npm install zustand @tanstack/react-query axios socket.io-client
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react clsx tailwind-merge
npm install date-fns
npm install -D @types/node
```

**Cấu trúc frontend ban đầu:**

```
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx
│   ├── (main)/
│   │   ├── feed/page.tsx              # Placeholder
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── edit/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   ├── page.tsx                       # Landing page
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── VerifiedBadge.tsx              # Tích xanh Facebook-style
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx
│   │   └── Modal.tsx
│   ├── shared/
│   │   └── UserName.tsx                   # Tên user + tích xanh (dùng ở mọi nơi)
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       └── OtpInput.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useDebounce.ts
├── lib/
│   ├── api.ts                         # Axios instance
│   ├── utils.ts                       # cn() helper
│   ├── constants.ts
│   └── validators.ts                  # Zod schemas
├── store/
│   ├── authStore.ts
│   └── uiStore.ts
└── types/
    ├── user.ts
    └── api.ts
```

### Verified Badge Component (Facebook-style)

> Tích xanh hiển thị ngay sau tên user ở **mọi nơi** trên hệ thống:
> Profile, bài viết, bình luận, chat, search results, leaderboard, tag mentions...

#### SVG Icon (giống Facebook)

```tsx
// components/ui/VerifiedBadge.tsx

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';      // sm=14px, md=16px, lg=20px
  className?: string;
}

export function VerifiedBadge({ size = 'md', className }: VerifiedBadgeProps) {
  const sizeMap = { sm: 14, md: 16, lg: 20 };
  const px = sizeMap[size];

  return (
    <div 
      className={cn('verified-badge-wrapper', className)}
      tabIndex={0}
    >
      <div className="verified-badge" style={{ width: px, height: px }}>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          role="img"
          aria-label="Tài khoản đã xác minh"
          className="verified-badge-svg"
        >
          <g fillRule="evenodd" transform="translate(-92)">
            <path d="m109.207 9.707-6.5 6.5a.996.996 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L102 14.086l5.793-5.793a1 1 0 1 1 1.414 1.414m6.68 4.768L114.618 12l1.267-2.474a1.02 1.02 0 0 0-.355-1.326l-2.334-1.51-.14-2.775a1.018 1.018 0 0 0-.97-.971l-2.778-.14-1.51-2.336a1.02 1.02 0 0 0-1.324-.354L104 1.38 101.526.114a1.02 1.02 0 0 0-1.326.354l-1.509 2.336-2.777.14a1.017 1.017 0 0 0-.97.97l-.14 2.777L92.468 8.2a1.02 1.02 0 0 0-.354 1.325L93.382 12l-1.268 2.474a1.02 1.02 0 0 0 .355 1.326l2.335 1.509.14 2.776c.025.528.443.945.97.971l2.777.14 1.51 2.336a1.02 1.02 0 0 0 1.324.354L104 22.62l2.474 1.267c.469.242 1.039.09 1.326-.355l1.51-2.335 2.776-.14c.527-.026.945-.443.97-.97l.14-2.777 2.336-1.51c.443-.286.595-.856.354-1.324" />
          </g>
        </svg>
      </div>
    </div>
  );
}
```

#### Component hiển thị tên + tích xanh (dùng chung toàn app)

```tsx
// components/shared/UserName.tsx

import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface UserNameProps {
  name: string;
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';     // Ảnh hưởng cả font size và badge size
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'p';
}

export function UserName({
  name,
  isVerified,
  size = 'md',
  className,
  as: Tag = 'span',
}: UserNameProps) {
  const fontSizeMap = {
    sm: 'text-sm',       // 13px — dùng trong comment, chat bubble
    md: 'text-base',     // 15px — dùng trong post header, search result
    lg: 'text-xl',       // 20px — dùng trong profile header
  };

  return (
    <Tag className={cn(
      'inline-flex items-center gap-1 font-semibold',
      fontSizeMap[size],
      className
    )}>
      {name}
      {isVerified && <VerifiedBadge size={size} />}
    </Tag>
  );
}
```

#### CSS cho Verified Badge

```css
/* globals.css */

.verified-badge-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
  vertical-align: middle;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0866FF; /* Màu xanh chuẩn Meta/Facebook */
  position: relative;
  transition: transform var(--motion-fast) var(--motion-easing);
}

/* Lớp lót màu trắng bên dưới cho dấu tick */
.verified-badge::before {
  content: '';
  position: absolute;
  width: 55%;
  height: 55%;
  background-color: #FFFFFF;
  border-radius: 50%;
  z-index: 0;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.verified-badge-svg {
  width: 100%;
  height: 100%;
  z-index: 1; /* Nằm đè lên lớp lót trắng */
}

.verified-badge-wrapper:hover .verified-badge {
  transform: scale(1.1);
}

/* Tooltip khi hover vào tích xanh */
.verified-badge-wrapper::after {
  content: 'Tài khoản đã xác minh';
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-dark-bg-secondary, #242526);
  color: var(--color-dark-text-primary, #E4E6EB);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-fast) var(--motion-easing);
  z-index: 50;
}

.verified-badge-wrapper:hover::after {
  opacity: 1;
}
```

#### Nơi hiển thị Verified Badge trong app

| Vị trí | Component sử dụng | Size |
|--------|-------------------|------|
| Profile header (tên lớn) | `UserName size="lg"` | 20px |
| Post header (tên tác giả) | `UserName size="md"` | 16px |
| Comment (tên người bình luận) | `UserName size="sm"` | 14px |
| Chat conversation list | `UserName size="sm"` | 14px |
| Chat message header | `UserName size="sm"` | 14px |
| Search results | `UserName size="md"` | 16px |
| Friend list / suggestions | `UserName size="sm"` | 14px |
| Leaderboard | `UserName size="md"` | 16px |
| Notification dropdown | `UserName size="sm"` | 14px |
| Mentor card | `UserName size="md"` | 16px |
| Material author | `UserName size="sm"` | 14px |
| Product seller | `UserName size="sm"` | 14px |

> ⚠️ **Quy tắc quan trọng:** Bất cứ nơi nào hiển thị tên user, **PHẢI** dùng component `<UserName>` thay vì render text trực tiếp. Điều này đảm bảo tích xanh luôn xuất hiện đúng chỗ và nhất quán.

**File chi tiết:**

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto refresh token
// Refresh token được lưu ở httpOnly cookie (đặt bởi backend khi login/verify),
// nên request /auth/refresh-token chỉ cần withCredentials: true, không gửi body.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem('access_token', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, 'năm'],
    [2592000, 'tháng'],
    [86400, 'ngày'],
    [3600, 'giờ'],
    [60, 'phút'],
    [1, 'giây'],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label} trước`;
  }
  return 'vừa xong';
}
```

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: { field?: string; message: string }[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

```typescript
// src/types/user.ts
export interface User {
  id: string;
  email: string;
  fullName: string;
  studentId: string | null;
  avatarUrl: string | null;
  phone: string | null;
  facultyId: string | null;
  majorId: string | null;
  academicYear: string | null;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING';
  isEmailVerified: boolean;
  isVerified: boolean;           // Tích xanh (admin chỉ định)
  reputationScore: number;
  createdAt: string;

  // Relations
  faculty?: { id: string; name: string; code: string };
  major?: { id: string; name: string; code: string };
  skills?: UserSkill[];
  achievements?: UserAchievement[];
  certificates?: UserCertificate[];
  projects?: UserProject[];
  _count?: {
    posts: number;
    sentFriendRequests: number;
    receivedFriendRequests: number;
  };
}

export interface UserSkill {
  id: string;
  skillName: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string | null;
  proofUrl: string | null;
  achievedAt: string | null;
}

export interface UserCertificate {
  id: string;
  name: string;
  issuer: string | null;
  certificateUrl: string | null;
  issuedAt: string | null;
  expiredAt: string | null;
}

export interface UserProject {
  id: string;
  title: string;
  description: string | null;
  projectUrl: string | null;
  githubUrl: string | null;
  thumbnailUrl: string | null;
  techStack: string[];
}
```

#### 1.1.4 Docker Compose (Development)

```yaml
# docker-compose.yml (Development)
# CHỈ 2 services nền: PostgreSQL + Redis
# Queue: BullMQ dùng Redis (không cần RabbitMQ)
# Storage: Local disk (không cần MinIO cho dev)
# Search: PostgreSQL Full-Text Search (không cần Elasticsearch)
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: cc-db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: campusconnect
      POSTGRES_PASSWORD: cc_dev_pass
      POSTGRES_DB: campusconnect
    volumes:
      - cc_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U campusconnect"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cc-redis
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # RabbitMQ → BỎ (dùng BullMQ qua Redis)
  # MinIO → BỎ (dùng local disk: backend/uploads/)
  # Elasticsearch → BỎ (dùng PostgreSQL tsvector)

volumes:
  cc_postgres_data:
```

#### 1.1.5 Environment Files

```env
# backend/.env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://campusconnect:cc_dev_pass@localhost:5432/campusconnect

# Redis (dùng cho cache + BullMQ queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-dev-jwt-secret-min-32-characters-long
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-dev-refresh-secret-min-32-characters
JWT_REFRESH_EXPIRATION=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@campusconnect.dev

# File storage (local disk cho dev)
UPLOAD_DIR=./uploads
UPLOAD_MAX_SIZE=52428800  # 50MB
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
# Dev: file tĩnh được serve trực tiếp từ backend (local disk, KHÔNG chạy MinIO).
# Prod: trỏ về domain/CDN phục vụ thư mục uploads (xem StorageService).
NEXT_PUBLIC_UPLOADS_URL=http://localhost:3001/uploads
```

#### 1.1.6 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-lint-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  frontend-lint-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

### Checklist Step 1.1

```
[ ] Git repo initialized
[ ] Monorepo structure created
[ ] NestJS backend scaffolded
[ ] Next.js frontend scaffolded
[ ] Docker Compose development working
[ ] All services start with `docker compose up -d`
[ ] Backend runs on localhost:3001
[ ] Frontend runs on localhost:3000
[ ] Backend Swagger docs at localhost:3001/docs
[ ] .env files configured
[ ] GitHub Actions CI passing
[ ] ESLint + Prettier configured
[ ] .gitignore configured
```

---

## STEP 1.2: DATABASE SCHEMA + PRISMA

> **Duration:** 3-4 ngày | **Assign:** Dev 1 (Tech Lead) + Dev 2 (Backend)
> **Prerequisite:** Step 1.1

### Mục tiêu
- Prisma schema đầy đủ cho Phase 1 (Users, Auth, Profile)
- Migration chạy thành công
- Seed data (faculties, majors, subjects, email domains)

### Tasks

#### 1.2.1 Prisma Schema

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  STUDENT
  MODERATOR
  ADMIN
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum UserStatus {
  PENDING
  ACTIVE
  INACTIVE
  BANNED
}

enum ProfileVisibility {
  PUBLIC
  FRIENDS_ONLY
}

enum MessagePrivacy {
  EVERYONE
  FRIENDS
}

enum AvailabilityStatus {
  FREE           // Đang rảnh
  LOOKING_STUDY  // Tìm nhóm học
  LOOKING_COFFEE // Tìm cạ cafe
  BUSY           // Bận
  NONE           // Không hiển thị
}

enum FeaturedItemType {
  IMAGE
  STORY_HIGHLIGHT
  POST
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum OtpType {
  EMAIL_VERIFY
  PASSWORD_RESET
  TWO_FA
}

// ==================== CORE MODELS ====================

model AllowedEmailDomain {
  id              String   @id @default(uuid())
  domain          String   @unique                // "sv.hcmue.edu.vn"
  universityName  String   @map("university_name")
  universityCode  String   @map("university_code")
  logoUrl         String?  @map("logo_url")
  isActive        Boolean  @default(true) @map("is_active")
  maxUsers        Int?     @map("max_users")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("allowed_email_domains")
}

model Faculty {
  id          String   @id @default(uuid())
  name        String   @unique
  code        String   @unique
  description String?
  logoUrl     String?  @map("logo_url")
  createdAt   DateTime @default(now()) @map("created_at")

  majors      Major[]
  subjects    Subject[]
  users       User[]

  @@map("faculties")
}

model Major {
  id        String   @id @default(uuid())
  facultyId String   @map("faculty_id")
  name      String
  code      String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  faculty   Faculty  @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  users     User[]

  @@map("majors")
}

model Subject {
  id        String   @id @default(uuid())
  facultyId String?  @map("faculty_id")
  name      String
  code      String   @unique
  credits   Int      @default(3)
  semester  String?
  createdAt DateTime @default(now()) @map("created_at")

  faculty   Faculty? @relation(fields: [facultyId], references: [id])
  userSubjects UserSubject[]

  @@map("subjects")
}

model User {
  id              String     @id @default(uuid())
  email           String     @unique
  passwordHash    String     @map("password_hash")
  fullName        String     @map("full_name")
  studentId       String?    @unique @map("student_id")
  profileSlug     String     @unique @map("profile_slug")   // Custom profile ID (mặc định = studentId lowercase)
  avatarUrl       String?    @map("avatar_url")
  phone           String?
  gender          Gender?
  dateOfBirth     DateTime?  @map("date_of_birth")
  facultyId       String?    @map("faculty_id")
  majorId         String?    @map("major_id")
  academicYear    String?    @map("academic_year")
  role            UserRole   @default(STUDENT)
  status          UserStatus @default(PENDING)
  isEmailVerified Boolean    @default(false) @map("is_email_verified")
  is2faEnabled    Boolean    @default(false) @map("is_2fa_enabled")
  twoFaSecret     String?    @map("two_fa_secret")
  isVerified      Boolean    @default(false) @map("is_verified")    // Tích xanh (admin chỉ định)
  verifiedAt      DateTime?  @map("verified_at")
  verifiedBy      String?    @map("verified_by")                   // Admin ID đã cấp tích xanh
  reputationScore Int        @default(0) @map("reputation_score")
  lastActiveAt    DateTime?  @map("last_active_at")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  // Relations
  faculty           Faculty?           @relation(fields: [facultyId], references: [id])
  major             Major?             @relation(fields: [majorId], references: [id])
  refreshTokens     RefreshToken[]
  otpCodes          OtpCode[]
  sessions          Session[]
  skills            UserSkill[]
  achievements      UserAchievement[]
  certificates      UserCertificate[]
  projects          UserProject[]
  subjects          UserSubject[]
  privacy           UserPrivacy?       // Cài đặt quyền riêng tư
  featuredItems     FeaturedItem[]     // Đáng chú ý (ghim ảnh/story/bài viết)
  themeSong         ProfileThemeSong?  // Nhạc cá nhân
  availability      UserAvailability?  // Khung giờ rảnh
  interestTags      UserInterestTag[]  // Sở thích đa chiều

  @@index([email])
  @@index([studentId])
  @@index([profileSlug])
  @@index([facultyId])
  @@index([majorId])
  @@index([status])
  @@index([isVerified])
  @@index([reputationScore(sort: Desc)])
  @@map("users")
}

model UserPrivacy {
  id                  String           @id @default(uuid())
  userId              String           @unique @map("user_id")
  
  // Trạng thái hiển thị
  showActiveStatus    Boolean          @default(true) @map("show_active_status") // Chấm xanh
  sendReadReceipts    Boolean          @default(true) @map("send_read_receipts") // Đã xem (seen)
  
  // Quyền riêng tư profile
  profileVisibility   ProfileVisibility @default(PUBLIC) @map("profile_visibility")
  isProfileLocked     Boolean          @default(false) @map("is_profile_locked") // Bảo vệ trang cá nhân (Shield)
  showEmail           Boolean          @default(false) @map("show_email")
  showPhone           Boolean          @default(false) @map("show_phone")
  showFriends         Boolean          @default(true) @map("show_friends")
  
  // Quyền tương tác
  whoCanMessageMe     MessagePrivacy   @default(EVERYONE) @map("who_can_message_me")
  
  createdAt           DateTime         @default(now()) @map("created_at")
  updatedAt           DateTime         @updatedAt @map("updated_at")

  user                User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_privacy_settings")
}

// ==================== AUTH MODELS ====================

model RefreshToken {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  token      String   @unique
  deviceInfo String?  @map("device_info")
  ipAddress  String?  @map("ip_address")
  expiresAt  DateTime @map("expires_at")
  isRevoked  Boolean  @default(false) @map("is_revoked")
  createdAt  DateTime @default(now()) @map("created_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model OtpCode {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  code      String
  type      OtpType
  isUsed    Boolean  @default(false) @map("is_used")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("otp_codes")
}

model Session {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  deviceInfo   String?  @map("device_info")
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  isActive     Boolean  @default(true) @map("is_active")
  lastActiveAt DateTime @default(now()) @map("last_active_at")
  createdAt    DateTime @default(now()) @map("created_at")

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

// ==================== PROFILE MODELS ====================

model UserSkill {
  id        String     @id @default(uuid())
  userId    String     @map("user_id")
  skillName String     @map("skill_name")
  level     SkillLevel @default(BEGINNER)
  createdAt DateTime   @default(now()) @map("created_at")

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, skillName])
  @@map("user_skills")
}

model UserAchievement {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  title       String
  description String?
  proofUrl    String?  @map("proof_url")
  achievedAt  DateTime? @map("achieved_at")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_achievements")
}

model UserCertificate {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  name           String
  issuer         String?
  certificateUrl String?  @map("certificate_url")
  issuedAt       DateTime? @map("issued_at")
  expiredAt      DateTime? @map("expired_at")
  createdAt      DateTime @default(now()) @map("created_at")

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_certificates")
}

model UserProject {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  title        String
  description  String?
  projectUrl   String?  @map("project_url")
  githubUrl    String?  @map("github_url")
  thumbnailUrl String?  @map("thumbnail_url")
  techStack    Json     @default("[]") @map("tech_stack")
  createdAt    DateTime @default(now()) @map("created_at")

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_projects")
}

model UserSubject {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  subjectId String   @map("subject_id")
  semester  String?
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subject   Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([userId, subjectId, semester])
  @@map("user_subjects")
}

// ==================== PROFILE FEATURES (MỚI) ====================

// 1. FEATURED ITEMS — Đáng chú ý (Ghim ảnh / Story Highlight / Bài viết)
model FeaturedItem {
  id          String           @id @default(uuid())
  userId      String           @map("user_id")
  type        FeaturedItemType // IMAGE, STORY_HIGHLIGHT, POST
  title       String?          // Tiêu đề (VD: "Hội trại 2024")
  mediaUrl    String?          @map("media_url")    // URL ảnh/thumbnail
  referenceId String?          @map("reference_id") // postId hoặc storyHighlightId
  sortOrder   Int              @default(0) @map("sort_order") // Thứ tự hiển thị (0-5)
  createdAt   DateTime         @default(now()) @map("created_at")

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("featured_items")
}

// 2. PROFILE THEME SONG — Nhạc cá nhân
model ProfileThemeSong {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  title       String   // Tên bài hát
  artist      String   // Ca sĩ / Nghệ sĩ
  previewUrl  String?  @map("preview_url")  // URL đoạn nhạc 30s (từ Spotify/SoundCloud API)
  externalUrl String?  @map("external_url") // Link gốc trên Spotify/YouTube/SoundCloud
  albumArt    String?  @map("album_art")    // URL ảnh bìa album
  provider    String   @default("spotify")  // spotify | soundcloud | youtube
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profile_theme_songs")
}

// 3. AVAILABILITY / COFFEE TIME — Khung giờ rảnh
model UserAvailability {
  id              String             @id @default(uuid())
  userId          String             @unique @map("user_id")
  status          AvailabilityStatus @default(NONE)
  statusText      String?            @map("status_text")      // Custom text: "Rảnh buổi chiều, ai cafe k?"
  scheduleNote    String?            @map("schedule_note")    // Ghi chú TKB: "Sáng T2 T4 rảnh, chiều T3 T5 rảnh"
  expiresAt       DateTime?          @map("expires_at")       // Tự tắt sau X giờ (tránh quên)
  createdAt       DateTime           @default(now()) @map("created_at")
  updatedAt       DateTime           @updatedAt @map("updated_at")

  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_availability")
}

// 4. INTEREST TAGS — Sở thích đa chiều
model InterestTag {
  id        String           @id @default(uuid())
  name      String           @unique // VD: "GenshinImpact", "BoardGame", "Photography"
  slug      String           @unique // VD: "genshin-impact", "board-game"
  category  String?          // VD: "Gaming", "Thể thao", "Nghệ thuật", "Học tập"
  usageCount Int             @default(0) @map("usage_count") // Bao nhiêu user đang dùng tag này
  createdAt DateTime         @default(now()) @map("created_at")

  users     UserInterestTag[]

  @@index([category])
  @@index([usageCount(sort: Desc)])
  @@map("interest_tags")
}

model UserInterestTag {
  id        String      @id @default(uuid())
  userId    String      @map("user_id")
  tagId     String      @map("tag_id")
  createdAt DateTime    @default(now()) @map("created_at")

  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag       InterestTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([userId, tagId])
  @@index([tagId])
  @@map("user_interest_tags")
}
```

#### 1.2.2 Email Prefix → Faculty/Major Mapping (CMC University)

> Mã sinh viên trong email trường CMC tuân theo pattern:
> `[prefix][năm nhập học 2 số][số thứ tự]@st.cmcu.edu.vn`
>
> Ví dụ: `bit250109@st.cmcu.edu.vn` → prefix=`it` (Khoa CNTT, ngành CNTT), năm=2025, K4
> Ví dụ: `bai240312@st.cmcu.edu.vn` → prefix=`ai` (Khoa CNTT, ngành Trí tuệ Nhân tạo), năm=2024, K3

```typescript
// backend/src/common/config/email-prefix-mapping.ts

// Bảng ánh xạ prefix email → Faculty + Major
// Ký tự đầu 'b' là prefix campus, 2 ký tự sau là mã ngành
export const EMAIL_PREFIX_MAP: Record<string, { facultyCode: string; majorCode: string }> = {
  // === MÁY TÍNH VÀ CÔNG NGHỆ THÔNG TIN ===
  'it': { facultyCode: 'MTCNTT', majorCode: 'IT' },   // Công nghệ Thông tin
  'cs': { facultyCode: 'MTCNTT', majorCode: 'CS' },   // Khoa học Máy tính
  'ai': { facultyCode: 'MTCNTT', majorCode: 'AI' },   // Trí tuệ Nhân tạo
  'se': { facultyCode: 'MTCNTT', majorCode: 'SE' },   // Kỹ thuật Phần mềm
  'ns': { facultyCode: 'MTCNTT', majorCode: 'NS' },   // An ninh Mạng

  // === CÔNG NGHỆ KỸ THUẬT ===
  'ec': { facultyCode: 'CNKT', majorCode: 'EC' },     // Kỹ thuật Điện tử - Viễn thông

  // === KINH DOANH VÀ QUẢN LÝ ===
  'ba': { facultyCode: 'KDQL', majorCode: 'BA' },     // Quản trị Kinh doanh
  'ls': { facultyCode: 'KDQL', majorCode: 'LS' },     // Logistics và Quản lý chuỗi cung ứng
  'mk': { facultyCode: 'KDQL', majorCode: 'MK' },     // Digital Marketing
  'em': { facultyCode: 'KDQL', majorCode: 'EM' },     // Thương mại Điện tử
  'ib': { facultyCode: 'KDQL', majorCode: 'IB' },     // Kinh doanh Quốc tế

  // === BÁO CHÍ VÀ TRUYỀN THÔNG ===
  'mc': { facultyCode: 'BCTT', majorCode: 'MC' },     // Truyền thông Đa phương tiện
  'pr': { facultyCode: 'BCTT', majorCode: 'PR' },     // Quan hệ Công chúng

  // === NGHỆ THUẬT ===
  'gd': { facultyCode: 'NT', majorCode: 'GD' },       // Thiết kế Đồ họa
  'ga': { facultyCode: 'NT', majorCode: 'GA' },       // Đồ họa Game
  'da': { facultyCode: 'NT', majorCode: 'DA' },       // Thiết kế Mỹ thuật số

  // === NHÂN VĂN ===
  'kl': { facultyCode: 'NV', majorCode: 'KL' },       // Ngôn ngữ Hàn Quốc
  'cl': { facultyCode: 'NV', majorCode: 'CL' },       // Ngôn ngữ Trung Quốc
  'cb': { facultyCode: 'NV', majorCode: 'CB' },       // Tiếng Trung Thương mại
};

// Base year: K1 = 2022 (khóa đầu tiên CMC University)
const CMC_BASE_YEAR = 2022;

/**
 * Parse email sinh viên CMC để trích xuất thông tin tự động
 * Input:  "bit250109@st.cmcu.edu.vn"
 * Output: { majorCode: 'IT', facultyCode: 'MTCNTT', enrollmentYear: 2025, academicYear: 'K4' }
 */
export function parseCmcStudentEmail(email: string): {
  majorCode: string;
  facultyCode: string;
  enrollmentYear: number;
  academicYear: string;  // K1, K2, K3, K4...
  studentNumber: string; // Phần số thứ tự
} | null {
  const localPart = email.split('@')[0]; // "bit250109"

  // Bỏ ký tự đầu (campus prefix 'b'), lấy 2 ký tự tiếp theo là mã ngành
  if (localPart.length < 5) return null;

  const majorPrefix = localPart.substring(1, 3).toLowerCase(); // "it"
  const yearStr = localPart.substring(3, 5);                   // "25"
  const studentNumber = localPart.substring(5);                 // "0109"

  const mapping = EMAIL_PREFIX_MAP[majorPrefix];
  if (!mapping) return null;

  const enrollmentYear = 2000 + parseInt(yearStr, 10);         // 2025
  const kNumber = enrollmentYear - CMC_BASE_YEAR + 1;          // K4

  return {
    majorCode: mapping.majorCode,
    facultyCode: mapping.facultyCode,
    enrollmentYear,
    academicYear: `K${kNumber}`,
    studentNumber,
  };
}
```

#### 1.2.3 Seed Data (CMC University)

```typescript
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { HashUtil } from '../src/common/utils/hash.util';

const prisma = new PrismaClient();

async function main() {
  // 1. Allowed Email Domains
  await prisma.allowedEmailDomain.createMany({
    data: [
      { domain: 'st.cmcu.edu.vn', universityName: 'CMC University', universityCode: 'CMC' },
    ],
    skipDuplicates: true,
  });

  // 2. Faculties (theo cơ cấu CMC University)
  const faculties = await Promise.all([
    prisma.faculty.create({ data: { name: 'Máy tính và Công nghệ Thông tin', code: 'MTCNTT' } }),
    prisma.faculty.create({ data: { name: 'Công nghệ Kỹ thuật', code: 'CNKT' } }),
    prisma.faculty.create({ data: { name: 'Kinh doanh và Quản lý', code: 'KDQL' } }),
    prisma.faculty.create({ data: { name: 'Báo chí và Truyền thông', code: 'BCTT' } }),
    prisma.faculty.create({ data: { name: 'Nghệ thuật', code: 'NT' } }),
    prisma.faculty.create({ data: { name: 'Nhân văn', code: 'NV' } }),
  ]);

  const getFaculty = (code: string) => faculties.find(f => f.code === code)!;

  // 3. Majors — Máy tính và CNTT
  await prisma.major.createMany({
    data: [
      { facultyId: getFaculty('MTCNTT').id, name: 'Công nghệ Thông tin', code: 'IT' },
      { facultyId: getFaculty('MTCNTT').id, name: 'Khoa học Máy tính', code: 'CS' },
      { facultyId: getFaculty('MTCNTT').id, name: 'Trí tuệ Nhân tạo', code: 'AI' },
      { facultyId: getFaculty('MTCNTT').id, name: 'Kỹ thuật Phần mềm', code: 'SE' },
      { facultyId: getFaculty('MTCNTT').id, name: 'An ninh Mạng', code: 'NS' },
    ],
  });

  // 4. Majors — Công nghệ Kỹ thuật
  await prisma.major.createMany({
    data: [
      { facultyId: getFaculty('CNKT').id, name: 'Kỹ thuật Điện tử - Viễn thông (Thiết kế vi mạch bán dẫn)', code: 'EC' },
    ],
  });

  // 5. Majors — Kinh doanh và Quản lý
  await prisma.major.createMany({
    data: [
      { facultyId: getFaculty('KDQL').id, name: 'Quản trị Kinh doanh', code: 'BA' },
      { facultyId: getFaculty('KDQL').id, name: 'Logistics và Quản lý chuỗi cung ứng', code: 'LS' },
      { facultyId: getFaculty('KDQL').id, name: 'Digital Marketing', code: 'MK' },
      { facultyId: getFaculty('KDQL').id, name: 'Thương mại Điện tử', code: 'EM' },
      { facultyId: getFaculty('KDQL').id, name: 'Kinh doanh Quốc tế', code: 'IB' },
    ],
  });

  // 6. Majors — Báo chí và Truyền thông
  await prisma.major.createMany({
    data: [
      { facultyId: getFaculty('BCTT').id, name: 'Truyền thông Đa phương tiện', code: 'MC' },
      { facultyId: getFaculty('BCTT').id, name: 'Quan hệ Công chúng', code: 'PR' },
    ],
  });

  // 7. Majors — Nghệ thuật
  await prisma.major.createMany({
    data: [
      { facultyId: getFaculty('NT').id, name: 'Thiết kế Đồ họa', code: 'GD' },
      { facultyId: getFaculty('NT').id, name: 'Đồ họa Game', code: 'GA' },
      { facultyId: getFaculty('NT').id, name: 'Thiết kế Mỹ thuật số', code: 'DA' },
    ],
  });

  // 8. Majors — Nhân văn
  await prisma.major.createMany({
    data: [
      { facultyId: getFaculty('NV').id, name: 'Ngôn ngữ Hàn Quốc', code: 'KL' },
      { facultyId: getFaculty('NV').id, name: 'Ngôn ngữ Trung Quốc', code: 'CL' },
      { facultyId: getFaculty('NV').id, name: 'Tiếng Trung Thương mại', code: 'CB' },
    ],
  });

  // 9. Subjects (ví dụ một số môn học chung + chuyên ngành)
  await prisma.subject.createMany({
    data: [
      { facultyId: getFaculty('MTCNTT').id, name: 'Lập trình Java', code: 'CS101', credits: 3 },
      { facultyId: getFaculty('MTCNTT').id, name: 'Cấu trúc Dữ liệu', code: 'CS102', credits: 4 },
      { facultyId: getFaculty('MTCNTT').id, name: 'Cơ sở Dữ liệu', code: 'CS201', credits: 3 },
      { facultyId: getFaculty('MTCNTT').id, name: 'Trí tuệ Nhân tạo', code: 'CS301', credits: 3 },
      { facultyId: getFaculty('MTCNTT').id, name: 'Phát triển Web', code: 'CS202', credits: 3 },
      { facultyId: getFaculty('MTCNTT').id, name: 'Mạng Máy tính', code: 'CS203', credits: 3 },
      { name: 'Tiếng Anh 1', code: 'EN101', credits: 3 },
      { name: 'Tiếng Anh 2', code: 'EN102', credits: 3 },
      { name: 'Toán Cao cấp', code: 'MA101', credits: 4 },
      { name: 'Xác suất Thống kê', code: 'MA201', credits: 3 },
    ],
  });

  // 10. Admin user
  const adminPassword = await HashUtil.hash('Admin@123');
  await prisma.user.create({
    data: {
      email: 'admin@campusconnect.dev',
      passwordHash: adminPassword,
      fullName: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      isVerified: true, // Admin tự có tích xanh
    },
  });

  console.log('✅ Seed data created successfully (CMC University)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 1.2.3 Prisma Service

```typescript
// backend/src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// backend/src/database/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Checklist Step 1.2

```
[ ] Prisma schema created with all Phase 1 models
[ ] npx prisma migrate dev runs successfully
[ ] npx prisma db seed runs successfully
[ ] Seed data populated (faculties, majors, subjects, email domains, admin)
[ ] PrismaService registered as global module
[ ] Database can be accessed from NestJS
```

---

## STEP 1.3: AUTH MODULE (BACKEND)

> **Duration:** 8-10 ngày | **Assign:** Dev 1 + Dev 2
> **Prerequisite:** Step 1.2

### Mục tiêu
- Đăng ký bằng email trường (validate domain từ bảng `allowed_email_domains`)
- Xác thực OTP qua email
- Đăng nhập (email/password)
- JWT Access Token (15min) + Refresh Token (7 days)
- Google OAuth + Microsoft OAuth
- 2FA (TOTP)
- Session management
- Đổi/quên mật khẩu

### Module Structure

```
backend/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── google.strategy.ts
│   └── microsoft.strategy.ts
├── guards/
│   └── jwt-auth.guard.ts      (hoặc dùng từ common)
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── verify-email.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   ├── change-password.dto.ts
│   ├── enable-2fa.dto.ts
│   └── verify-2fa.dto.ts
└── auth.service.spec.ts
```

### API Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/auth/register` | Đăng ký | 5/hour |
| `POST` | `/auth/verify-email` | Xác thực OTP | 10/hour |
| `POST` | `/auth/resend-otp` | Gửi lại OTP | 1/3min |
| `POST` | `/auth/login` | Đăng nhập | 10/5min |
| `GET` | `/auth/google` | Google OAuth redirect | — |
| `GET` | `/auth/google/callback` | Google OAuth callback | — |
| `GET` | `/auth/microsoft` | Microsoft OAuth redirect | — |
| `GET` | `/auth/microsoft/callback` | Microsoft OAuth callback | — |
| `POST` | `/auth/refresh-token` | Refresh access token | 30/min |
| `POST` | `/auth/logout` | Đăng xuất | — |
| `POST` | `/auth/logout-all` | Đăng xuất mọi thiết bị | — |
| `POST` | `/auth/forgot-password` | Gửi email reset | 3/hour |
| `POST` | `/auth/reset-password` | Reset password | 5/hour |
| `POST` | `/auth/change-password` | Đổi password | 5/hour |
| `POST` | `/auth/2fa/enable` | Bật 2FA | — |
| `POST` | `/auth/2fa/verify` | Xác thực 2FA | 5/5min |
| `POST` | `/auth/2fa/disable` | Tắt 2FA | — |
| `GET` | `/auth/sessions` | Danh sách sessions | — |
| `DELETE` | `/auth/sessions/:id` | Xóa session | — |

### DTO Details

```typescript
// dto/register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;                    // Phải là email trường (VD: bit250109@st.cmcu.edu.vn)

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  // Các field dưới đây là OPTIONAL vì hệ thống sẽ tự parse từ email
  // Hoặc user sẽ điền trong bước 2 (wizard)

  @IsString()
  @IsOptional()
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @IsString()
  @IsOptional()
  dateOfBirth?: string;            // ISO String YYYY-MM-DD

  @IsOptional()
  @IsString()
  facultyId?: string;              // Tự detect từ email, user có thể override

  @IsOptional()
  @IsString()
  majorId?: string;                // Tự detect từ email, user có thể override

  @IsOptional()
  @IsString()
  @MaxLength(10)
  academicYear?: string;           // K4, K3... tự detect, user có thể override
}
```

```typescript
// dto/login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
```

### Auth Service — Key Methods

```typescript
// auth.service.ts (pseudo implementation)
import { parseCmcStudentEmail } from '../../common/config/email-prefix-mapping';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  // === REGISTER ===
  async register(dto: RegisterDto) {
    // 1. Validate email domain
    const domain = dto.email.split('@')[1];
    const allowedDomain = await this.prisma.allowedEmailDomain.findFirst({
      where: { domain, isActive: true },
    });
    if (!allowedDomain) {
      throw new BadRequestException('Email không thuộc trường được hỗ trợ');
    }

    // 2. Check max users
    if (allowedDomain.maxUsers) {
      const count = await this.prisma.user.count({
        where: { email: { endsWith: `@${domain}` } },
      });
      if (count >= allowedDomain.maxUsers) {
        throw new BadRequestException('Trường đã đạt giới hạn người dùng');
      }
    }

    // 3. Check email exists
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email đã tồn tại');

    // 4. Auto-parse email để lấy faculty, major, khóa
    const parsed = parseCmcStudentEmail(dto.email);
    let facultyId = dto.facultyId || null;
    let majorId = dto.majorId || null;
    let academicYear = dto.academicYear || null;
    let studentId: string | null = null;

    if (parsed) {
      // Tự động tìm faculty + major từ email prefix
      const faculty = await this.prisma.faculty.findFirst({
        where: { code: parsed.facultyCode },
      });
      const major = await this.prisma.major.findFirst({
        where: { code: parsed.majorCode },
      });

      facultyId = facultyId || faculty?.id || null;
      majorId = majorId || major?.id || null;
      academicYear = academicYear || parsed.academicYear;   // VD: "K4"
      studentId = dto.email.split('@')[0].toUpperCase();    // VD: "BIT250109"
    }

    // 5. Check MSSV exists (nếu có)
    if (studentId) {
      const existingStudent = await this.prisma.user.findUnique({
        where: { studentId },
      });
      if (existingStudent) throw new ConflictException('MSSV đã tồn tại');
    }

    // 6. Hash password
    const passwordHash = await HashUtil.hash(dto.password);

    // 7. Create user (status = PENDING)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        studentId,
        profileSlug: studentId?.toLowerCase() || dto.email.split('@')[0].toLowerCase(),  // VD: "bit250109"
        gender: dto.gender || null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        facultyId,
        majorId,
        academicYear,
        status: 'PENDING',
      },
    });

    // 8. Generate & send OTP
    const otp = OtpUtil.generate(6);
    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otp,
        type: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    await this.mailService.sendOtp(dto.email, otp, dto.fullName);

    return {
      userId: user.id,
      message: 'OTP đã được gửi đến email của bạn',
      autoDetected: parsed ? {
        faculty: parsed.facultyCode,
        major: parsed.majorCode,
        academicYear: parsed.academicYear,
      } : null,
    };
  }

  // === VERIFY EMAIL ===
  async verifyEmail(dto: VerifyEmailDto) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        user: { email: dto.email },
        code: dto.otp,
        type: 'EMAIL_VERIFY',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!otpRecord) throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');

    // Mark OTP as used & activate user
    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
      this.prisma.user.update({
        where: { id: otpRecord.userId },
        data: { status: 'ACTIVE', isEmailVerified: true },
      }),
    ]);

    // Generate tokens
    return this.generateTokens(otpRecord.user);
  }

  // === LOGIN ===
  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    if (user.status === 'BANNED') throw new ForbiddenException('Tài khoản đã bị khóa');
    if (user.status === 'PENDING') throw new ForbiddenException('Vui lòng xác thực email');

    const isPasswordValid = await HashUtil.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    // Check 2FA
    if (user.is2faEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, type: 'temp_2fa' },
        { expiresIn: '5m' }
      );
      return { requires2fa: true, tempToken };
    }

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        deviceInfo: dto.deviceInfo,
        ipAddress: ip,
        userAgent,
      },
    });

    return this.generateTokens(user);
  }

  // === GENERATE TOKENS ===
  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      },
    );

    // Store refresh token in DB
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,   // Controller sẽ set vào httpOnly cookie, KHÔNG trả về body
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isVerified: user.isVerified,
        reputationScore: user.reputationScore,
      },
    };
  }
}
```

> **Quy ước Refresh Token (httpOnly cookie):**
> `generateTokens()` ở service trả về cả `accessToken` và `refreshToken`. Controller chịu trách
> nhiệm set `refreshToken` vào **httpOnly cookie** và **chỉ trả `accessToken` + `user` trong response body**.
> Frontend (`api.ts`) không bao giờ đọc/lưu refresh token; nó chỉ gọi `/auth/refresh-token` với
> `withCredentials: true` để trình duyệt tự gửi cookie. Điều này khớp với threat model (Master Plan §11:
> "httpOnly refresh cookie + token rotation").

```typescript
// auth.controller.ts — ví dụ login + refresh-token
@Post('login')
async login(@Body() dto: LoginDto, @Req() req, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);
  if ('requires2fa' in result) return result;        // chưa phát hành token đầy đủ
  this.setRefreshCookie(res, result.refreshToken);
  const { refreshToken, ...body } = result;          // loại refreshToken khỏi body
  return body;
}

@Post('refresh-token')
async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
  const oldToken = req.cookies['refresh_token'];     // cookie-parser đã bật ở main.ts
  const result = await this.authService.rotateRefreshToken(oldToken);
  this.setRefreshCookie(res, result.refreshToken);   // token rotation
  const { refreshToken, ...body } = result;
  return body;
}

private setRefreshCookie(res: Response, token: string) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });
}
```

### Checklist Step 1.3

```
[ ] Auth module created
[ ] Register endpoint working (email domain validation)
[ ] OTP email sending working
[ ] Verify email endpoint working
[ ] Login endpoint working (JWT + refresh)
[ ] JWT strategy (Passport) working
[ ] Refresh token rotation working
[ ] Logout (single + all devices) working
[ ] Forgot password flow working
[ ] Reset password flow working
[ ] Change password working
[ ] Google OAuth working
[ ] Microsoft OAuth working
[ ] 2FA (TOTP) enable/verify/disable working
[ ] Session management (list + revoke) working
[ ] Rate limiting on auth endpoints
[ ] Unit tests for auth.service (≥80% coverage)
[ ] Swagger docs for all auth endpoints
```

---

## STEP 1.4: AUTH FRONTEND

> **Duration:** 5-7 ngày | **Assign:** Dev 3 (Senior FE) + Dev 4 (FE)
> **Prerequisite:** Step 1.3 (API sẵn sàng), Step 1.1 (FE setup)

### Mục tiêu
- UI component library cơ bản (Button, Input, Card, Modal, Toast)
- Trang Login, Register, Verify OTP, Forgot Password
- Auth store (Zustand)
- Token management (auto refresh)

### Pages

#### Login Page (`/login`)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│              🎓 CampusConnect                          │
│          Kết nối sinh viên, mở rộng tri thức           │
│                                                        │
│    ┌──────────────────────────────────────────────┐    │
│    │  📧 Email trường học                         │    │
│    │  ┌──────────────────────────────────────┐    │    │
│    │  │ student@sv.hcmue.edu.vn              │    │    │
│    │  └──────────────────────────────────────┘    │    │
│    │                                              │    │
│    │  🔒 Mật khẩu                                │    │
│    │  ┌──────────────────────────────────────┐    │    │
│    │  │ ••••••••••                       👁️  │    │    │
│    │  └──────────────────────────────────────┘    │    │
│    │                                              │    │
│    │  ┌──────────────────────────────────────┐    │    │
│    │  │          Đăng nhập                    │    │    │
│    │  └──────────────────────────────────────┘    │    │
│    │                                              │    │
│    │               Quên mật khẩu?                │    │
│    │                                              │    │
│    │  ─────────── hoặc ──────────                │    │
│    │                                              │    │
│    │  ┌─────────────────┐ ┌─────────────────┐    │    │
│    │  │  G  Google      │ │  M  Microsoft   │    │    │
│    │  └─────────────────┘ └─────────────────┘    │    │
│    │                                              │    │
│    │     Chưa có tài khoản? Đăng ký ngay         │    │
│    └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Register Page (`/register` — Multi-step Wizard Facebook-style)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              🎓 Tạo tài khoản CampusConnect          │
│                                                      │
│    Bước 1/4: Thông tin tài khoản                     │
│    [====----------------] 25%                        │
│                                                      │
│    📧 Email trường học *                             │
│    ┌──────────────────────────────────────┐          │
│    │ bit250109@st.cmcu.edu.vn             │          │
│    └──────────────────────────────────────┘          │
│                                                      │
│    🔒 Mật khẩu *                                    │
│    ┌──────────────────────────────────────┐          │
│    │ ••••••••••                           │          │
│    └──────────────────────────────────────┘          │
│                                                      │
│    [               Tiếp tục >            ]          │
│                                                      │
│    Đã có tài khoản? Đăng nhập                       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│    Bước 2/4: Thông tin cá nhân                       │
│    [========------------] 50%                        │
│                                                      │
│    👤 Họ và tên *                                   │
│    ┌──────────────────────────────────────┐          │
│    │ Lê Dương                             │          │
│    └──────────────────────────────────────┘          │
│                                                      │
│    🎂 Ngày sinh *          ⚧️ Giới tính *            │
│    ┌──────────────────┐   ┌──────────────────┐      │
│    │ 15/08/2005       │   │ Nam ▼            │      │
│    └──────────────────┘   └──────────────────┘      │
│                                                      │
│    [ < Quay lại ]       [ Tiếp tục >     ]          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│    Bước 3/4: Thông tin học tập (Tự nhận diện)        │
│    [============--------] 75%                        │
│                                                      │
│    Hệ thống đã nhận diện thông tin từ email của bạn: │
│                                                      │
│    🆔 MSSV: BIT250109                               │
│    🏛️ Khoa: Công nghệ Thông tin                     │
│    📚 Ngành: Công nghệ Thông tin                    │
│    📅 Khóa: K4                                      │
│                                                      │
│    [Xác nhận & Tiếp tục]  [Chỉnh sửa thông tin này]  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│    Bước 4/4: Ảnh đại diện                            │
│    [====================] 100%                       │
│                                                      │
│    (Ảnh mặc định là bóng mờ xám giống Facebook)      │
│         👤                                           │
│    [   Chọn ảnh đại diện của bạn  ]                 │
│                                                      │
│    [ Bỏ qua ]           [ Hoàn tất đăng ký ]         │
└──────────────────────────────────────────────────────┘
```

> **Ghi chú Avatar:** Nếu user bấm "Bỏ qua" hoặc không chọn ảnh, trường `avatarUrl` trong database sẽ là null, frontend sẽ tự động render một ảnh avatar silhouette xám mặc định giống hệt Facebook (`/assets/images/default-avatar.png`).

#### Verify OTP Page (`/verify-email`)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              📧 Xác thực Email                       │
│                                                      │
│    Chúng tôi đã gửi mã xác thực đến                │
│    student@sv.hcmue.edu.vn                          │
│                                                      │
│    ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│    │ 1 │ │ 2 │ │ 3 │ │   │ │   │ │   │            │
│    └───┘ └───┘ └───┘ └───┘ └───┘ └───┘            │
│                                                      │
│    ⏱️ Hết hạn sau 09:45                             │
│                                                      │
│    Không nhận được mã? Gửi lại (sau 60s)            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Auth Store

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ requires2fa?: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          if (data.data.requires2fa) {
            return { requires2fa: true };
          }
          localStorage.setItem('access_token', data.data.accessToken);
          set({ user: data.data.user, isAuthenticated: true });
          return {};
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/register', formData);
        } finally {
          set({ isLoading: false });
        }
      },

      verifyEmail: async (email, otp) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/verify-email', { email, otp });
          localStorage.setItem('access_token', data.data.accessToken);
          set({ user: data.data.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch { /* ignore */ }
        localStorage.removeItem('access_token');
        set({ user: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          const { data } = await api.get('/users/me');
          set({ user: data.data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'cc-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

### Checklist Step 1.4

```
[ ] UI Components: Button (7 states theo DESIGN.md)
[ ] UI Components: Input (with validation states)
[ ] UI Components: Card, Avatar, Badge, Spinner, Toast, Modal
[ ] Login page complete with form validation
[ ] Register page complete (multi-step hoặc single page)
[ ] Verify OTP page complete (6-digit input)
[ ] Forgot password page complete
[ ] Google/Microsoft login buttons
[ ] Auth store (Zustand) working
[ ] Token auto-refresh working
[ ] Protected route middleware
[ ] Responsive design (mobile + desktop)
[ ] Loading states cho tất cả forms
[ ] Error handling với toast notifications
[ ] Keyboard navigation working (WCAG AA)
[ ] Focus indicators visible
```

---

## STEP 1.5: PROFILE MODULE (BACKEND)

> **Duration:** 5 ngày | **Assign:** Dev 2 (Backend)
> **Prerequisite:** Step 1.3

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/me` | Lấy profile bản thân |
| `PUT` | `/users/me` | Cập nhật profile |
| `PUT` | `/users/me/slug` | Đổi profile slug (custom ID) |
| `GET` | `/users/me/slug/check?slug=xxx` | Kiểm tra slug khả dụng |
| `POST` | `/users/me/avatar` | Upload avatar |
| `GET` | `/users/:slug` | Xem profile theo slug (hoặc studentId) |
| `GET` | `/users/search` | Tìm kiếm user |
| `GET/POST/PUT/DELETE` | `/users/me/skills` | CRUD kỹ năng |
| `GET/POST/PUT/DELETE` | `/users/me/achievements` | CRUD thành tích |
| `GET/POST/PUT/DELETE` | `/users/me/certificates` | CRUD chứng chỉ |
| `GET/POST/PUT/DELETE` | `/users/me/projects` | CRUD dự án |
| `GET` | `/faculties` | Danh sách khoa |
| `GET` | `/faculties/:id/majors` | Danh sách ngành theo khoa |
| `GET` | `/subjects` | Danh sách môn học |
| | | |
| **Featured Items** | | |
| `GET` | `/users/me/featured` | Lấy danh sách mục đáng chú ý |
| `POST` | `/users/me/featured` | Thêm ảnh/story/bài viết ghim (max 6) |
| `PUT` | `/users/me/featured/:id` | Cập nhật tiêu đề, thứ tự |
| `DELETE` | `/users/me/featured/:id` | Xóa mục ghim |
| `PUT` | `/users/me/featured/reorder` | Sắp xếp lại thứ tự hiển thị |
| | | |
| **Theme Song** | | |
| `GET` | `/users/me/theme-song` | Lấy bài hát cá nhân |
| `PUT` | `/users/me/theme-song` | Cài hoặc đổi nhạc nền |
| `DELETE` | `/users/me/theme-song` | Xóa nhạc nền |
| `GET` | `/music/search?q=...` | Tìm bài hát (proxy Spotify/SoundCloud API) |
| | | |
| **Availability** | | |
| `GET` | `/users/me/availability` | Lấy trạng thái rảnh |
| `PUT` | `/users/me/availability` | Cập nhật trạng thái rảnh + ghi chú + hết hạn |
| `DELETE` | `/users/me/availability` | Tắt trạng thái |
| `GET` | `/users/available` | Danh sách bạn bè đang rảnh (lọc theo status) |
| | | |
| **Interest Tags** | | |
| `GET` | `/interest-tags` | Danh sách tags phổ biến (sort by usageCount) |
| `GET` | `/interest-tags/categories` | Danh sách danh mục sở thích |
| `GET` | `/interest-tags/search?q=...` | Tìm tag |
| `POST` | `/users/me/interests` | Thêm tag sở thích (max 20) |
| `DELETE` | `/users/me/interests/:tagId` | Xóa tag |
| `GET` | `/users/me/interests` | Lấy tags của mình |
| `GET` | `/interest-tags/:slug/users` | Xem ai có chung sở thích này |

### Custom Profile Slug (ID trang cá nhân)

> **URL trang cá nhân:** `campusconnect.dev/profile/{slug}`
>
> Ví dụ:
> - Mặc định: `campusconnect.dev/profile/bit250109` (từ email `bit250109@st.cmcu.edu.vn`)
> - Custom: `campusconnect.dev/profile/leduong` (user tự đổi)

```typescript
// users.service.ts

// Tìm user theo slug HOẶC studentId
async findBySlugOrStudentId(identifier: string): Promise<User> {
  const user = await this.prisma.user.findFirst({
    where: {
      OR: [
        { profileSlug: identifier.toLowerCase() },
        { studentId: identifier.toUpperCase() },
      ],
    },
    include: {
      faculty: true,
      major: true,
      skills: true,
      achievements: true,
      certificates: true,
      projects: true,
    },
  });

  if (!user) throw new NotFoundException('Không tìm thấy người dùng');
  return user;
}

// Đổi profile slug
async updateSlug(userId: string, newSlug: string): Promise<{ slug: string }> {
  // 1. Validate format
  const slugRegex = /^[a-z0-9]([a-z0-9._-]{2,28}[a-z0-9])$/;
  if (!slugRegex.test(newSlug)) {
    throw new BadRequestException(
      'ID phải từ 4-30 ký tự, chỉ gồm chữ thường, số, dấu chấm, gạch ngang, gạch dưới'
    );
  }

  // 2. Check reserved words
  const reserved = ['admin', 'profile', 'settings', 'login', 'register',
    'api', 'chat', 'feed', 'search', 'explore', 'notifications',
    'help', 'about', 'terms', 'privacy', 'campusconnect'];
  if (reserved.includes(newSlug)) {
    throw new BadRequestException('ID này không khả dụng');
  }

  // 3. Check uniqueness
  const existing = await this.prisma.user.findUnique({
    where: { profileSlug: newSlug },
  });
  if (existing && existing.id !== userId) {
    throw new ConflictException('ID này đã được sử dụng');
  }

  // 4. Update
  await this.prisma.user.update({
    where: { id: userId },
    data: { profileSlug: newSlug },
  });

  return { slug: newSlug };
}

// Kiểm tra slug khả dụng
async checkSlugAvailability(slug: string, userId: string): Promise<{ available: boolean }> {
  const existing = await this.prisma.user.findUnique({
    where: { profileSlug: slug.toLowerCase() },
  });
  return { available: !existing || existing.id === userId };
}
```

#### Quy tắc Profile Slug

| Quy tắc | Chi tiết |
|---------|----------|
| **Mặc định** | Tự động lấy từ email: `bit250109@st.cmcu.edu.vn` → `bit250109` |
| **Custom** | User có thể đổi thành bất kỳ slug nào khả dụng, VD: `leduong`, `duong.le` |
| **Độ dài** | 4-30 ký tự |
| **Ký tự cho phép** | `a-z`, `0-9`, `.`, `-`, `_` (không viết hoa, không khoảng trắng) |
| **Bắt đầu/kết thúc** | Phải bắt đầu và kết thúc bằng chữ hoặc số |
| **Reserved** | Không được dùng: `admin`, `profile`, `settings`, `login`, `chat`... |
| **Unique** | Mỗi slug chỉ thuộc 1 user |
| **Tìm kiếm** | `GET /users/:slug` tự động tìm theo cả `profileSlug` và `studentId` |

### Module Structure

```
backend/src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/
│   ├── update-profile.dto.ts
│   ├── create-skill.dto.ts
│   ├── update-skill.dto.ts
│   ├── create-achievement.dto.ts
│   ├── create-certificate.dto.ts
│   ├── create-project.dto.ts
│   ├── create-featured-item.dto.ts
│   ├── update-theme-song.dto.ts
│   ├── update-availability.dto.ts
│   ├── manage-interest-tags.dto.ts
│   └── search-user.dto.ts
├── featured-items.controller.ts
├── featured-items.service.ts
├── theme-song.controller.ts
├── theme-song.service.ts
├── availability.controller.ts
├── availability.service.ts
├── interest-tags.controller.ts
├── interest-tags.service.ts
└── users.service.spec.ts
```

### Profile Completion Score Logic

```typescript
// Tính % hoàn thành profile
function calculateProfileCompletion(user: UserWithRelations): number {
  let score = 0;
  if (user.avatarUrl) score += 10;
  if (user.fullName) score += 10;
  if (user.studentId) score += 10;
  if (user.facultyId) score += 5;
  if (user.majorId) score += 5;
  if (user.academicYear) score += 5;
  if (user.phone) score += 5;
  if (user.skills?.length > 0) score += 10;
  if (user.achievements?.length > 0) score += 5;
  if (user.certificates?.length > 0) score += 5;
  if (user.projects?.length > 0) score += 5;
  if (user.featuredItems?.length > 0) score += 5;  // Mục đáng chú ý
  if (user.themeSong) score += 5;                   // Nhạc cá nhân
  if (user.availability?.status !== 'NONE') score += 5; // Khung giờ rảnh
  if (user.interestTags?.length >= 3) score += 10;  // Sở thích (≥ 3 tags)
  return score; // 0-100
}
```

### Checklist Step 1.5

```
[ ] Users module created
[ ] GET /users/me returns full profile with relations
[ ] PUT /users/me updates profile
[ ] POST /users/me/avatar uploads via StorageService (dev: local disk, prod: MinIO/S3)
[ ] GET /users/:id returns public profile
[ ] GET /users/search with name/faculty/major filters
[ ] Skills CRUD (unique per user+skill_name)
[ ] Achievements CRUD
[ ] Certificates CRUD
[ ] Projects CRUD
[ ] GET /faculties returns list
[ ] GET /faculties/:id/majors returns filtered majors
[ ] GET /subjects returns list with pagination
[ ] Profile completion score calculated
[ ] File upload validation (type + size)
[ ] Featured Items CRUD (max 6, reorder)
[ ] Theme Song CRUD + Music search proxy API
[ ] Availability CRUD + auto-expire (BullMQ scheduled job)
[ ] Interest Tags: CRUD, search, category list, users-by-tag
[ ] Privacy settings CRUD (GET/PUT /users/me/privacy)
[ ] Unit tests ≥ 80% coverage
```

---

## STEP 1.6: PROFILE FRONTEND

> **Duration:** 5 ngày | **Assign:** Dev 3 + Dev 4
> **Prerequisite:** Step 1.5

### Pages

#### Profile Page (`/profile/:slug` — VD: `/profile/bit250109` hoặc `/profile/leduong`)

```
┌──────────────────────────────────────────────────────────────────┐
│ Header  [logo] CampusConnect  [search]      [bell] [msg] [ava]│
├────────┬────────────────────────────────────────┬───────────────┤
│Sidebar │                                        │               │
│        │  ┌────────────────────────────────────┐  │  Right Panel  │
│        │  │  Cover Photo Area                    │  │               │
│        │  │  ┌─────┐                               │  │  Profile      │
│        │  │  │ AVT │  Nguyễn Văn A [check]       │  │  Completion   │
│        │  │  └─────┘  K4 - CNTT - CNPM          │  │  [████░░] 75%  │
│        │  │           [map-pin] ĐH CMC            │  │               │
│        │  │  [star] 150 RP │ 45 bạn │ 23 bài    │  │  Gợi ý:      │
│        │  │  [user-pen] Sửa hồ sơ | [shield]    │  │  • Thêm sở   │
│        │  └────────────────────────────────────┘  │    thích      │
│        │                                        │  • Upload     │
│        │  [♪] "Ngày Mà Em Cò Yêu Anh" - Sơn Tùng │    nhạc nền   │
│        │  [play] ────●────── 1:23 / 3:45       │               │
│        │                                        │  • Thêm khung │
│        │  [coffee] Đang rảnh • "Ai cafe chiều nay?" │    giờ rảnh   │
│        │  [clock] Sáng T2 T4 rảnh              │               │
│        │                                        │  [users]     │
│        │  ┌─ Đáng chú ý (Được ghim) ─────────┐  │  Bạn có     │
│        │  │ [ảnh1]  [ảnh2]  [story]  [ảnh4] │  │  chung sở   │
│        │  │ Hội trại Team    Kỷ niệm  ...   │  │  thích       │
│        │  │ 2024    Build   cùng bạn       │  │  #BoardGame │
│        │  └───────────────────────────────┘  │  #ChupAnh   │
│        │                                        │               │
│        │  Sở thích:                               │               │
│        │  [tag] #GenshinImpact  [tag] #BoardGame │               │
│        │  [tag] #Photography   [tag] #CodeDạo   │               │
│        │  [tag] #Ca phe        [tag] #K-Pop      │               │
│        │                                        │               │
│        │  [Bài viết] [Kỹ năng] [Thành tích]       │               │
│        │  [Chứng chỉ] [Dự án]                   │               │
│        │                                        │               │
│        │  ┌────────────────────────────────────┐  │               │
│        │  │  Tab Content Area                    │  │               │
│        │  │  (Posts / Skills / Achievements ...)  │  │               │
│        │  └────────────────────────────────────┘  │               │
│        │                                        │               │
└────────┴────────────────────────────────────────┴───────────────┘
```

### Components mới cho Profile

```
components/profile/
├── FeaturedItems.tsx         # Grid 6 ô ghim: ảnh, story highlight, bài viết
├── FeaturedItemCard.tsx      # 1 ô ghim (thumbnail + title + overlay edit)
├── FeaturedItemEditor.tsx    # Dialog chọn loại + upload ảnh + đặt tên
├── ThemeSongPlayer.tsx       # Mini player: album art + marquee title + play/pause
├── ThemeSongPicker.tsx       # Dialog tìm nhạc (Spotify/SoundCloud search)
├── AvailabilityBadge.tsx     # Badge trên profile: [coffee] Đang rảnh + custom text
├── AvailabilityEditor.tsx    # Form: chọn status, nhập text, ghi chú TKB, set hết hạn
├── InterestTagCloud.tsx      # Hiển thị tag sở thích dạng cloud/grid (clickable)
├── InterestTagPicker.tsx     # Dialog chọn/tìm tags theo category (max 20)
├── InterestTagUsersDialog.tsx # Dialog "Ai cũng thích #BoardGame?" — danh sách user
├── ProfileLockBadge.tsx      # Icon khiên (shield) + tooltip "Trang cá nhân được bảo vệ"
└── PrivacySettingsDialog.tsx  # Modal cài đặt quyền riêng tư toàn bộ
```

### Checklist Step 1.6

```
[ ] Profile page complete (wireframe mới với 4 tính năng bổ sung)
[ ] Profile edit page/modal complete
[ ] Avatar upload with preview
[ ] Skills section (add/edit/delete + level badges)
[ ] Achievements section
[ ] Certificates section
[ ] Projects section (with tech stack tags)
[ ] Profile completion indicator (cập nhật scoring mới)
[ ] Public profile view (for other users)
[ ] Featured Items: grid 6 ô, drag-to-reorder, chọn ảnh/story/post
[ ] Theme Song: mini player (play/pause, marquee), picker (search Spotify/SoundCloud)
[ ] Availability Badge: chọn status, custom text, ghi chú TKB, auto-expire
[ ] Interest Tags: tag cloud, picker với categories, click → xem users cùng tag
[ ] Profile Lock Badge: icon shield + giao diện khóa cho người lạ
[ ] Privacy Settings Dialog: tắt chấm xanh, tắt seen, bảo vệ trang cá nhân, ai nhắn tin
[ ] Responsive design
[ ] Skeleton loading states
[ ] Empty states for each section
```

---

## STEP 1.7: INTEGRATION & TESTING

> **Duration:** 3 ngày | **Assign:** Toàn team
> **Prerequisite:** Step 1.4 + Step 1.6

### Mục tiêu
- Full integration test E2E
- Fix bugs
- Performance check
- Prepare cho Phase 2

### Tasks

```
[ ] Full register → verify → login flow works E2E
[ ] Profile CRUD works from frontend
[ ] Avatar upload works
[ ] JWT refresh works seamlessly
[ ] 2FA flow works
[ ] Google/Microsoft OAuth works
[ ] Responsive check: mobile, tablet, desktop
[ ] Performance: API response < 200ms
[ ] Lighthouse score > 85 (Performance, Accessibility)
[ ] All unit tests passing
[ ] Docker Compose production build works
[ ] Deploy test trên VPS (smoke test)
[ ] Code review toàn bộ Phase 1
[ ] Documentation updated
```

---

## DEPENDENCIES GIỮA CÁC STEP

```
Step 1.1 (Project Setup)
    ├──→ Step 1.2 (Database)
    │        ├──→ Step 1.3 (Auth Backend)
    │        │        ├──→ Step 1.4 (Auth Frontend) ──→ Step 1.7
    │        │        └──→ Step 1.5 (Profile Backend)
    │        │                 └──→ Step 1.6 (Profile Frontend) ──→ Step 1.7
    │        └──→ (Frontend có thể bắt đầu UI song song)
    └──→ Step 1.4 (UI components có thể làm song song)
```

### Parallel Work

| Dev | Tuần 1-2 | Tuần 3-4 | Tuần 5-6 |
|-----|----------|----------|----------|
| Dev 1 | 1.1 + 1.2 | 1.3 (Auth BE) | Code review + 1.7 |
| Dev 2 | 1.1 (hỗ trợ) | 1.3 (Auth BE) | 1.5 (Profile BE) |
| Dev 3 | 1.1 (FE setup) | UI components | 1.4 (Auth FE) |
| Dev 4 | — | UI components | 1.6 (Profile FE) |
| Dev 5 | 1.1 (Docker/CI) | 1.4 (Auth FE) | 1.7 (Integration) |

---

> **Output Phase 1:** Hệ thống có thể đăng ký, đăng nhập, quản lý profile. Sẵn sàng cho Phase 2 (Social Network).
>
> **Tiếp theo:** [02-PHASE-2-SOCIAL.md](./02-PHASE-2-SOCIAL.md)
