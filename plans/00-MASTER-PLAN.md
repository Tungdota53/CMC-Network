# 🎓 CAMPUSCONNECT — MASTER PLAN

> **Version:** 1.0.0 | **Updated:** 2026-06-04
> **Target:** 10,000 → 100,000 sinh viên
> **Team:** 5 developers
> **Deployment:** Self-hosted VPS
> **Platform:** Web first (Mobile app phase 2)

---

## MỤC LỤC

- [1. Tổng quan Dự án](#1-tổng-quan-dự-án)
- [2. Quyết định Kiến trúc](#2-quyết-định-kiến-trúc)
- [3. Tech Stack](#3-tech-stack)
- [4. Design System](#4-design-system)
- [5. Cấu hình Email Trường](#5-cấu-hình-email-trường)
- [6. Database Schema Tổng quan](#6-database-schema-tổng-quan)
- [7. Roadmap 6 tháng](#7-roadmap-6-tháng)
- [8. Danh sách Plan Chi tiết](#8-danh-sách-plan-chi-tiết)
- [9. Quy ước Code](#9-quy-ước-code)
- [10. Triển khai VPS](#10-triển-khai-vps)

---

## 1. TỔNG QUAN DỰ ÁN

CampusConnect là hệ sinh thái số toàn diện dành cho sinh viên đại học.

### 13 Module chính

| # | Module | Mô tả | Phase |
|---|--------|-------|-------|
| 1 | Authentication | Đăng ký/đăng nhập/bảo mật | Phase 1 |
| 2 | Student Profile | Hồ sơ sinh viên | Phase 1 |
| 3 | Social Network | Feed, bài viết, tương tác | Phase 2 |
| 4 | Stories | Tin 24h (ảnh/video/text) giống Facebook Stories | Phase 2 |
| 5 | Study Matching | Ghép nhóm học tập | Phase 3 |
| 6 | Material Hub | Kho tài liệu + AI | Phase 3 |
| 7 | Mentor Connect | Kết nối mentor-mentee | Phase 3 |
| 8 | Marketplace | Mua bán đồ cũ (chưa thanh toán) | Phase 4 |
| 9 | Event Management | Sự kiện CLB | Phase 4 |
| 10 | Realtime Chat | Nhắn tin realtime (Messenger-level) | Phase 2 |
| 11 | AI Assistant | Hỗ trợ học tập bằng AI | Phase 3 |
| 12 | Reputation System | Điểm uy tín + huy hiệu | Phase 5 |
| 13 | Admin Dashboard | Quản trị hệ thống | Phase 5 |

### Quyết định đã xác nhận

| Câu hỏi | Quyết định |
|----------|------------|
| Email trường | Cấu hình riêng theo từng trường (bảng `allowed_email_domains`) |
| Deployment | Self-hosted VPS (Docker Compose) |
| AI Budget | Team tự quản lý |
| Mobile App | Web first, Android/iOS app sau (Phase 2+) |
| Thanh toán | Chưa tích hợp trong Marketplace |
| Team size | 5 người |
| Tích xanh (Verified) | Admin cấp thủ công cho từng user, lưu trong field `is_verified` trên bảng `users` |

---

## 2. QUYẾT ĐỊNH KIẾN TRÚC

### Modular Monolith (Phase 1-2)

```
                    ┌─────────────────────┐
                    │     Nginx           │
                    │  (Reverse Proxy     │
                    │   + SSL + Rate      │
                    │   Limiting)         │
                    └────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼                             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │   Next.js Web    │         │   NestJS API     │
    │   (SSR + CSR)    │         │   (Monolith)     │
    │   Port: 3000     │         │   Port: 3001     │
    └──────────────────┘         └────────┬─────────┘
                                          │
                    ┌─────────────────────┼──────────────────┐
                    ▼                     ▼                  ▼
          ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
          │  PostgreSQL  │     │    Redis     │    │  RabbitMQ    │
          │  Port: 5432  │     │  Port: 6379  │    │  Port: 5672  │
          └──────────────┘     └──────────────┘    └──────────────┘
```

### Tại sao Modular Monolith?

- **Team 5 người** → Monolith dễ quản lý, phát triển nhanh hơn Microservices
- **10K users** → Modular Monolith đủ sức xử lý
- **Dễ tách** → Module rõ ràng, khi cần scale lên 100K có thể tách thành Microservices
- **DevOps đơn giản** → 1 Docker Compose, 1 VPS

### Chiến lược Mở rộng Tính năng (Extensibility & Safety)

Để đảm bảo hệ thống an toàn và không bị "phá vỡ" (break) khi bổ sung tính năng mới trong tương lai, chúng ta áp dụng các nguyên tắc sau:

1. **Frontend: Feature-Sliced Design (FSD)**
   - Các tính năng mới sẽ được đặt trong các thư mục độc lập (vd: `features/ai-assistant`, `features/marketplace`) với đầy đủ UI components, state (Zustand), và hooks riêng.
   - Tránh việc sửa đổi trực tiếp vào các component dùng chung (shared components) trừ khi cực kỳ cần thiết.

2. **Backend: Event-Driven Architecture (Kiến trúc Hướng Sự kiện)**
   - Sử dụng `EventEmitter` (Node.js) hoặc `BullMQ` (Redis) để giao tiếp giữa các module thay vì gọi hàm trực tiếp.
   - *Ví dụ:* Khi có bài viết mới (Feed), FeedModule sẽ phát ra sự kiện `post.created`. Nếu muốn làm tính năng "AI phân tích bài viết", chỉ cần tạo một `AIModule` mới và "lắng nghe" (listen) sự kiện này mà không cần đụng đến code của FeedModule. Điều này giữ an toàn tuyệt đối cho tính năng cũ.

3. **Backend: NestJS Modules & Strict Boundaries**
   - Mọi tính năng mới đều phải được gói gọn trong một `@Module()` riêng biệt (vd: `MarketplaceModule`). Không import chéo (circular dependencies).
   - Chỉ expose (export) các interface hoặc service tối giản nhất ra bên ngoài thông qua `exports: [XService]`.

4. **Security: Zero-Trust & RBAC**
   - Mọi tính năng mới được thêm vào đều mặc định bị khóa (require JWT authentication).
   - Kiểm duyệt đầu vào (Payload Validation) luôn được tự động xử lý thông qua `ValidationPipe` (class-validator / Zod).

### Khi nào tách Microservices?

| Trigger | Action |
|---------|--------|
| > 30K concurrent users | Tách Chat Service |
| AI cost > $500/month | Tách AI Service (GPU server riêng) |
| > 50K users | Tách Notification Service |
| DB connections > 200 | Thêm Read Replica |

---

## 3. TECH STACK

```
┌──────────────────────────────────────────────────────────────┐
│                       TECH STACK                              │
├───────────────┬──────────────────────────────────────────────┤
│ Frontend      │ Next.js 14 (App Router) + React 18           │
│ Language      │ TypeScript 5                                  │
│ Styling       │ TailwindCSS 3.x + Design Token System        │
│ State         │ Zustand (global) + React Query (server)       │
│ Forms         │ React Hook Form + Zod                         │
│ Backend       │ NestJS 10 + TypeScript                        │
│ ORM           │ Prisma 5                                      │
│ Database      │ PostgreSQL 16                                 │
│ Cache + Queue │ Redis 7 + BullMQ (thay RabbitMQ, tiết kiệm)  │
│ Realtime      │ Socket.IO 4 (Redis Adapter)                   │
│ Search        │ PostgreSQL Full-Text Search (thay ES, 0 RAM)  │
│ File Storage  │ Local disk (dev) → MinIO (prod khi cần)       │
│ Email         │ Nodemailer (SMTP)                             │
│ AI            │ OpenAI GPT-4o API                             │
│ Container     │ Docker + Docker Compose                       │
│ CI/CD         │ GitHub Actions                                │
│ Monitoring    │ Prometheus + Grafana (chỉ production)         │
│ Error Track   │ Sentry cloud free tier                        │
│ VPS           │ Ubuntu 22.04 LTS                              │
└───────────────┴──────────────────────────────────────────────┘
```

### Thay đổi quan trọng so với plan ban đầu

| Bỏ | Thay bằng | Lý do |
|----|-----------|-------|
| Elasticsearch (~2-4GB RAM) | PostgreSQL Full-Text Search (tsvector/tsquery + pg_trgm) | Đủ mạnh cho 10K users, 0 RAM thêm, cùng 1 DB |
| RabbitMQ (~300-500MB RAM) | BullMQ qua Redis | Redis đã có sẵn, BullMQ hỗ trợ retry/delay/cron đầy đủ |
| MinIO (dev) | Local disk | Dev đơn giản hơn, chỉ dùng MinIO khi production |
| Prometheus+Grafana (dev) | Không chạy ở dev | Chỉ bật ở production, tiết kiệm ~400MB RAM |

### VPS — Scaling theo thực tế

> ⚠️ **Nguyên tắc:** Nâng cấp VPS theo **lượng user thực tế**, KHÔNG theo phase code.
> Tất cả 6 phases đều chạy tốt trên 1 VPS nếu dưới 10K users.

| Lượng User | vCPU | RAM | Disk | Số VPS | Services chạy |
|------------|------|-----|------|--------|---------------|
| < 3K | 4 | 8GB | 80GB SSD | 1 | All-in-one |
| 3K - 10K | 4 | 8GB | 120GB SSD | 1 | All-in-one (đủ vì bỏ ES/RabbitMQ) |
| 10K - 30K | 8 | 16GB | 200GB SSD | 1 | All-in-one + PgBouncer |
| 30K - 50K | 8+4 | 16GB+8GB | 200GB+100GB | 2 | VPS1: App + Redis, VPS2: DB |
| 50K+ | 8×3 | 16GB×3 | 200GB×3 | 3+ | Tách DB, Cache, App riêng |

### Ước tính RAM usage (sau tối ưu)

```
Service              RAM (idle)    RAM (3K users)    RAM (10K users)
─────────────────────────────────────────────────────────────────────
PostgreSQL 16        200MB         400MB             800MB
Redis 7 (cache+queue)100MB         200MB             400MB
NestJS API           150MB         300MB             500MB
Next.js SSR          200MB         300MB             400MB
Nginx                 20MB          30MB              50MB
─────────────────────────────────────────────────────────────────────
TOTAL                670MB        1,230MB           2,150MB
OS + Buffer         ~1GB          ~1GB              ~1.5GB
─────────────────────────────────────────────────────────────────────
RAM CẦN             ~2GB          ~2.5GB            ~4GB
RAM VPS GỢI Ý        4GB           8GB               8-16GB
```

> 💡 Nhờ bỏ Elasticsearch (2-4GB) và RabbitMQ (300-500MB), **VPS 8GB RAM chạy thoải mái toàn bộ hệ thống** cho tới 10K users.

---

## 4. DESIGN SYSTEM

### Tham chiếu từ DESIGN.md (Facebook-inspired) + CampusConnect branding

```css
/* ===== CampusConnect Design Tokens ===== */

:root {
  /* ---------- Typography ---------- */
  --font-family-primary: 'Segoe UI Historic', 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-size-xs: 12px;    /* Caption, metadata */
  --font-size-sm: 13px;    /* Secondary text */
  --font-size-md: 14px;    /* Body text */
  --font-size-base: 15px;  /* Default body */
  --font-size-lg: 16px;    /* Subheadings */
  --font-size-xl: 20px;    /* Section headings */
  --font-size-2xl: 24px;   /* Page headings */
  --font-size-3xl: 28px;   /* Hero headings */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-line-height-tight: 1.2;
  --font-line-height-base: 1.34;
  --font-line-height-relaxed: 1.5;

  /* ---------- Colors: Light Mode ---------- */
  --color-primary: #1B74E4;          /* CampusConnect blue */
  --color-primary-hover: #1663C7;
  --color-primary-light: #E7F3FF;
  --color-secondary: #42B72A;        /* Success green */
  --color-accent: #F7B928;           /* Gold accent */

  --color-text-primary: #050505;
  --color-text-secondary: #65676B;
  --color-text-tertiary: #8A8D91;
  --color-text-inverse: #E4E6EB;
  --color-text-link: #1B74E4;

  --color-bg-primary: #F0F2F5;       /* Page background */
  --color-bg-secondary: #FFFFFF;     /* Card/surface */
  --color-bg-tertiary: #F0F2F5;      /* Input background */
  --color-bg-hover: #F2F2F2;
  --color-bg-active: #E4E6E9;

  --color-border-primary: #CED0D4;
  --color-border-secondary: #E4E6EB;
  --color-border-focus: #1B74E4;

  --color-error: #FA383E;
  --color-warning: #F7B928;
  --color-success: #42B72A;
  --color-info: #1B74E4;

  /* ---------- Colors: Dark Mode ---------- */
  /* Applied via [data-theme="dark"] or @media (prefers-color-scheme: dark) */
  --color-dark-bg-primary: #18191A;
  --color-dark-bg-secondary: #242526;
  --color-dark-bg-tertiary: #3A3B3C;
  --color-dark-bg-hover: #3A3B3C;
  --color-dark-text-primary: #E4E6EB;
  --color-dark-text-secondary: #B0B3B8;
  --color-dark-border-primary: #3E4042;

  /* ---------- Spacing ---------- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;

  /* ---------- Radius ---------- */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 999px;

  /* ---------- Shadow ---------- */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 12px 28px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);

  /* ---------- Motion ---------- */
  --motion-instant: 100ms;
  --motion-fast: 150ms;
  --motion-normal: 200ms;
  --motion-slow: 300ms;
  --motion-easing: cubic-bezier(0.4, 0, 0.2, 1);

  /* ---------- Z-Index ---------- */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;

  /* ---------- Breakpoints ---------- */
  /* sm: 640px | md: 768px | lg: 1024px | xl: 1280px | 2xl: 1536px */

  /* ---------- Layout ---------- */
  --sidebar-width: 280px;
  --header-height: 56px;
  --content-max-width: 680px;
  --right-panel-width: 320px;

  /* ---------- Icon System (SVG — thay thế hoàn toàn emoji) ---------- */
  /*
   * NGUYÊN TẮC: Toàn bộ UI KHÔNG dùng emoji characters.
   * Mọi icon được render bằng inline SVG (Lucide icon set).
   * Component: <Icon name="home" size="md" /> → render <svg> tương ứng.
   *
   * Lý do chọn Lucide SVG thay vì emoji:
   * 1. Emoji render khác nhau trên mỗi OS/browser → không consistent
   * 2. SVG scale perfect ở mọi kích thước, hỗ trợ currentColor
   * 3. Có thể animate bằng CSS (stroke-dasharray, transform...)
   * 4. Accessibility tốt hơn (aria-label, role="img")
   * 5. Có thể custom stroke width, color theo theme
   */
  --icon-xs: 12px;     /* Inline text, badges */
  --icon-sm: 16px;     /* Compact buttons, list items */
  --icon-md: 20px;     /* Default — sidebar items, toolbar */
  --icon-lg: 24px;     /* Header actions, primary buttons */
  --icon-xl: 32px;     /* Feature highlights, empty states */
  --icon-2xl: 40px;    /* Hero sections, onboarding */
  --icon-3xl: 48px;    /* Story create button, large empty states */

  --icon-color-primary: var(--color-text-primary);
  --icon-color-secondary: var(--color-text-secondary);
  --icon-color-tertiary: var(--color-text-tertiary);
  --icon-color-active: var(--color-primary);
  --icon-color-inverse: var(--color-text-inverse);
  --icon-color-error: var(--color-error);
  --icon-color-success: var(--color-success);

  --icon-stroke-thin: 1.5;
  --icon-stroke-normal: 2;
  --icon-stroke-bold: 2.5;

  /* ---------- Animation Tokens ---------- */
  --typing-dot-size: 8px;
  --typing-dot-gap: 4px;
  --typing-animation-duration: 1.4s;

  --skeleton-bg: var(--color-bg-tertiary);
  --skeleton-shimmer: linear-gradient(
    90deg,
    var(--skeleton-bg) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    var(--skeleton-bg) 75%
  );
  --skeleton-animation-duration: 1.5s;

  --story-progress-height: 2px;
  --story-progress-gap: 4px;
  --story-progress-bg: rgba(255, 255, 255, 0.3);
  --story-progress-fill: #FFFFFF;

  /* ---------- Mini Chat Dimensions (FB-style) ---------- */
  --mini-chat-width: 328px;
  --mini-chat-height: 455px;
  --mini-chat-gap: 8px;
  --mini-chat-max-windows: 3;
  --mini-chat-bottom-offset: 0px;
  --mini-chat-right-offset: 80px;   /* Tránh chồng lên scrollbar */

  /* ---------- Chat Theme Colors (Messenger Palette) ---------- */
  --chat-theme-default: #0084FF;     /* Messenger Blue */
  --chat-theme-scarlet: #FF2D55;
  --chat-theme-orange: #FF6B35;
  --chat-theme-yellow: #FFD60A;
  --chat-theme-green: #34C759;
  --chat-theme-teal: #00C7BE;
  --chat-theme-cyan: #32ADE6;
  --chat-theme-blue: #007AFF;
  --chat-theme-indigo: #5856D6;
  --chat-theme-purple: #AF52DE;
  --chat-theme-pink: #FF2D55;
  --chat-theme-lavender: #7B68EE;
  --chat-theme-berry: #8E4585;
  --chat-theme-hotpink: #FF69B4;
  --chat-theme-aqua: #00CED1;

  /* ---------- Reaction Colors (SVG fill — không dùng emoji) ---------- */
  --reaction-like: #1B74E4;
  --reaction-love: #F33E58;
  --reaction-haha: #F7B928;
  --reaction-wow: #F7B928;
  --reaction-sad: #F7B928;
  --reaction-angry: #E9710F;
}
```

### Icon Mapping Table (Emoji → SVG)

> **QUY TẮC BẮT BUỘC:** Mọi nơi trong code frontend, KHÔNG được sử dụng emoji characters
> làm icon. Phải dùng component `<Icon name="..." />` hoặc inline SVG.
> Emoji CHỈ được phép trong **nội dung do người dùng nhập** (tin nhắn, comment, bài viết).

| Vị trí | Emoji cũ | SVG Icon (Lucide) | Ghi chú |
|--------|----------|-------------------|---------|
| **Sidebar Navigation** | | | |
| Feed | 📱 | `<Icon name="home" />` | Filled khi active |
| Bạn bè | 👥 | `<Icon name="users" />` | |
| Học tập | 📚 | `<Icon name="book-open" />` | |
| Tài liệu | 📄 | `<Icon name="file-text" />` | |
| Mentor | 🎓 | `<Icon name="graduation-cap" />` | |
| Chợ | 🛒 | `<Icon name="shopping-bag" />` | |
| Sự kiện | 🎪 | `<Icon name="calendar" />` | |
| Chat | 💬 | `<Icon name="message-circle" />` | Badge count overlay |
| AI | 🤖 | `<Icon name="sparkles" />` | |
| Kỷ niệm | 🕐 | `<Icon name="clock" />` | |
| Đã lưu | 🔖 | `<Icon name="bookmark" />` | |
| Xem thêm | ⌄ | `<Icon name="chevron-down" />` | |
| **Header** | | | |
| Logo | 🎓 | Custom SVG logo CampusConnect | Không dùng emoji |
| Search | 🔍 | `<Icon name="search" />` | |
| Home tab | 🏠 | `<Icon name="home" />` | |
| Friends tab | 👥 | `<Icon name="users" />` | |
| Watch tab | 📺 | `<Icon name="play-square" />` | |
| Marketplace tab | 🏪 | `<Icon name="store" />` | |
| Groups tab | 👥 | `<Icon name="users-round" />` | |
| Gaming tab | 🎮 | `<Icon name="gamepad-2" />` | |
| Menu grid | ⊞ | `<Icon name="grid-3x3" />` | |
| Notifications | 🔔 | `<Icon name="bell" />` | Badge count |
| Messenger | 💬 | `<Icon name="message-circle" />` | Badge count |
| Profile | 👤 | `<Icon name="user" />` | Hoặc avatar image |
| **Chat Area** | | | |
| Phone call | ☎️ | `<Icon name="phone" />` | |
| Video call | 🎥 | `<Icon name="video" />` | |
| Info panel | ℹ️ | `<Icon name="info" />` | |
| Attach photo | 📷 | `<Icon name="image" />` | |
| Attach file | 📎 | `<Icon name="paperclip" />` | |
| Voice record | 🎤 | `<Icon name="mic" />` | |
| Emoji picker | 😊 | `<Icon name="smile" />` | |
| GIF picker | GIF | `<Icon name="clapperboard" />` | Hoặc text "GIF" |
| Sticker | 🩹 | `<Icon name="sticker" />` | |
| Send button | ➤ | `<Icon name="send" />` | |
| Like/thumbs | 👍 | `<Icon name="thumbs-up" />` | Quick emoji button |
| Close | ✕ | `<Icon name="x" />` | |
| Minimize | ─ | `<Icon name="minus" />` | |
| Maximize | □ | `<Icon name="maximize-2" />` | |
| More actions | ⋯ | `<Icon name="more-horizontal" />` | |
| Reply | ↩ | `<Icon name="reply" />` | |
| Forward | ↪ | `<Icon name="forward" />` | |
| Pin | 📌 | `<Icon name="pin" />` | |
| Trash/Delete | 🗑 | `<Icon name="trash-2" />` | |
| Edit | ✏️ | `<Icon name="pencil" />` | |
| Copy | 📋 | `<Icon name="copy" />` | |
| **Status Indicators** | | | |
| Online | 🟢 | CSS `::after` green dot (10px circle) | `background: var(--color-success)` |
| Offline | ⚪ | CSS `::after` gray dot | `background: var(--color-text-tertiary)` |
| Message sent | ✓ | `<Icon name="check" size="xs" />` | |
| Message delivered | ✓✓ | 2x `<Icon name="check" size="xs" />` overlapped | |
| Message seen | 👤 | Mini avatar (16px) dưới tin nhắn | Giống FB |
| **Reactions (SVG animated)** | | | |
| Like | 👍 | Inline SVG thumb-up (filled, animated) | `fill: var(--reaction-like)` |
| Love | ❤️ | Inline SVG heart (filled, pulse animation) | `fill: var(--reaction-love)` |
| Haha | 😆 | Inline SVG laughing face (custom drawn) | `fill: var(--reaction-haha)` |
| Wow | 😮 | Inline SVG surprised face (custom drawn) | `fill: var(--reaction-wow)` |
| Sad | 😢 | Inline SVG crying face (custom drawn) | `fill: var(--reaction-sad)` |
| Angry | 😡 | Inline SVG angry face (custom drawn) | `fill: var(--reaction-angry)` |
| **Feed Actions** | | | |
| Like | 👍 | `<Icon name="thumbs-up" />` | Outline → Filled khi active |
| Comment | 💬 | `<Icon name="message-square" />` | |
| Share | ↗️ | `<Icon name="share" />` | |
| Save/Bookmark | 🔖 | `<Icon name="bookmark" />` | Outline → Filled khi saved |
| **Create Post** | | | |
| Photo/Video | 📷 | `<Icon name="image" />` | Màu xanh lá |
| Tag people | 🏷️ | `<Icon name="user-plus" />` | Màu xanh dương |
| Feeling | 😊 | `<Icon name="smile" />` | Màu vàng |
| Poll | 📊 | `<Icon name="bar-chart-2" />` | |
| Document | 📄 | `<Icon name="file-plus" />` | |
| **Stories** | | | |
| Create story | + | `<Icon name="plus" />` trong circle | |
| Story camera | 📷 | `<Icon name="camera" />` | |
| Text story | Aa | `<Icon name="type" />` | |
| Story close | ✕ | `<Icon name="x" />` | Trắng trên nền tối |
| Story mute | 🔇 | `<Icon name="volume-x" />` | |
| Story unmute | 🔊 | `<Icon name="volume-2" />` | |
| Story pause | ⏸ | `<Icon name="pause" />` | |
| Story play | ▶ | `<Icon name="play" />` | |

### Component State Requirements (theo DESIGN.md)

Mọi interactive component phải có states:
1. **Default** — Trạng thái mặc định
2. **Hover** — Khi di chuột (desktop)
3. **Focus-visible** — Focus bằng keyboard (accessibility)
4. **Active** — Khi click/tap
5. **Disabled** — Khi không thể tương tác
6. **Loading** — Khi đang xử lý async
7. **Error** — Khi có lỗi

### Accessibility Requirements

- **WCAG 2.2 AA** compliance
- Keyboard navigation cho tất cả interactive elements
- Focus-visible indicators rõ ràng
- Minimum contrast ratio 4.5:1 (text), 3:1 (large text/UI)
- ARIA labels cho tất cả icons/buttons không có text
- Screen reader support

---

## 5. CẤU HÌNH EMAIL TRƯỜNG

### Thiết kế: Multi-tenant Email Domain

```sql
-- Bảng cấu hình domain email cho từng trường
CREATE TABLE allowed_email_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(100) NOT NULL UNIQUE,     -- "st.cmcu.edu.vn"
    university_name VARCHAR(300) NOT NULL,   -- "CMC University"
    university_code VARCHAR(20) NOT NULL,    -- "CMC"
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    max_users INTEGER,                       -- NULL = unlimited
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data
INSERT INTO allowed_email_domains (domain, university_name, university_code) VALUES
('st.cmcu.edu.vn', 'CMC University', 'CMC');
```

### Validation Flow

```typescript
// Backend validation
async validateEmailDomain(email: string): Promise<AllowedDomain> {
  const domain = email.split('@')[1];
  const allowed = await prisma.allowedEmailDomain.findFirst({
    where: { domain, is_active: true }
  });
  if (!allowed) {
    throw new BadRequestException(
      'Email không thuộc trường đại học được hỗ trợ. ' +
      'Vui lòng sử dụng email trường học.'
    );
  }
  if (allowed.max_users) {
    const count = await prisma.user.count({
      where: { email: { endsWith: `@${domain}` } }
    });
    if (count >= allowed.max_users) {
      throw new BadRequestException('Trường đã đạt giới hạn người dùng.');
    }
  }
  return allowed;
}
```

### Admin: Quản lý Domain

```
POST   /admin/email-domains        → Thêm trường mới
GET    /admin/email-domains        → Danh sách trường
PUT    /admin/email-domains/:id    → Cập nhật
DELETE /admin/email-domains/:id    → Xóa
PATCH  /admin/email-domains/:id/toggle  → Bật/tắt
```

---

## 6. DATABASE SCHEMA TỔNG QUAN

### ERD Simplified (Chỉ core entities)

```
┌──────────────────────┐     ┌──────────────────────┐
│ allowed_email_domains│     │      faculties        │
│ ─────────────────── │     │ ──────────────────── │
│ id, domain,          │     │ id, name, code        │
│ university_name,     │     │                       │
│ university_code      │     └───────────┬───────────┘
└──────────────────────┘                 │
                                         │ 1:N
┌───────────────────┐              ┌─────▼─────────────┐
│     subjects      │              │      majors        │
│ ─────────────── │              │ ──────────────── │
│ id, name, code,   │◄─────┐      │ id, name, code     │
│ faculty_id        │      │      │ faculty_id          │
└───────────────────┘      │      └─────────┬───────────┘
         │                 │                │
         │ N:M             │                │ 1:N
         │                 │                │
┌────────▼──────────────────────────────────▼───────────┐
│                        users                          │
│ ──────────────────────────────────────────────────── │
│ id, email, password_hash, full_name, student_id,      │
│ avatar_url, faculty_id, major_id, academic_year,      │
│ role, status, reputation_score, ...                   │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
 posts stories friends chat  materials mentor products events
```

> **Chi tiết đầy đủ schema**: Xem [01-PHASE-1-FOUNDATION.md](./01-PHASE-1-FOUNDATION.md)

---

## 7. ROADMAP 6 THÁNG

### Timeline tổng quan

```
Jun       Jul       Aug       Sep       Oct       Nov       Dec
│─────────│─────────│─────────│─────────│─────────│─────────│
│ PHASE 1 │ PHASE 2          │ PHASE 3            │ PHASE 4 │
│Foundation│ Core Social      │ Education          │Commerce │
│         │                   │                    │& Events │
│  Auth   │  Feed + Chat      │ Study + Material   │Market + │
│  Profile│  Friends + Notif  │ Mentor + AI        │ Events  │
│  Setup  │                   │                    │         │
│─────────│─────────│─────────│─────────│─────────│─────────│
                                                   │ PHASE 5 │ PHASE 6
                                                   │Gamific. │ Polish
                                                   │ Admin   │ Launch
```

### Phase Breakdown

| Phase | Thời gian | Modules | Plan file |
|-------|-----------|---------|-----------|
| **Phase 1** | Tuần 1-6 | Setup + Auth + Profile | [01-PHASE-1-FOUNDATION.md](./01-PHASE-1-FOUNDATION.md) |
| **Phase 2** | Tuần 7-14 | Social Feed + Stories + Chat (Messenger-level) + Friends + Notifications | [02-PHASE-2-SOCIAL.md](./02-PHASE-2-SOCIAL.md) |
| **Phase 3** | Tuần 13-18 | Study Matching + Material Hub + Mentor + AI | [03-PHASE-3-EDUCATION.md](./03-PHASE-3-EDUCATION.md) |
| **Phase 4** | Tuần 19-22 | Marketplace + Events + Clubs | [04-PHASE-4-COMMERCE.md](./04-PHASE-4-COMMERCE.md) |
| **Phase 5** | Tuần 23-25 | Reputation + Admin Dashboard + Search | [05-PHASE-5-GAMIFICATION.md](./05-PHASE-5-GAMIFICATION.md) |
| **Phase 6** | Tuần 25-26 | Testing + Security + Polish + Launch | [06-PHASE-6-LAUNCH.md](./06-PHASE-6-LAUNCH.md) |

### Team Assignment (5 người)

| Role | Người | Trách nhiệm |
|------|-------|-------------|
| Tech Lead + Backend | Dev 1 | Architecture, core modules, code review |
| Backend Developer | Dev 2 | Feature modules, API, integrations |
| Senior Frontend | Dev 3 | UI architecture, complex components, design system |
| Frontend Developer | Dev 4 | Pages, components, responsive |
| Fullstack + DevOps | Dev 5 | CI/CD, Docker, VPS, hỗ trợ FE/BE |

---

## 8. DANH SÁCH PLAN CHI TIẾT

| File | Nội dung | Status |
|------|----------|--------|
| [00-MASTER-PLAN.md](./00-MASTER-PLAN.md) | Tổng quan dự án (file này) | ✅ |
| [01-PHASE-1-FOUNDATION.md](./01-PHASE-1-FOUNDATION.md) | Project setup, DB, Auth, Profile | ✅ |
| [02-PHASE-2-SOCIAL.md](./02-PHASE-2-SOCIAL.md) | Feed, Friends, Chat, Notifications | ✅ |
| [03-PHASE-3-EDUCATION.md](./03-PHASE-3-EDUCATION.md) | Study, Materials, Mentor, AI | ✅ |
| [04-PHASE-4-COMMERCE.md](./04-PHASE-4-COMMERCE.md) | Marketplace, Events, Clubs | ✅ |
| [05-PHASE-5-GAMIFICATION.md](./05-PHASE-5-GAMIFICATION.md) | Reputation, Admin, Search | ✅ |
| [06-PHASE-6-LAUNCH.md](./06-PHASE-6-LAUNCH.md) | Testing, Security, Deploy, Launch | ✅ |

---

## 9. QUY ƯỚC CODE

### Naming Convention

```
Backend (NestJS):
├── Module:     camelCase     (auth.module.ts)
├── Controller: camelCase     (auth.controller.ts)
├── Service:    camelCase     (auth.service.ts)
├── DTO:        kebab-case    (create-post.dto.ts)
├── Entity:     PascalCase    (User, Post)
├── Variable:   camelCase     (userId, postContent)
├── Constant:   UPPER_SNAKE   (MAX_FILE_SIZE)
├── Enum:       PascalCase    (UserRole.STUDENT)
└── API path:   kebab-case    (/study-groups, /mentor-sessions)

Frontend (Next.js):
├── Component:  PascalCase    (PostCard.tsx)
├── Page:       lowercase     (page.tsx - Next.js convention)
├── Hook:       camelCase     (useAuth.ts)
├── Store:      camelCase     (authStore.ts)
├── Type:       PascalCase    (User, Post)
├── Util:       camelCase     (formatDate.ts)
└── CSS class:  kebab-case    (post-card, user-avatar)
```

### Git Convention

```
Branch:
  main          → production
  develop       → development
  feature/*     → feature/auth-module
  bugfix/*      → bugfix/login-error
  hotfix/*      → hotfix/critical-fix

Commit message:
  feat: add user registration
  fix: resolve login token refresh issue
  chore: update dependencies
  docs: add API documentation
  refactor: extract auth guard
  test: add auth service unit tests
  style: fix button alignment
```

### API Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {                    // Chỉ có khi paginated
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Must be a valid school email" }
    ]
  }
}
```

---

## 10. TRIỂN KHAI VPS

### Docker Compose Production

```yaml
# docker-compose.prod.yml (simplified — chỉ 4 services cốt lõi)
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on: [api, web]
    restart: always

  web:
    build: ./frontend
    expose: ["3000"]
    environment:
      - NEXT_PUBLIC_API_URL=/api
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M

  api:
    build: ./backend
    expose: ["3001"]
    environment:
      - DATABASE_URL=postgresql://cc:password@db:5432/campusconnect
      - REDIS_URL=redis://redis:6379
    depends_on: [db, redis]
    restart: always
    deploy:
      resources:
        limits:
          memory: 1G

  db:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      - POSTGRES_USER=cc
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=campusconnect
    # PostgreSQL memory tuning cho VPS 8GB
    command: >
      postgres
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c work_mem=16MB
      -c maintenance_work_mem=128MB
      -c max_connections=100
    restart: always

  redis:
    image: redis:7-alpine
    command: >-
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}
    restart: always

volumes:
  postgres_data:
```

> ⚠️ **Lưu ý:** Không chạy RabbitMQ, MinIO, Elasticsearch, Prometheus, Grafana trong docker-compose mặc định.
> - Queue: BullMQ dùng Redis (đã có)
> - Search: PostgreSQL Full-Text Search (đã có)
> - Storage: Local disk mount vào `/opt/campusconnect/uploads`
> - Monitoring: Chỉ bật khi cần debug (separate compose file)

### Nginx Config

```nginx
server {
    listen 80;
    server_name campusconnect.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name campusconnect.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # === RATE LIMITING ZONES ===
    limit_req_zone $binary_remote_addr zone=global:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=ai:10m rate=5r/m;

    # === SECURITY HEADERS ===
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Ẩn thông tin server
    server_tokens off;

    # Giới hạn body size (chống upload bomb)
    client_max_body_size 50M;

    # Frontend
    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        limit_req zone=global burst=20 nodelay;
        proxy_pass http://api:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Auth (stricter rate limit)
    location /api/auth/ {
        limit_req zone=auth burst=3 nodelay;
        proxy_pass http://api:3001/auth/;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Upload (rate limited)
    location /api/upload {
        limit_req zone=upload burst=5 nodelay;
        proxy_pass http://api:3001/upload;
        client_max_body_size 50M;
    }

    # AI endpoints (rate limited)
    location /api/ai/ {
        limit_req zone=ai burst=3 nodelay;
        proxy_pass http://api:3001/ai/;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://api:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files (local disk)
    location /uploads/ {
        alias /opt/campusconnect/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        # Chống hotlinking
        valid_referers none blocked campusconnect.yourdomain.com;
        if ($invalid_referer) {
            return 403;
        }
    }

    # Block common attack paths
    location ~* /(wp-admin|wp-login|xmlrpc|phpmyadmin|\.env|\.git) {
        return 444;
    }
}
```

---

## 11. BẢO MẬT TOÀN DIỆN

### Threat Model — Mọi kịch bản tấn công

```
┌────────────────────────────────────────────────────────────────────┐
│                      THREAT MAP                                    │
├─────────────────┬──────────────────────────────────────────────────┤
│ Layer           │ Threats                                          │
├─────────────────┼──────────────────────────────────────────────────┤
│ 🌐 Network      │ DDoS, Man-in-the-Middle, DNS hijacking          │
│ 🔐 Auth         │ Brute force, Credential stuffing, Session       │
│                 │ hijacking, JWT theft, OAuth phishing             │
│ 🛡️ API          │ SQL injection, IDOR, Mass assignment,           │
│                 │ Broken access control, Rate limit bypass         │
│ 📝 Input        │ XSS (stored/reflected), CSRF, Path traversal,   │
│                 │ File upload attacks, JSON injection              │
│ 💬 WebSocket    │ WS auth bypass, Message injection, Flooding     │
│ 📧 Email        │ OTP brute force, Email enumeration,             │
│                 │ Email bombing, Spoofing                         │
│ 📁 File         │ Malicious upload, Type spoofing, Path traversal,│
│                 │ Zip bomb, SVG XSS                               │
│ 🤖 AI           │ Prompt injection, Token abuse, Cost attack      │
│ 👤 Privacy      │ Profile scraping, Data leak, IDOR on user data  │
│ 🖥️ Server       │ SSH brute force, Unpatched OS, Docker escape    │
│ 📦 Supply Chain │ npm dependency vulnerabilities                   │
└─────────────────┴──────────────────────────────────────────────────┘
```

### Phòng chống chi tiết cho từng layer

#### 🔐 Layer 1: Authentication

| Tấn công | Phòng chống | Cài đặt |
|----------|-------------|--------|
| Brute force login | Rate limit 10 lần/5 phút + account lockout 15 phút | `@nestjs/throttler` |
| Credential stuffing | Captcha sau 3 lần fail + device fingerprinting | `hcaptcha` |
| JWT token theft | Short TTL (15min) + httpOnly refresh cookie + token rotation | Cấu hình JWT |
| Session hijacking | Bind token với IP + User-Agent, đổi khi bất thường | Custom guard |
| OAuth phishing | Validate `state` parameter + whitelist redirect URI | Passport strategy |
| OTP brute force | Rate limit 1 lần/3 phút + OTP hết hạn 10 phút + max 5 attempts | Custom service |
| Email enumeration | Cùng response cho email tồn tại/không tồn tại | Auth service |
| Replay attack | Nonce trong OTP + one-time use tokens | Database flag |

```typescript
// Anti brute force implementation
@Injectable()
export class LoginAttemptGuard implements CanActivate {
  constructor(private redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = `login_attempts:${req.ip}:${req.body.email}`;
    const attempts = await this.redis.incr(key);

    if (attempts === 1) await this.redis.expire(key, 300); // 5 min window

    if (attempts > 10) {
      throw new TooManyRequestsException(
        'Quá nhiều lần thử. Vui lòng đợi 5 phút.'
      );
    }

    // Lock account after 10 failed attempts
    const accountKey = `account_lock:${req.body.email}`;
    const accountAttempts = await this.redis.get(accountKey);
    if (accountAttempts && parseInt(accountAttempts) >= 10) {
      throw new ForbiddenException(
        'Tài khoản tạm khóa do nhiều lần đăng nhập sai. Vui lòng đợi 15 phút hoặc đặt lại mật khẩu.'
      );
    }
    return true;
  }
}
```

#### 🛡️ Layer 2: API Security

| Tấn công | Phòng chống |
|----------|-------------|
| SQL Injection | Prisma ORM (parameterized) + KHÔNG dùng `$queryRawUnsafe` |
| IDOR (Insecure Direct Object Reference) | Ownership check trên mọi resource + UUID thay vì auto-increment |
| Mass Assignment | `whitelist: true` trong ValidationPipe + DTO strict |
| Broken Access Control | RBAC guard + resource ownership middleware |
| Rate Limit Bypass (đổi IP) | Rate limit theo user ID (khi đã auth) + global IP limit |
| GraphQL/API abuse | Giới hạn `select`/`include` depth trong Prisma, pagination bắt buộc |

```typescript
// IDOR Protection middleware
@Injectable()
export class OwnershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const resourceId = req.params.id;
    const handler = context.getHandler();

    const resourceType = Reflect.getMetadata('resource_type', handler);
    if (!resourceType) return true;

    const resource = await this.prisma[resourceType].findUnique({
      where: { id: resourceId },
      select: { authorId: true, userId: true, sellerId: true, creatorId: true },
    });

    if (!resource) throw new NotFoundException();

    const ownerId = resource.authorId || resource.userId ||
                    resource.sellerId || resource.creatorId;

    if (ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền thao tác này');
    }
    return true;
  }
}
```

#### 📝 Layer 3: Input & Content Security

| Tấn công | Phòng chống |
|----------|-------------|
| Stored XSS (trong bài viết/comment) | Sanitize HTML với `DOMPurify` + CSP header |
| Reflected XSS (qua URL params) | Escape output + CSP |
| CSRF | SameSite cookies + CSRF token cho forms |
| Path Traversal (tên file) | Strip `../`, `..\\`, chỉ cho phép `[a-zA-Z0-9._-]` |
| JSON Injection | `class-transformer` + strict DTO |
| Content Spam | AI-based spam detection (Phase 5) + report system |

```typescript
// Content sanitization service
import * as DOMPurify from 'isomorphic-dompurify';

export class ContentSanitizer {
  static sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br', 'ul', 'ol', 'li',
                     'strong', 'em', 'code', 'pre', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  }

  static stripAll(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  }
}
```

#### 📁 Layer 4: File Upload Security

```typescript
// File upload validation (KHÔNG tin client, kiểm tra magic bytes)
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_TYPES = {
  avatar: {
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024,  // 5MB
    maxDimension: 2000,         // 2000x2000px
  },
  material: {
    mimes: ['application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  product: {
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB per image
    maxFiles: 10,
  },
};

async function validateUpload(buffer: Buffer, category: string) {
  const config = ALLOWED_TYPES[category];

  // 1. Check file size
  if (buffer.length > config.maxSize) {
    throw new BadRequestException(`File quá lớn (max ${config.maxSize / 1024 / 1024}MB)`);
  }

  // 2. Check MIME via magic bytes (KHÔNG tin Content-Type header)
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !config.mimes.includes(type.mime)) {
    throw new BadRequestException('Loại file không được hỗ trợ');
  }

  // 3. For images: check for embedded scripts
  if (type.mime.startsWith('image/')) {
    const content = buffer.toString('utf-8', 0, 1000);
    if (/<script|javascript:|on\w+=/i.test(content)) {
      throw new BadRequestException('File chứa nội dung không hợp lệ');
    }
  }

  // 4. Generate safe filename (UUID + extension)
  const safeFilename = `${uuidv4()}.${type.ext}`;
  return { safeFilename, mime: type.mime };
}
```

#### 💬 Layer 5: WebSocket Security

```typescript
// Socket.IO auth + abuse prevention
@WebSocketGateway({ cors: { origin: FRONTEND_URL } })
export class ChatGateway {
  afterInit(server: Server) {
    // JWT authentication middleware
    server.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      try {
        const payload = this.jwtService.verify(token);
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub, status: 'ACTIVE' },
        });
        if (!user) return next(new Error('User not found'));
        socket.data.user = user;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });
  }

  // Rate limit chat messages (30/min per user)
  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, data: any) {
    const userId = client.data.user.id;
    const key = `chat_rate:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 60);
    if (count > 30) {
      client.emit('error', { message: 'Gửi tin nhắn quá nhanh' });
      return;
    }
    // ... process message
  }
}
```

#### 🤖 Layer 6: AI Security

| Tấn công | Phòng chống |
|----------|-------------|
| Prompt injection | System prompt hardcoded + user input wrapped + content filter |
| Token abuse (cost attack) | Rate limit 5 req/min + daily token budget per user |
| Data exfiltration via AI | AI không có access vào DB/files, chỉ nhận text input |

```typescript
// AI rate limiting + cost control
const AI_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 5,
  MAX_REQUESTS_PER_DAY: 50,
  MAX_INPUT_TOKENS: 4000,
  MAX_OUTPUT_TOKENS: 2000,
  DAILY_TOKEN_BUDGET_PER_USER: 50000,
};

async function checkAiRateLimit(userId: string) {
  // Per-minute check
  const minuteKey = `ai_rate:${userId}:${Math.floor(Date.now() / 60000)}`;
  const minuteCount = await redis.incr(minuteKey);
  if (minuteCount === 1) await redis.expire(minuteKey, 60);
  if (minuteCount > AI_LIMITS.MAX_REQUESTS_PER_MINUTE) {
    throw new TooManyRequestsException('AI: quá nhiều request, đợi 1 phút');
  }

  // Daily token budget check
  const dayKey = `ai_tokens:${userId}:${new Date().toISOString().split('T')[0]}`;
  const usedTokens = parseInt(await redis.get(dayKey) || '0');
  if (usedTokens >= AI_LIMITS.DAILY_TOKEN_BUDGET_PER_USER) {
    throw new TooManyRequestsException('Đã hết quota AI hôm nay');
  }
}
```

#### 🖥️ Layer 7: Server & Infrastructure

```bash
# === VPS HARDENING SCRIPT ===

# 1. SSH hardening
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config  # Đổi port SSH
sudo systemctl restart sshd

# 2. Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp    # SSH (port mới)
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# 3. Fail2Ban (chống brute force SSH)
sudo apt install fail2ban
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600
findtime = 600

[nginx-limit-req]
enabled = true
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600
EOF
sudo systemctl restart fail2ban

# 4. Auto security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 5. Docker security
# Không chạy container dưới root
# Giới hạn memory/CPU per container
# Read-only filesystem where possible

# 6. Database không expose port ra ngoài
# PostgreSQL và Redis chỉ listen trên Docker internal network
# KHÔNG map ports 5432, 6379 ra host trong production
```

#### 📦 Layer 8: Supply Chain Security

```bash
# Kiểm tra npm dependencies
npm audit
npm audit fix

# Dùng lockfile (đã có)
# Cài exact versions
npm install --save-exact

# GitHub Dependabot (.github/dependabot.yml)
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

### Security Monitoring Checklist (hàng tuần)

```
[ ] npm audit trên cả frontend + backend
[ ] Review Sentry errors cho suspicious patterns
[ ] Check rate limit logs cho IP abuse
[ ] Review new user registrations cho spam accounts
[ ] Check disk usage (file uploads)
[ ] Verify backup integrity (restore test monthly)
[ ] Review Docker image updates
[ ] Check SSL certificate expiry
```

---

> **Bước tiếp theo:** Bắt đầu với [01-PHASE-1-FOUNDATION.md](./01-PHASE-1-FOUNDATION.md) — Project Setup + Auth + Profile
