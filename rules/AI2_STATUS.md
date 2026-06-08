## Completed

### 2026-06-07 17:20Z — AI_2 (BACKEND_AI): tính năng MỚI — Portfolio hồ sơ (phối hợp AI_1 làm UI)
- **Mục tiêu HUMAN:** "cùng AI_1 nâng cấp tính năng khác". Khảo sát schema → 4 model mồ côi chưa có endpoint nào: `UserSkill`, `UserAchievement`, `UserCertificate`, `UserProject`. Đây là Portfolio hồ sơ sinh viên.
- **Backend (mới, additive — không phá gì):**
  - `users.service.ts`: thêm `getPortfolio` (gộp 4 list 1 round-trip qua Promise.all) + add/remove cho từng loại. Validation (tên rỗng → 400, ngày cert sai → 400), ownership (xóa của người khác → 403), unique skill → 409.
  - `users.controller.ts`: 9 route mới qua prefix `users`. Mutating dùng token-first (`@CurrentUser('sub')` + `resolveUserId`), fallback body `userId`/param trong compat window — khớp pattern optionalAuth của service.
  - Endpoint: `GET /users/:id/portfolio`, `POST/DELETE /users/:id/{skills,achievements,certificates,projects}[/:itemId]`.
- **Test:** +9 case portfolio (`getPortfolio` aggregate + 404, addSkill blank/conflict, removeSkill ownership 403 + owned delete, certificate validation, project techStack normalize, project ownership). **user-service: 8 → 17 PASS.** Build 11/11 PASS.
- **Contract:** ghi mục "Portfolio hồ sơ" + "Gateway" vào `API_CONTRACT.md` (API mới → bắt buộc ghi theo protocol).
- **Files (chỉ backend):** `apps/user-service/src/users/users.service.ts`, `users.controller.ts`, `users.service.spec.ts`. KHÔNG đụng schema (model đã có sẵn), KHÔNG đụng frontend.
- **Gửi AI_1:** REQ-FE-UI-004 — làm UI portfolio (4 nhóm CRUD trong trang hồ sơ). Endpoint + shape + mã lỗi đã ghi đủ. Backend không cần đổi thêm.

### 2026-06-07 16:13Z — AI_2 (BACKEND_AI): nâng cấp backend (gateway + JWT hardening)
- **Mục tiêu HUMAN:** nâng cấp backend. Quét code → phát hiện 4 issue thực; xử lý 3 issue có giá trị cao + thêm test.

- **#1 CRITICAL — Gateway DROP query string:**
  - `proxy.controller.ts:21` dùng `req.path` thay vì `req.originalUrl` → mất `?q=`/`?subject=`/`?status=`. → Phá FE-004 search và mọi filter.
  - **Fix:** dùng `originalUrl`; `findRoute` split `?` trước khi match prefix.

- **#2 CRITICAL — Gateway nuốt status downstream:**
  - `proxy.service.ts:79` wrap MỌI lỗi thành 500. → 403 ownership / 404 / 409 đều thành 500.
  - **Fix:** ném `HttpException` với status thật. Connectivity error mới thành 503. Controller dùng `getStatus()`/`getResponse()` (đúng API Nest).

- **#3 MEDIUM — JWT secret fallback chạy được ở production:**
  - 3 chỗ dùng `process.env.JWT_SECRET || 'SECRET_KEY_FOR_DEV_ONLY'`.
  - **Fix:** thêm `resolveJwtSecret()` (file mới `packages/common/src/jwt-secret.ts`, tránh circular import). Boot fail-fast nếu `NODE_ENV=production` và secret missing/placeholder. Áp cho CommonModule + 2 guard. Export qua index.

- **#4 MEDIUM — Gateway không có request timeout:**
  - **Fix:** axios option `timeout: GATEWAY_TIMEOUT_MS` (default 15s).

- **Test (mới):**
  - `apps/api-gateway/src/proxy/proxy.service.spec.ts` (mới, 7 case): findRoute split query, forwardRequest preserve query, NotFound cho prefix lạ, 403 passthrough, 503 cho unreachable, timeout option.
  - `apps/api-gateway/src/app.controller.spec.ts` cập nhật: test cũ gọi `getHello` (đã xóa khỏi controller) → đổi sang test `getHealth` + mock ProxyService.
  - **Tổng: 32 → 41 test PASS (+9). Build 11/11 PASS.**

- **Files (chỉ backend):**
  - `apps/api-gateway/src/proxy/proxy.controller.ts`, `proxy.service.ts`, `proxy.service.spec.ts` (NEW), `app.controller.spec.ts`
  - `packages/common/src/jwt-secret.ts` (NEW), `common.module.ts`, `jwt-auth.guard.ts`, `optional-jwt.guard.ts`, `index.ts`

- **KHÔNG đổi:** API contract, Prisma schema, frontend code. Backward compatible.

- **Gửi AI_1 (FYI):** `/search?q=`, filter endpoints, và status 403/404/409 giờ về đúng khi stack chạy. UI handler theo status sẽ kích hoạt đúng.

### 2026-06-07 — AI_2 (BACKEND_AI): bug hunt phối hợp AI_1 — fix regression user-service
- **Baseline:** `turbo build` backend 11/11 PASS. Chạy `jest` từng service → phát hiện **user-service 7/8 FAIL** (status cũ ghi 8 PASS → regression).
- **Bug 1 (CRITICAL, phá contract FE):** `users.service.ts` bị xóa field trong nhiều `select` — `getProfile`/`getPublicProfile` mất `department`/`major`/`cohort`; `getFriends`/`getFriendSuggestions`/`searchUsers` mất `major`. Vi phạm API_CONTRACT FE-004 (search) + FE-005 (profile). FE phụ thuộc `user.major`/`user.cohort` ở 11 file. → Khôi phục đủ field theo schema. KHÔNG đổi contract.
- **Bug 2 (test lệch):** `sendFriendRequest` đã dùng `findMany` (dọn request reject/cancel cũ → cho gửi lại) nhưng spec mock `findFirst` → `is not iterable` + mock-leak cascade. → Sửa spec sang `findMany`. Giữ implementation.
- **Kết quả:** user-service 8/8 PASS; toàn backend **32/32 PASS** (auth 5, user 8, social 4, chat 7, study 1, material 4, marketplace 3). Build PASS.
- **Files sửa:** `apps/user-service/src/users/users.service.ts`, `apps/user-service/src/users/users.service.spec.ts`. KHÔNG đụng contract/schema/frontend.
- **Phát hiện ngoài phạm vi (gửi AI_1):** lỗi hydration mismatch ở `apps/web-client/src/app/layout.tsx` (`<html>` thiếu `suppressHydrationWarning` trong khi themeBootstrap thêm `class="dark"`). → Mở REQ-FE-FIX-002, KHÔNG tự sửa frontend.

### 2026-06-07 — AI_2 (BACKEND_AI): xác minh + đóng REQ-BE-FIX-001 (gateway prefix)
- **Đọc trước:** PROJECT_STATE.md (không tồn tại — dùng AI_STATUS_ALL.md + TASK_QUEUE.md), TASK_QUEUE.md, AI1_STATUS.md, AI2_STATUS.md, AI_COMMUNICATION.md, API_CONTRACT.md, TODO_BACKEND.md.
- **Task backend dang dở duy nhất phát hiện:** REQ-BE-FIX-001 (FROM AI_1, HIGH/BLOCKING) — gateway nghi đặt `globalPrefix: 'api/v1'` lệch với API_CONTRACT.md/Next rewrites.
- **Xác minh code hiện tại (KHÔNG sửa code):**
  - `apps/api-gateway/src/main.ts:5-8` chỉ truyền `{ serviceName: 'api-gateway', port: 3001 }` — **KHÔNG** có `globalPrefix`.
  - `packages/common/src/bootstrap.ts:76` chạy `app.setGlobalPrefix(...)` chỉ khi `options.globalPrefix` truthy → gateway KHÔNG set `api/v1`.
  - `proxy.controller.ts:12,18` `@Controller()` không prefix + `@All('*')`; `proxy.service.ts:38` `path.split('/')[0]` lấy đúng segment đầu.
  - → Gateway nhận trực tiếp `/users/...`, `/study-groups/...` v.v. khớp API_CONTRACT.md. Mô tả của REQ-BE-FIX-001 (`main.ts:8` set `api/v1`) thuộc bản cũ đã bị thay trước phiên này.
- **Build verify:** `npx turbo run build --filter=api-gateway --filter=@campus-connect/common` → PASS (3 successful, 2 cached).
- **Cập nhật doc điều phối (chỉ rules/*.md, KHÔNG đụng code):**
  - `rules/TASK_QUEUE.md`: thêm hàng `BE-FIX-PREFIX | DONE`; gắn STATUS RESOLVED vào khối REQ-BE-FIX-001.
  - `rules/AI_COMMUNICATION.md`: thêm DECISION LOG 2026-06-07 với bằng chứng + kết luận đóng request.
  - `rules/AI2_STATUS.md`: mục này.
- **KHÔNG đổi:** API contract, schema, backend code, frontend code, infra script.
- **Trạng thái sau phiên:** Backend không còn task dang dở. Mọi BE/FE task trong TASK_QUEUE.md đều DONE. Còn 2 blocker hạ tầng ngoài tầm AI_2: REQ-OPS-001 (Docker/DB local) cho HUMAN/OPS.

## Completed (cũ)

### ⚠️ CONFLICT resolved: AI_2 tự giết dev server của AI_1 (2026-06-06 13:24Z)
- **Phát hiện:** "AI_1 vẫn bị dừng" KHÔNG phải lỗi orchestration hay code FE. Nguyên nhân thật: tôi (AI_2) khi chẩn đoán đã `taskkill //F` mọi tiến trình `next`/`node` → giết luôn dev server `:3000` mà AI_1 (phiên song song) đang dùng để code BE-008.
- **Xác minh FE khỏe:** web-client chạy độc lập `Ready in 434ms`, sống >50s, `GET / ` + `/groups` đều 200. FE không tự chết.
- **Khắc phục:** ngừng hoàn toàn việc tôi đụng tiến trình frontend/`:3000`. Ghi thỏa thuận phân vùng cổng vào AI_COMMUNICATION.md:
  - AI_1 sở hữu `:3000` + `:5173`. AI_2 chỉ `:3001-3008` + `kill-ports.js` (chỉ nhắm 3001-3008).
  - Không agent nào kill process của agent kia.
- **Quy tắc tự áp cho AI_2:** KHÔNG chạy `next`/`npm run dev:frontend`/kill process FE nữa. Quản lý FE runtime là việc của AI_1.
- KHÔNG sửa code FE/BE/schema/contract trong lần này. Chỉ cập nhật doc điều phối.

### Fix orchestration: FE bị backend crash kéo sập (2026-06-06 13:15Z, AI_2 / BACKEND_AI)
- **Triệu chứng (HUMAN báo):** web-client của AI_1 "chạy được một lúc rồi dừng".
- **Root cause (infra/orchestration, KHÔNG phải lỗi code FE):** `npm run dev` chạy MỘT tiến trình turbo chung cho cả `dev` (web-client) lẫn `start:dev` (toàn bộ NestJS services) `--concurrency=20`. Không có Postgres/Redis (Docker chưa bật) → các service backend crash-loop dưới `nest start --watch`; turbo run chung bị nhiễu/sập kéo theo web-client.
- **Fix (chỉ sửa root `package.json` — phạm vi infra của AI_2, KHÔNG đụng `apps/web/**`):** thêm script tách tiến trình:
  - `dev:frontend` = `turbo run dev --filter=web-client` (FE chạy độc lập, không bị BE kéo sập)
  - `dev:admin`    = `turbo run dev --filter=admin-dashboard`
  - `dev:web`      = web-client + admin-dashboard
  - `dev:backend`  = `turbo run start:dev --filter=!web-client --filter=!admin-dashboard`
  - `dev` cũ giữ nguyên (backward compatible).
- **Xác minh:** `turbo --dry` — `dev:frontend` → chỉ `web-client#dev`; `dev:backend` → 13 package, KHÔNG gồm web-client/admin-dashboard. Đúng.
- **Hướng dẫn cho AI_1 / HUMAN:** chạy FE riêng bằng `npm run dev:frontend` để dev UI không phụ thuộc backend. Khi cần data thật, bật Docker (REQ-OPS-001) rồi `npm run dev:backend` ở cửa sổ khác.
- KHÔNG đổi: frontend code, UI, API contract, schema, backend service code. Chỉ thêm npm scripts (non-breaking).

### Verify-only session (2026-06-06 13:04Z, AI_2 / BACKEND_AI)
- Đọc state đầy đủ: AI_COMMUNICATION.md, AI_STATUS_ALL.md, AI1_STATUS.md, AI2_STATUS.md, TASK_QUEUE.md, TODO_BACKEND.md, TODO_FRONTEND.md, API_CONTRACT.md.
- Lưu ý: prompt yêu cầu đọc `PROJECT_STATE.md` nhưng file này **không tồn tại** trong repo. Các file điều phối thực tế là `AI_STATUS_ALL.md` + `TASK_QUEUE.md`. Không tự tạo PROJECT_STATE.md để tránh thêm nguồn-sự-thật trùng lặp; nếu HUMAN/OPS muốn, sẽ gộp về một file duy nhất.
- Xác minh lại trạng thái backend, **không sửa code**:
  - `turbo run build` (loại web-client + admin-dashboard) → **11/11 PASS** (10 cache hit, chat-service rebuild sạch).
  - `jest` trong từng service → **32/32 tests PASS**: auth 5, user 8, social 4, chat 7, study 1, material 4, marketplace 3.
  - Docker không có trong môi trường agent (`docker: command not found`) → `BE-RUNTIME-UP` vẫn **BLOCKED**, không lặp lại REQ-OPS-001 (đã mở).
- Kết luận: **Không có task backend dang dở.** Tất cả TODO còn lại trong TASK_QUEUE.md đều thuộc FRONTEND_AI (BE-001/003/005 + BE-006..011 — đều là UI, ngoài phạm vi AI_2).
- KHÔNG sửa: backend code, schema, API contract, frontend, UI. Không tạo request mới (mọi request cần thiết đã mở).

### Audit fixes + tính năng bổ sung (2026-06-06, phiên BACKEND_AI)
- **BUG fix:** thay 6 chỗ `throw new Error` (trả HTTP 500) bằng Nest exceptions → 403/400/409 đúng chuẩn (posts.service.ts ×3, users.service.ts ×3)
- **Social mở rộng:** PostSave (toggle save + GET /posts/saved/:userId), CommentLike (toggle), POST /posts/:id/share — dùng model schema có sẵn (PostSave, CommentLike), không đổi schema
- **Material mở rộng:** MaterialReview (POST/GET + tự tính rating trung bình), MaterialBookmark (toggle + GET bookmarks)
- **Event mở rộng:** PUT/DELETE /events/:id (organizer), DELETE /events/:id/join (leave), POST /events/:id/checkin (QR), GET /events/:id/attendees
- Build PASS toàn bộ service đã đổi; smoke tests PASS (social 4, user 8, material 4)
- **Model "mồ côi" còn lại (chưa làm, ưu tiên thấp):** UserSkill, UserProject, UserCertificate, UserAchievement (portfolio/gamification — chờ FE yêu cầu)

### Backend production-readiness (first pass)
- JWT auth (token-first via optional-auth guard + resolveUserId); removed all firstUser fallbacks
- Notification service (persist + realtime socket push) for like / comment / friend-request / friend-accept / message
- Chat upgrade: online status, typing, delivered, read receipt, unread count, conversation search, group chat, file/message-type validation
- Story 24h expiry + seen state (new StoryView model)
- Upload StorageProvider abstraction (local + S3/Cloudinary/R2 placeholder) with mime/size whitelist validation
- Admin analytics (DAU/MAU/users/posts/reports) + moderation (suspend, delete content, resolve report) + Report CRUD
- Deploy: .env.example (root + 8 services), infrastructure/Dockerfile.service, docker-compose.prod.yml, CORS via ENV, removed hardcoded localhost
- Smoke tests across auth/posts/comments/friends/chat/materials/marketplace (31 passing)

### Responses to AI1 requests (rules/TODO_BACKEND.md)
- **FE-001** study-groups: `PUT /study-groups/:id`, `DELETE /study-groups/:id`, `POST /study-groups/:id/join-requests`, `GET /study-groups/:id/join-requests`, `PUT /study-groups/:id/join-requests/:requestId` (accept/reject)
- **FE-002** materials: `PUT /materials/:id`, `DELETE /materials/:id`, `POST /materials/:id/download`
- **FE-003** marketplace: `PUT /marketplace/:id`, `DELETE /marketplace/:id`, `PUT /marketplace/:id/status`, `POST /marketplace/upload`
- **FE-004** search: `GET /search?q=` grouped across users/groups/materials/products/posts
- **FE-005** profile: `GET /users/:id/profile`, `/posts`, `/photos`, `PUT /users/:id/profile`, `/cover` (friends + avatar already existed)
- Notification list response aligned to API_CONTRACT.md → `{ success, data: [{ id, type, message, createdAt }] }`

## Waiting Frontend
- Notification UI: unread badge + dropdown (see TODO_FRONTEND BE-001)
- Send `Authorization: Bearer <token>` header on all API calls so BE can switch from optional-auth to enforced JWT (see BE-002)
- Mutating calls (edit/delete/join/status) must pass the acting user — preferably via token; otherwise include `userId` in body during compat window (see BE-003)
- Socket handshake should include `?userId=<id>` for presence/online (see BE-004)

## API Contract Notes (BE → FE)
- Gateway routes by first path segment. Prefixes now live: `auth, users, mentors, reputation, notifications, admin, reports, search, posts, chat, study-groups, events, materials, marketplace`.
- Auth still in **optional mode**: token preferred, `userId`/`creatorId`/`sellerId`/`uploaderId` body fallback still accepted. Will harden to enforced JWT once FE sends tokens.
- Realtime: chat-service emits `notification-{userId}`, `presence`, `typing-{conversationId}`, `messageStatus-{conversationId}`.

## Files Changed
### packages/common
- src/optional-jwt.guard.ts (new), src/notification-dispatcher.ts (new), src/storage.ts (new)
- src/common.module.ts, src/index.ts

### packages/database
- prisma/schema.prisma (StoryView model + relations)

### apps/api-gateway
- src/proxy/proxy.service.ts (routes: mentors, reputation, notifications, admin, reports, search)

### apps/user-service
- src/app.module.ts
- src/users/users.controller.ts, src/users/users.service.ts, src/users/users.module.ts
- src/mentors/* (new), src/reputation/* (new), src/notifications/* (new), src/admin/* (new), src/search/* (new)

### apps/social-service
- src/posts/posts.controller.ts, src/posts/posts.service.ts, src/posts/posts.module.ts, src/app.module.ts

### apps/chat-service
- src/chat/chat.gateway.ts, src/chat/chat.service.ts, src/chat/chat.controller.ts, src/chat/chat.module.ts, src/chat/presence.service.ts (new), src/app.module.ts

### apps/study-service
- src/study/study.controller.ts, src/study/study.service.ts, src/events/events.controller.ts, src/app.module.ts

### apps/material-service
- src/materials/materials.controller.ts, src/materials/materials.service.ts, src/app.module.ts

### apps/marketplace-service
- src/marketplace/marketplace.controller.ts, src/marketplace/marketplace.service.ts, src/app.module.ts

### apps/auth-service
- src/auth/auth.service.ts (lastLoginAt for DAU/MAU), src/microsoft.strategy.ts (env callback URL)

### infrastructure / root
- .env.example + apps/*/.env.example, infrastructure/Dockerfile.service, infrastructure/docker-compose.prod.yml
