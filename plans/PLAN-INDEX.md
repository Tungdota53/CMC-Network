# PLAN INDEX — Frontend vs Backend

> File này giúp phân biệt nhanh phần nào là **Frontend (FE)**, phần nào là **Backend (BE)** trong toàn bộ hệ thống Plan.
> Dùng để chỉ định đúng context cho từng AI model khi code.

---

## Quy ước ký hiệu

| Ký hiệu | Ý nghĩa |
|----------|----------|
| 🎨 | **Frontend** — UI, components, pages, stores, hooks |
| ⚙️ | **Backend** — API, services, database, guards, queues |
| 🔧 | **Cả hai** — Setup, config, testing chung |
| 📐 | **Design System** — Tokens, colors, typography, spacing, ICON MAPPING |

---

## 00-MASTER-PLAN.md — Tổng quan dự án

| Section | Loại | Nội dung |
|---------|------|----------|
| Section 2: Quyết định Kiến trúc | 🔧 | Modular Monolith, khi nào tách Microservices |
| Section 3: Tech Stack | 🔧 | Toàn bộ công nghệ FE + BE |
| **Section 4: Design System** | 📐🎨 | **CSS tokens, colors, spacing, shadows, motion** — Model FE cần đọc |
| Section 5: Cấu hình Email Trường | ⚙️ | Email domain validation |
| Section 6: Database Schema Tổng quan | ⚙️ | ERD tổng thể |
| Section 9: Quy ước Code | 🔧 | Naming conventions cho cả FE + BE |
| Section 10: Triển khai VPS | ⚙️ | Docker Compose, Nginx config |
| Section 11: Bảo mật Toàn diện | ⚙️ | Threat model, rate limiting, guards |

---

## 01-PHASE-1-FOUNDATION.md — Auth + Profile

| Step | Dòng bắt đầu | Loại | Nội dung |
|------|---------------|------|----------|
| Step 1.1: Project Setup | L22 | 🔧 | Monorepo, Docker Compose, CI/CD, cấu trúc thư mục cả FE + BE |
| Step 1.2: Database Schema + Prisma | L680 | ⚙️ | Prisma schema (Users, Auth, Profile models), seed data |
| **Step 1.3: Auth Module Backend** | L1095 | ⚙️ | API endpoints, DTOs, AuthService, JWT, OAuth, 2FA, rate limit |
| **Step 1.4: Auth Frontend** | L1428 | 🎨 | Login/Register/OTP pages, wireframes, AuthStore (Zustand), token management |
| **Step 1.5: Profile Module Backend** | L1666 | ⚙️ | Profile API, upload avatar, skills/achievements CRUD |
| **Step 1.6: Profile Frontend** | L1750 | 🎨 | Profile page, edit profile, components |
| Step 1.7: Integration & Testing | L1804 | 🔧 | E2E test, checklist chung |

---

## 02-PHASE-2-SOCIAL.md — Feed + Chat + Friends

| Step | Dòng bắt đầu | Loại | Nội dung |
|------|---------------|------|----------|
| **Step 2.1: Social Feed Backend** | L22 | ⚙️ | Post CRUD, likes, comments, media upload, Prisma schema |
| **Step 2.2: Social Feed Frontend** | L373 | 🎨 | Feed page, PostCard, Stories Carousel, Virtual Scroll, Skeleton |
| **Step 2.2b: Stories System** | L534 | 🔧 | Stories schema, API, carousel, fullscreen viewer, cleanup (FE+BE) |
| Step 2.3: Friends System | L837 | 🔧 | Friend request API + UI |
| **Step 2.4: Realtime Chat Backend** | L886 | ⚙️ | Socket.IO, chat schema, BullMQ pipeline, multi-tab, batch seen |
| **Step 2.5: Realtime Chat Frontend** | L1385 | 🎨 | Messenger-level UI, Virtual Scroll, IndexedDB, Mini Chat Windows |
| Step 2.6: Notifications System | L1970 | 🔧 | Notification service (BE) + notification dropdown (FE) |
| Step 2.7: Integration & Testing | L2049 | 🔧 | Test chung + emoji audit + virtual scroll perf test |

---

## 03-PHASE-3-EDUCATION.md — Study + Material + Mentor + AI

| Step | Dòng bắt đầu | Loại | Nội dung |
|------|---------------|------|----------|
| **Step 3.1: Study Matching Backend** | L23 | ⚙️ | Study group schema, matching algorithm, API |
| **Step 3.2: Study Matching Frontend** | L194 | 🎨 | Study group cards, create/join UI, filter |
| **Step 3.3: Material Hub Backend** | L240 | ⚙️ | Material upload, tags, ratings, download tracking |
| **Step 3.4: Material Hub Frontend** | L411 | 🎨 | Material list, upload form, preview, rating stars |
| **Step 3.5: AI Integration** | L460 | ⚙️ | OpenAI API, prompt engineering, chat AI, summarize |
| **Step 3.6: Mentor Connect Backend** | L639 | ⚙️ | Mentor profiles, session booking, review system |
| **Step 3.7: Mentor Connect Frontend** | L768 | 🎨 | Mentor cards, booking UI, review form |
| Step 3.8: Integration & Testing | L812 | 🔧 | Test chung |

---

## 04-PHASE-4-COMMERCE.md — Marketplace + Events

| Step | Dòng bắt đầu | Loại | Nội dung |
|------|---------------|------|----------|
| **Step 4.1: Marketplace Backend** | L20 | ⚙️ | Product CRUD, categories, search, schema |
| **Step 4.2: Marketplace Frontend** | L187 | 🎨 | Product grid, product detail, sell form, image gallery |
| **Step 4.3: Event Management Backend** | L251 | ⚙️ | Event/Club schema, RSVP, calendar, roles |
| **Step 4.4: Event & Club Frontend** | L514 | 🎨 | Event cards, calendar view, club pages |
| Step 4.5: Integration & Testing | L601 | 🔧 | Test chung |

---

## 05-PHASE-5-GAMIFICATION.md — Reputation + Admin + Search

| Step | Dòng bắt đầu | Loại | Nội dung |
|------|---------------|------|----------|
| Step 5.1: Reputation & Badge System | L20 | 🔧 | Badge schema (BE) + Leaderboard/BadgeGrid UI (FE) |
| **Step 5.2: Admin Dashboard Backend** | L210 | ⚙️ | Admin API, stats, user management, content moderation, verified badge |
| **Step 5.3: Admin Dashboard Frontend** | L340 | 🎨 | Admin layout, charts, data tables, management UI |
| **Step 5.4: Global Search (PG FTS)** | L435 | ⚙️ | PostgreSQL Full-Text Search, tsvector, search service |
| Step 5.5: Integration & Testing | L746 | 🔧 | Test chung |

---

## 06-PHASE-6-LAUNCH.md — Security + Testing + Deploy

| Step | Dòng bắt đầu | Loại | Nội dung |
|------|---------------|------|----------|
| Step 6.1: Security Audit & Hardening | L21 | ⚙️ | CORS, rate limiting, data protection |
| Step 6.2: Performance Optimization | L129 | 🔧 | BE optimization + FE bundle/lazy load |
| Step 6.3: Testing | L209 | 🔧 | Unit test + E2E test |
| Step 6.4: Beta Testing | L321 | 🔧 | UAT, feedback |
| Step 6.5: Production Deployment | L381 | ⚙️ | Docker, VPS, SSL, DNS |
| Step 6.6: Post-Launch Monitoring | L501 | ⚙️ | Prometheus, Grafana, Sentry |

---

## Tóm tắt nhanh cho 2 Model

### 🎨 Model Frontend — Cần đọc:
1. `00-MASTER-PLAN.md` → **Section 4 (Design System + Icon Mapping Table)** — bắt buộc
2. `01-PHASE-1-FOUNDATION.md` → Step 1.1 (setup FE) + Step 1.4 + Step 1.6
3. `02-PHASE-2-SOCIAL.md` → Step 2.2 + Step 2.2b (Stories) + Step 2.5
4. `03-PHASE-3-EDUCATION.md` → Step 3.2 + Step 3.4 + Step 3.7
5. `04-PHASE-4-COMMERCE.md` → Step 4.2 + Step 4.4
6. `05-PHASE-5-GAMIFICATION.md` → Step 5.1 (FE phần) + Step 5.3

### ⚙️ Model Backend — Cần đọc:
1. `00-MASTER-PLAN.md` → **Section 5, 6, 9, 10, 11** — bắt buộc
2. `01-PHASE-1-FOUNDATION.md` → Step 1.1 (setup BE) + Step 1.2 + Step 1.3 + Step 1.5
3. `02-PHASE-2-SOCIAL.md` → Step 2.1 + Step 2.4
4. `03-PHASE-3-EDUCATION.md` → Step 3.1 + Step 3.3 + Step 3.5 + Step 3.6
5. `04-PHASE-4-COMMERCE.md` → Step 4.1 + Step 4.3
6. `05-PHASE-5-GAMIFICATION.md` → Step 5.2 + Step 5.4
7. `06-PHASE-6-LAUNCH.md` → Step 6.1 + Step 6.5 + Step 6.6
