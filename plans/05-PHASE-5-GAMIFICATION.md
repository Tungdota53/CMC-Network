# PHASE 5: GAMIFICATION & ADMIN
## Reputation System + Badge System + Admin Dashboard + Global Search

> **Duration:** Tuần 23-25 (21 ngày)
> **Prerequisite:** Phase 4 hoàn thành
> **Goal:** Gamification, quản trị hệ thống, tìm kiếm toàn bộ nền tảng
> **UI Rule:** Tất cả icon dùng inline SVG (Lucide) — KHÔNG dùng emoji.

---

## MỤC LỤC

- [Step 5.1: Reputation & Badge System](#step-51-reputation--badge-system)
- [Step 5.2: Admin Dashboard Backend](#step-52-admin-dashboard-backend)
- [Step 5.3: Admin Dashboard Frontend](#step-53-admin-dashboard-frontend)
- [Step 5.4: Global Search (PostgreSQL FTS)](#step-54-global-search-postgresql-full-text-search)
- [Step 5.5: Integration & Testing](#step-55-integration--testing)

---

## STEP 5.1: REPUTATION & BADGE SYSTEM

> **Duration:** 5 ngày | **Assign:** Dev 2 (BE) + Dev 4 (FE)
> **Prerequisite:** Phase 4

### Prisma Schema (thêm)

> **⚠️ User model additions (BẮT BUỘC để Prisma compile).**
> Phase 5 thêm Badge + Reputation, đính các relation ngược sau vào `model User` (định nghĩa ở Phase 1).
>
> ```prisma
> model User {
>   // ... field & relation từ Phase 1-4 ...
>
>   // --- Reputation & Badges (5.1) ---
>   badges         UserBadge[]
>   reputationLogs ReputationLog[]
> }
> ```
>
> *Ghi chú:* `User.reputationScore` (Int, default 0) và `User.isVerified` (Boolean, tích xanh)
> đã có sẵn trong Phase 1 — Phase 5 chỉ cập nhật giá trị, không cần thêm field.

```prisma
enum BadgeCategory {
  MENTOR
  SKILL
  CONTRIBUTION
  SPECIAL
}

enum ReputationAction {
  SHARE_MATERIAL
  MATERIAL_RATED_5
  HELP_ANSWER
  MENTOR_SESSION
  MENTOR_RATED_5
  EVENT_ORGANIZE
  GOOD_REVIEW
  REPORT_ACCEPTED
  POST_LIKED
  SPAM_PENALTY
  VIOLATION_PENALTY
}

model Badge {
  id             String        @id @default(uuid())
  name           String        @unique
  description    String?
  iconName       String?       @map("icon_name")     // Lucide icon name (mặc định, render bằng <Icon name=... />)
  iconUrl        String?       @map("icon_url")      // Optional: custom uploaded icon image
  category       BadgeCategory
  requiredPoints Int           @default(0) @map("required_points")
  criteria       Json          @default("{}") // Custom criteria for badge
  createdAt      DateTime      @default(now()) @map("created_at")

  users UserBadge[]

  @@map("badges")
}

model UserBadge {
  id       String   @id @default(uuid())
  userId   String   @map("user_id")
  badgeId  String   @map("badge_id")
  earnedAt DateTime @default(now()) @map("earned_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge Badge @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@map("user_badges")
}

model ReputationLog {
  id            String           @id @default(uuid())
  userId        String           @map("user_id")
  points        Int
  action        ReputationAction
  description   String?
  referenceId   String?          @map("reference_id")
  referenceType String?          @map("reference_type")
  createdAt     DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@map("reputation_logs")
}
```

### Reputation Points Configuration

```typescript
const REPUTATION_CONFIG = {
  // Positive actions
  SHARE_MATERIAL:     { points: +10, dailyLimit: 5,   description: 'Upload tài liệu' },
  MATERIAL_RATED_5:   { points: +20, dailyLimit: null, description: 'Tài liệu được đánh giá 5⭐' },
  HELP_ANSWER:        { points: +5,  dailyLimit: 10,  description: 'Bình luận hữu ích' },
  MENTOR_SESSION:     { points: +30, dailyLimit: null, description: 'Hoàn thành mentor session' },
  MENTOR_RATED_5:     { points: +25, dailyLimit: null, description: 'Được đánh giá mentor 5⭐' },
  EVENT_ORGANIZE:     { points: +15, dailyLimit: 2,   description: 'Tổ chức sự kiện' },
  GOOD_REVIEW:        { points: +5,  dailyLimit: 5,   description: 'Đánh giá hữu ích' },
  REPORT_ACCEPTED:    { points: +10, dailyLimit: null, description: 'Báo cáo vi phạm được duyệt' },
  POST_LIKED:         { points: +1,  dailyLimit: 50,  description: 'Bài viết được thích' },

  // Negative actions
  SPAM_PENALTY:       { points: -50,  description: 'Spam' },
  VIOLATION_PENALTY:  { points: -20,  description: 'Vi phạm quy tắc cộng đồng' },
};
```

### Badge Definitions (Seed Data)

> Theo Icon Mapping Table (Master Plan §4), badge icon dùng Lucide SVG — KHÔNG ký tự emoji.
> Field `iconName` lưu tên icon Lucide; frontend render bằng `<Icon name={badge.iconName} />`.

```typescript
const BADGES = [
  // Mentor badges
  { name: 'Mentor Mới', category: 'MENTOR', criteria: { totalSessions: 5 }, iconName: 'sprout' },
  { name: 'Mentor Xuất sắc', category: 'MENTOR', criteria: { totalSessions: 50, avgRating: 4.5 }, iconName: 'medal' },
  { name: 'Mentor Huyền thoại', category: 'MENTOR', criteria: { totalSessions: 200, avgRating: 4.8 }, iconName: 'crown' },

  // Skill badges
  { name: 'Chuyên gia Java', category: 'SKILL', criteria: { materialsInTag: 'java', count: 20, reputation: 100 }, iconName: 'coffee' },
  { name: 'Chuyên gia AI', category: 'SKILL', criteria: { materialsInTag: 'ai', count: 20, reputation: 100 }, iconName: 'bot' },
  { name: 'Chuyên gia Web', category: 'SKILL', criteria: { materialsInTag: 'web', count: 20, reputation: 100 }, iconName: 'globe' },

  // Contribution badges
  { name: 'Người chia sẻ', category: 'CONTRIBUTION', criteria: { materialsUploaded: 10 }, iconName: 'book-open' },
  { name: 'Người chia sẻ tích cực', category: 'CONTRIBUTION', criteria: { materialsUploaded: 50 }, iconName: 'library' },
  { name: 'Top Contributor', category: 'CONTRIBUTION', criteria: { topMonthly: true }, iconName: 'star' },
  { name: 'Người hỗ trợ', category: 'CONTRIBUTION', criteria: { helpfulComments: 100 }, iconName: 'target' },

  // Special badges
  { name: 'Sinh viên Gương mẫu', category: 'SPECIAL', criteria: { reputationScore: 500 }, iconName: 'graduation-cap' },
  { name: 'Early Adopter', category: 'SPECIAL', criteria: { joinedBefore: '2026-09-01' }, iconName: 'rocket' },
];
```

### Badge Check Service (Event-driven)

```typescript
// Chạy sau mỗi reputation change event
@Injectable()
export class BadgeCheckService {
  async checkAndAwardBadges(userId: string) {
    const user = await this.getFullUserProfile(userId);
    const existingBadges = await this.getUserBadgeIds(userId);
    const allBadges = await this.getAllBadges();

    for (const badge of allBadges) {
      if (existingBadges.includes(badge.id)) continue;

      const earned = this.evaluateCriteria(user, badge.criteria);
      if (earned) {
        await this.awardBadge(userId, badge.id);
        await this.sendNotification(userId, `🏆 Bạn đã nhận huy hiệu "${badge.name}"!`);
      }
    }
  }
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reputation/me` | Điểm uy tín của tôi |
| `GET` | `/reputation/me/history` | Lịch sử điểm (paginated) |
| `GET` | `/reputation/leaderboard` | Bảng xếp hạng (weekly/monthly/all-time) |
| `GET` | `/badges` | Tất cả huy hiệu |
| `GET` | `/badges/my` | Huy hiệu của tôi |
| `GET` | `/users/:id/badges` | Huy hiệu của user |

### Frontend Components

```
components/reputation/
├── ReputationScore.tsx       # Hiển thị điểm (animated counter)
├── ReputationHistory.tsx     # Lịch sử +/- điểm
├── Leaderboard.tsx           # Bảng xếp hạng
├── BadgeGrid.tsx             # Grid huy hiệu
├── BadgeCard.tsx             # Single badge (locked/unlocked)
├── BadgeProgress.tsx         # Progress bar to next badge
└── ProfileBadges.tsx         # Badge section on profile
```

### Checklist Step 5.1

```
[ ] ReputationLog model + service
[ ] Auto-award points on actions (event-driven)
[ ] Daily limit enforcement
[ ] Badge model + seed data
[ ] Badge check service (auto-award)
[ ] Leaderboard (weekly/monthly/all-time)
[ ] REST API for reputation + badges
[ ] Frontend: reputation score on profile
[ ] Frontend: reputation history page
[ ] Frontend: leaderboard page
[ ] Frontend: badge grid (locked/unlocked visual)
[ ] Frontend: badge progress indicators
[ ] Notification on badge earned
[ ] Unit tests
```

---

## STEP 5.2: ADMIN DASHBOARD BACKEND

> **Duration:** 5 ngày | **Assign:** Dev 1
> **Prerequisite:** Phase 4

### API Endpoints (Admin only — RBAC guard)

#### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard/stats` | Tổng hợp số liệu |
| `GET` | `/admin/dashboard/charts/dau` | DAU (7/30/90 ngày) |
| `GET` | `/admin/dashboard/charts/mau` | MAU (12 tháng) |
| `GET` | `/admin/dashboard/charts/growth` | User growth |
| `GET` | `/admin/dashboard/charts/retention` | Retention rate |
| `GET` | `/admin/dashboard/charts/posts` | Posts per day |
| `GET` | `/admin/dashboard/charts/faculties` | Distribution by faculty |

#### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/users` | Danh sách (search, filter, paginate) |
| `GET` | `/admin/users/:id` | Chi tiết user |
| `PATCH` | `/admin/users/:id/status` | Ban/unban |
| `PATCH` | `/admin/users/:id/role` | Đổi role (STUDENT/MODERATOR/ADMIN) |
| `PATCH` | `/admin/users/:id/verify` | Cấp/gỡ tích xanh |
| `GET` | `/admin/users/verified` | Danh sách tài khoản có tích xanh |

#### Content Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/posts` | Tất cả bài viết |
| `DELETE` | `/admin/posts/:id` | Xóa bài viết |
| `GET` | `/admin/materials` | Tài liệu chờ duyệt |
| `PATCH` | `/admin/materials/:id/status` | Approve/reject |
| `GET` | `/admin/products` | Sản phẩm marketplace |
| `DELETE` | `/admin/products/:id` | Xóa sản phẩm |
| `GET` | `/admin/events` | Sự kiện |
| `DELETE` | `/admin/events/:id` | Xóa sự kiện |

#### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/reports` | Danh sách báo cáo |
| `GET` | `/admin/reports/:id` | Chi tiết |
| `PATCH` | `/admin/reports/:id` | Xử lý (resolve/dismiss) |

#### Email Domain Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/email-domains` | Danh sách trường |
| `POST` | `/admin/email-domains` | Thêm trường |
| `PUT` | `/admin/email-domains/:id` | Sửa |
| `PATCH` | `/admin/email-domains/:id/toggle` | Bật/tắt |
| `DELETE` | `/admin/email-domains/:id` | Xóa |

### Stats Aggregation Queries

```typescript
async getDashboardStats() {
  const [
    totalUsers, activeToday, newThisWeek, totalPosts,
    totalMaterials, totalEvents, totalProducts, pendingReports
  ] = await Promise.all([
    this.prisma.user.count({ where: { status: 'ACTIVE' } }),
    this.prisma.user.count({ where: { lastActiveAt: { gte: startOfToday() } } }),
    this.prisma.user.count({ where: { createdAt: { gte: startOfWeek() } } }),
    this.prisma.post.count(),
    this.prisma.material.count(),
    this.prisma.event.count(),
    this.prisma.product.count(),
    this.prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  return { totalUsers, activeToday, newThisWeek, totalPosts,
           totalMaterials, totalEvents, totalProducts, pendingReports };
}

async getDAU(days: number = 30) {
  // Daily Active Users for last N days
  return this.prisma.$queryRaw`
    SELECT
      DATE(last_active_at) as date,
      COUNT(DISTINCT id) as count
    FROM users
    WHERE last_active_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(last_active_at)
    ORDER BY date
  `;
}

async getUserGrowth(months: number = 12) {
  return this.prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as count,
      SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative
    FROM users
    WHERE created_at >= NOW() - INTERVAL '${months} months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `;
}
```

### Checklist Step 5.2

```
[ ] Admin module with RBAC guard (ADMIN role only)
[ ] Dashboard stats endpoint
[ ] DAU/MAU charts data
[ ] User growth chart data
[ ] Faculty distribution chart data
[ ] User management (list, search, ban, role change)
[ ] Verified badge management (cấp/gỡ tích xanh)
[ ] Content moderation (posts, materials, products)
[ ] Material approval workflow
[ ] Report management (list, resolve, dismiss)
[ ] Email domain management
[ ] Pagination for all list endpoints
[ ] Unit tests
```

---

## STEP 5.3: ADMIN DASHBOARD FRONTEND

> **Duration:** 7 ngày | **Assign:** Dev 3 + Dev 4
> **Prerequisite:** Step 5.2

### Pages

```
/admin/
├── dashboard/          # Stats + charts
├── users/              # User management table
├── posts/              # Posts moderation
├── materials/          # Material approval
├── events/             # Events management
├── products/           # Products moderation
├── reports/            # Report handling
├── email-domains/      # School domain management
└── settings/           # System settings
```

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│  Admin  │  🏠 Dashboard                            👤 Admin│
├─────────┼──────────────────────────────────────────────────┤
│         │                                                  │
│ 🏠 Dash │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│ 👥 Users│  │ 8,500│ │3,200 │ │  150 │ │  12  │           │
│ 📝 Posts│  │Users │ │Active│ │ New  │ │Report│           │
│ 📄 Docs │  │ +5%↑ │ │Today │ │/Week │ │Pndng │           │
│ 🎪 Event│  └──────┘ └──────┘ └──────┘ └──────┘           │
│ 🛒 Prods│                                                  │
│ 🚨 Rpts │  ┌──────────────────────┐ ┌───────────────────┐ │
│ 🏫 Schls│  │  DAU/MAU Chart       │ │ User Growth      │ │
│ ⚙️ Setng│  │  📈 Line chart       │ │ 📊 Bar chart     │ │
│         │  │  (30 days)           │ │ (12 months)      │ │
│         │  └──────────────────────┘ └───────────────────┘ │
│         │                                                  │
│         │  ┌──────────────────────┐ ┌───────────────────┐ │
│         │  │ Faculty Distribution │ │ Recent Reports    │ │
│         │  │ 🥧 Pie chart         │ │ 📋 Table          │ │
│         │  └──────────────────────┘ └───────────────────┘ │
│         │                                                  │
└─────────┴──────────────────────────────────────────────────┘
```

### Charts Library

Sử dụng **Recharts** (React) hoặc **Chart.js** cho:
- **Line chart:** DAU/MAU trends
- **Bar chart:** User growth, posts per day
- **Pie chart:** Faculty distribution, post types
- **Area chart:** Retention rate

### Components

```
components/admin/
├── StatsCard.tsx              # Stat card with icon + trend
├── DataTable.tsx              # Generic sortable/filterable table
├── ChartWidget.tsx            # Wrapper for chart components
├── AdminSidebar.tsx           # Admin navigation
├── UserManageRow.tsx          # User row with actions
├── MaterialApprovalCard.tsx   # Approve/reject material
├── ReportCard.tsx             # Report detail + resolve
├── DomainManagement.tsx       # Email domain CRUD
├── StatusBadge.tsx            # Color-coded status badge
└── ConfirmDialog.tsx          # Confirmation for dangerous actions
```

### Checklist Step 5.3

```
[ ] Admin layout (sidebar + content area)
[ ] Dashboard page with stat cards
[ ] DAU/MAU line chart
[ ] User growth bar chart
[ ] Faculty distribution pie chart
[ ] User management table (search, filter, pagination)
[ ] Ban/unban user (with confirm dialog)
[ ] Change user role
[ ] Verified badge: toggle tích xanh (with confirm dialog)
[ ] Posts moderation table
[ ] Material approval (approve/reject)
[ ] Product moderation
[ ] Report handling (resolve/dismiss with notes)
[ ] Email domain management (CRUD)
[ ] Export data functionality
[ ] ADMIN role gate (redirect non-admin)
[ ] Responsive (though admin mainly desktop)
```

---

## STEP 5.4: GLOBAL SEARCH (POSTGRESQL FULL-TEXT SEARCH)

> **Duration:** 5 ngày | **Assign:** Dev 1
> **Prerequisite:** Phase 4

> ⚠️ **Đã thay đổi:** Bỏ Elasticsearch, dùng PostgreSQL Full-Text Search (tsvector/tsquery + pg_trgm).
> Lý do: Tiết kiệm 2-4GB RAM, không cần thêm service, đủ mạnh cho 10K users.
> Nếu sau này vượt 50K users, có thể chuyển sang Elasticsearch mà không cần sửa API.

### Setup: PostgreSQL Extensions

```sql
-- Chạy trong migration
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- Fuzzy search (similarity)
CREATE EXTENSION IF NOT EXISTS unaccent;     -- Bỏ dấu tiếng Việt khi search

-- Custom Vietnamese text search config
CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION vietnamese
  ALTER MAPPING FOR word WITH unaccent, simple;
```

### Prisma Schema (thêm search columns)

```prisma
// Thêm tsvector columns vào các model cần search
// Sử dụng Prisma $executeRaw để tạo vì Prisma chưa hỗ trợ tsvector native

// Migration SQL:
// ALTER TABLE users ADD COLUMN search_vector tsvector;
// ALTER TABLE posts ADD COLUMN search_vector tsvector;
// ALTER TABLE materials ADD COLUMN search_vector tsvector;
// ALTER TABLE products ADD COLUMN search_vector tsvector;
// ALTER TABLE events ADD COLUMN search_vector tsvector;

// GIN indexes:
// CREATE INDEX idx_users_search ON users USING GIN(search_vector);
// CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
// CREATE INDEX idx_materials_search ON materials USING GIN(search_vector);
// CREATE INDEX idx_products_search ON products USING GIN(search_vector);
// CREATE INDEX idx_events_search ON events USING GIN(search_vector);

// Trigram indexes (for fuzzy/LIKE search):
// CREATE INDEX idx_users_name_trgm ON users USING GIN(full_name gin_trgm_ops);
// CREATE INDEX idx_materials_title_trgm ON materials USING GIN(title gin_trgm_ops);
// CREATE INDEX idx_products_title_trgm ON products USING GIN(title gin_trgm_ops);
```

### Search Service

```typescript
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // === UPDATE SEARCH VECTORS (gọi sau mỗi create/update) ===

  async updateUserSearchVector(userId: string) {
    await this.prisma.$executeRaw`
      UPDATE users SET search_vector =
        setweight(to_tsvector('vietnamese', coalesce(full_name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(student_id, '')), 'A') ||
        setweight(to_tsvector('vietnamese', coalesce(email, '')), 'B')
      WHERE id = ${userId}::uuid
    `;
  }

  async updatePostSearchVector(postId: string) {
    await this.prisma.$executeRaw`
      UPDATE posts SET search_vector =
        to_tsvector('vietnamese', coalesce(content, ''))
      WHERE id = ${postId}::uuid
    `;
  }

  async updateMaterialSearchVector(materialId: string) {
    await this.prisma.$executeRaw`
      UPDATE materials SET search_vector =
        setweight(to_tsvector('vietnamese', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('vietnamese', coalesce(description, '')), 'B')
      WHERE id = ${materialId}::uuid
    `;
  }

  // === GLOBAL SEARCH ===

  async globalSearch(query: string, type?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const tsQuery = query.split(' ').filter(Boolean).join(' & ');

    const results: Record<string, any> = {};

    if (!type || type === 'all' || type === 'users') {
      results.users = await this.searchUsers(tsQuery, query, limit, offset);
    }
    if (!type || type === 'all' || type === 'posts') {
      results.posts = await this.searchPosts(tsQuery, query, limit, offset);
    }
    if (!type || type === 'all' || type === 'materials') {
      results.materials = await this.searchMaterials(tsQuery, query, limit, offset);
    }
    if (!type || type === 'all' || type === 'products') {
      results.products = await this.searchProducts(tsQuery, query, limit, offset);
    }
    if (!type || type === 'all' || type === 'events') {
      results.events = await this.searchEvents(tsQuery, query, limit, offset);
    }

    return results;
  }

  private async searchUsers(tsQuery: string, rawQuery: string, limit: number, offset: number) {
    return this.prisma.$queryRaw`
      SELECT id, full_name, avatar_url, student_id, academic_year,
        ts_rank(search_vector, to_tsquery('vietnamese', ${tsQuery})) AS rank,
        similarity(full_name, ${rawQuery}) AS sim
      FROM users
      WHERE status = 'ACTIVE'
        AND (
          search_vector @@ to_tsquery('vietnamese', ${tsQuery})
          OR full_name % ${rawQuery}  -- trigram similarity
          OR student_id ILIKE ${rawQuery + '%'}
        )
      ORDER BY rank DESC, sim DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  private async searchPosts(tsQuery: string, rawQuery: string, limit: number, offset: number) {
    return this.prisma.$queryRaw`
      SELECT p.id, LEFT(p.content, 200) as content, p.created_at,
        u.full_name as author_name, u.avatar_url,
        ts_rank(p.search_vector, to_tsquery('vietnamese', ${tsQuery})) AS rank
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.visibility = 'PUBLIC'
        AND p.search_vector @@ to_tsquery('vietnamese', ${tsQuery})
      ORDER BY rank DESC, p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  // ... tương tự cho materials, products, events
}
```

### Prisma Middleware (auto-sync search vectors)

```typescript
// Tự động cập nhật search_vector khi data thay đổi
// Thay vì sync sang Elasticsearch, chỉ update column trong cùng DB

prisma.$use(async (params, next) => {
  const result = await next(params);

  if (['create', 'update'].includes(params.action)) {
    switch (params.model) {
      case 'User':
        await searchService.updateUserSearchVector(result.id);
        break;
      case 'Post':
        await searchService.updatePostSearchVector(result.id);
        break;
      case 'Material':
        await searchService.updateMaterialSearchVector(result.id);
        break;
      case 'Product':
        await searchService.updateProductSearchVector(result.id);
        break;
      case 'Event':
        await searchService.updateEventSearchVector(result.id);
        break;
    }
  }

  return result;
});
```

### Initial Data Migration Script

```typescript
// scripts/rebuild-search-vectors.ts
// Chạy 1 lần để tạo search vectors cho data có sẵn

async function rebuildAllSearchVectors() {
  // Users
  await prisma.$executeRaw`
    UPDATE users SET search_vector =
      setweight(to_tsvector('vietnamese', coalesce(full_name, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(student_id, '')), 'A') ||
      setweight(to_tsvector('vietnamese', coalesce(email, '')), 'B')
  `;

  // Posts
  await prisma.$executeRaw`
    UPDATE posts SET search_vector =
      to_tsvector('vietnamese', coalesce(content, ''))
  `;

  // Materials
  await prisma.$executeRaw`
    UPDATE materials SET search_vector =
      setweight(to_tsvector('vietnamese', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('vietnamese', coalesce(description, '')), 'B')
  `;

  // Products, Events tương tự...
  console.log('✅ Search vectors rebuilt');
}
```

### Global Search API

```
GET /search?q=java&type=all&page=1&limit=20
GET /search?q=java&type=users
GET /search?q=java&type=posts
GET /search?q=java&type=materials
GET /search?q=java&type=products
GET /search?q=java&type=events
GET /search/suggest?q=jav    → Autocomplete (trigram)
```

### Response

```json
{
  "success": true,
  "data": {
    "users": { "items": [...], "total": 15 },
    "posts": { "items": [...], "total": 42 },
    "materials": { "items": [...], "total": 8 },
    "products": { "items": [...], "total": 3 },
    "events": { "items": [...], "total": 2 }
  },
  "meta": { "query": "java", "totalResults": 70, "took": 45 }
}
```

### Frontend: Search Page

```
┌────────────────────────────────────────────────────┐
│ 🔍 java                                    [Tìm]  │
├────────────────────────────────────────────────────┤
│ 70 kết quả (0.045s)                               │
│                                                    │
│ [Tất cả] [Người(15)] [Bài viết(42)] [Tài liệu(8)]│
│ [Sản phẩm(3)] [Sự kiện(2)]                        │
│                                                    │
│ ── Người dùng ──                                   │
│ 👤 Nguyễn Văn A · K65 CNTT · Java Expert          │
│ 👤 Trần Thị B · K66 CNPM · Java, Spring           │
│ Xem thêm 13 kết quả →                             │
│                                                    │
│ ── Bài viết ──                                     │
│ 📝 "Chia sẻ kinh nghiệm học Java từ zero..."      │
│ 📝 "Tuyển thành viên nhóm đồ án Java..."          │
│ Xem thêm 40 kết quả →                             │
│                                                    │
│ ── Tài liệu ──                                    │
│ 📄 Giáo trình Java OOP · ⭐4.8 · 234 downloads    │
│ Xem thêm 6 kết quả →                              │
└────────────────────────────────────────────────────┘
```

### So sánh: PostgreSQL FTS vs Elasticsearch

| Tiêu chí | PostgreSQL FTS | Elasticsearch |
|----------|---------------|---------------|
| RAM cần thêm | 0 (dùng DB có sẵn) | 2-4GB |
| Service mới | Không | Có (thêm container) |
| Vietnamese support | `unaccent` extension | ICU plugin |
| Fuzzy search | `pg_trgm` (similarity) | Built-in |
| Full-text ranking | `ts_rank` + weights | BM25 algorithm |
| Autocomplete | trigram similarity | Completion suggester |
| Phù hợp cho | < 50K documents | > 100K documents |
| Data sync | Không cần (cùng DB) | Cần sync pipeline |
| **Kết luận** | **✅ Đủ cho 10K users** | Cần khi > 50K users |

### Khi nào migrate sang Elasticsearch?

| Trigger | Action |
|---------|--------|
| Search queries > 200ms (P95) | Thêm index optimization trước |
| Total documents > 500K | Cân nhắc Elasticsearch |
| Cần advanced features (geo, aggregations) | Chuyển sang Elasticsearch |
| > 50K concurrent users | Chuyển sang Elasticsearch |

### Checklist Step 5.4

```
[ ] PostgreSQL extensions: pg_trgm, unaccent
[ ] Vietnamese text search configuration
[ ] tsvector columns + GIN indexes cho 5 entities
[ ] Trigram indexes cho fuzzy search
[ ] SearchService with global search
[ ] Prisma middleware auto-update search vectors
[ ] Initial data migration script
[ ] Global search API (multi-entity)
[ ] Type-specific search
[ ] Autocomplete/suggest endpoint (trigram)
[ ] Highlighting search terms (ts_headline)
[ ] Frontend: search page (tabbed results)
[ ] Frontend: search bar in header (autocomplete + debounce)
[ ] Performance: search results < 200ms for 10K records
```

---

## STEP 5.5: INTEGRATION & TESTING

> **Duration:** 3 ngày | **Assign:** Toàn team

### Tasks

```
[ ] Reputation: action → points added → badge check → notification
[ ] Admin: full CRUD for all managed entities
[ ] Admin: charts display correctly
[ ] Admin: material approval → user notification
[ ] Admin: report resolve → user notification
[ ] Search: all entity types return results
[ ] Search: Vietnamese search works (có dấu + không dấu)
[ ] Search: autocomplete in header
[ ] Search: fuzzy matching ("javaa" → "java")
[ ] Cross-module: badge display on profile
[ ] Cross-module: leaderboard links to profiles
[ ] Performance: admin dashboard loads < 2s
[ ] Performance: search < 200ms
[ ] All pages responsive
[ ] Deploy to staging
```

---

## PARALLEL WORK

| Dev | Tuần 23 | Tuần 24 | Tuần 25 |
|-----|---------|---------|---------|
| Dev 1 | 5.2 Admin BE | 5.4 PG FTS Setup | 5.4 Search BE |
| Dev 2 | 5.1 Reputation BE | 5.2 Admin BE support | 5.5 |
| Dev 3 | 5.3 Admin FE | 5.3 Admin FE (charts) | 5.4 Search FE |
| Dev 4 | 5.1 Reputation FE | 5.3 Admin FE | 5.5 |
| Dev 5 | DB migration script | 5.4 Data migration | 5.5 |

---

> **Output Phase 5:** Gamification hoạt động, Admin dashboard đầy đủ, Global search (PostgreSQL FTS).
>
> **Tiếp theo:** [06-PHASE-6-LAUNCH.md](./06-PHASE-6-LAUNCH.md)
