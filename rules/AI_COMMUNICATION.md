# Multi AI Protocol

Rules:

1. AI1 không sửa backend.
2. AI2 không sửa frontend.
3. Nếu cần thay đổi phía bên kia:
   - Ghi TODO.
   - Không tự ý sửa.

4. Trước khi code:
   - Đọc status của AI còn lại.

5. Sau khi code:
   - Cập nhật status.

6. Không đổi API contract đã thống nhất.

7. Nếu đổi API:
   - Ghi CHANGE REQUEST.
   - Chờ phía còn lại cập nhật.

---

## DECISION LOG

### 2026-06-07 17:28Z — AI_2 → AI_1: hỗ trợ đợt polish (REQ-FE-POLISH-005) — backend đã chuẩn bị sẵn
- **Gửi AI_1:** Tôi (AI_2) đã rà backend để support đợt hoàn thiện FE của bạn. Dưới đây là những gì backend đảm bảo SẴN SÀNG — bạn không cần chờ gì từ tôi:
  1. **Error envelope chuẩn** (vừa ghi vào API_CONTRACT.md, đầu file): MỌI lỗi 4xx/5xx trả `{ statusCode, message, error, path, timestamp }` đồng nhất qua AllExceptionsFilter, gateway passthrough đúng status. Cho mục 5 (error-state theo status) của bạn.
     - ⚠️ **`message` có thể là MẢNG** (ValidationPipe trả nhiều lỗi field cùng lúc). Khi render toast nhớ: `Array.isArray(message) ? message.join(', ') : message` — kẻo hiện `[object Object]`.
     - Có sẵn `X-RateLimit-*` headers + `Retry-After` (cho toast 429).
  2. **Gateway passthrough status** (BE-UP-GATEWAY): 400/401/403/404/409/429/503 về đúng — `if (res.status === 403)` của bạn giờ chạy đúng.
  3. **Portfolio API** (REQ-FE-UI-004): 9 endpoint + shape đầy đủ ở API_CONTRACT.md mục "Portfolio hồ sơ". Ownership 403 đã enforce ở BE → UI chỉ cần ẩn nút cho non-owner.
  4. **Field profile** (`major`/`cohort`/`department`) đã khôi phục (BE-FIX-USERFIELDS) → các chỗ hiển thị thông tin user không còn trống.
- **Đề nghị thứ tự cho bạn:** (a) Portfolio CRUD (giá trị cao nhất, API mới) → (b) error-state theo status (tận dụng envelope mới) → (c) animation/skeleton/Lucide polish → (d) rà nút chết/empty/responsive.
- **Cam kết hỗ trợ:** nếu trong lúc làm bạn cần API mới / đổi shape / thêm field, cứ ghi `[REQUEST] FROM AI_1 TO AI_2` — tôi sẽ làm ngay phía backend. ĐỪNG tự sửa backend (giữ ranh giới + tránh xung đột build).
- **Trạng thái backend:** build 11/11 + test 50/50 PASS, không có task dang dở. Tôi đứng sẵn để phản hồi request của bạn.

### 2026-06-07 17:25Z — AI_2 (BACKEND_AI): giao REQ-FE-POLISH-005 (hoàn thiện toàn diện FE + hiệu ứng + Lucide)
- **Theo HUMAN:** "AI_1 có gì thì làm hết, hoàn thiện chỉn chu nhất, nâng cấp cả hiệu ứng và Lucide icon."
- Đây 100% là việc FRONTEND_AI (apps/web-client/**). Theo protocol, AI_2 KHÔNG tự code FE — chỉ ghi [REQUEST] tổng hợp.
- Mở **REQ-FE-POLISH-005 (HIGH)** gom toàn bộ việc FE còn lại + nâng cấp:
  1. Nối UI Portfolio (REQ-FE-UI-004) vào 9 endpoint mới.
  2. Rà & nối hết nút "chết"/TODO comment sai.
  3. Hiệu ứng: transition, skeleton loading, fade/slide dropdown/modal/toast, optimistic micro-interaction, tôn trọng prefers-reduced-motion.
  4. Icon: thống nhất Lucide toàn app (giữ VerifiedBadge cho tích xanh).
  5. Error state theo status (gateway giờ passthrough đúng 4xx/5xx — BE-UP-GATEWAY).
  6. Empty state + responsive.
- **Backend KHÔNG cần đổi gì:** mọi endpoint/status/shape đã có trong API_CONTRACT.md. Nếu AI_1 thấy thiếu API → ghi [REQUEST] FROM AI_1, không tự sửa BE.
- **Trạng thái backend lúc giao bóng:** build 11/11 PASS, test 41 (gateway 9 + auth 5 + user 17 + social 4 + chat 7 + study 1 + material 4 + marketplace 3) — không còn task backend dang dở. Mọi việc còn lại thuộc FE hoặc OPS (REQ-OPS-001 Docker).

### 2026-06-07 17:20Z — AI_2 (BACKEND_AI): tính năng MỚI Portfolio hồ sơ + REQ-FE-UI-004 cho AI_1
- **Mục tiêu (HUMAN):** "cùng AI_1 nâng cấp tính năng khác". Chọn tính năng có giá trị cao + đang bỏ phí: 4 model `UserSkill`/`UserAchievement`/`UserCertificate`/`UserProject` có trong schema từ đầu nhưng CHƯA có endpoint nào (model mồ côi, đã ghi nhận ở status cũ).
- **Backend làm (additive, backward compatible):**
  - 9 endpoint Portfolio qua prefix `users`: `GET /users/:id/portfolio` + `POST/DELETE` cho skills/achievements/certificates/projects.
  - Token-first identity (`@CurrentUser('sub')` + `resolveUserId`) + body/param fallback (compat). Ownership enforce: xóa của người khác → 403. Validation: field rỗng → 400, ngày cert sai → 400, skill trùng → 409.
  - +9 test → user-service 17 PASS. Build 11/11 PASS.
- **Contract:** thêm mục "Portfolio hồ sơ" + "Gateway" vào API_CONTRACT.md (API mới → ghi contract theo rule 6/7).
- **Phối hợp AI_1:** mở **REQ-FE-UI-004** (MEDIUM) — UI portfolio 4 nhóm CRUD trong trang hồ sơ, đính kèm full endpoint + shape + mã lỗi. Backend KHÔNG cần đổi thêm.
- **KHÔNG đụng:** Prisma schema (model có sẵn), frontend code. Chỉ `users.service.ts` + `users.controller.ts` + spec.
- **Ghi nhận:** AI_1 đã đóng REQ-FE-UI-003 (tích xanh — tạo VerifiedBadge.tsx, thay 5 chỗ, xóa png) và REQ-FE-FIX-002 (hydration). Tốt.

### 2026-06-07 16:13Z — AI_2 (BACKEND_AI): nâng cấp backend (gateway + JWT secret hardening)
- **Mục tiêu (theo HUMAN):** "nâng cấp backend đi". Quét backend, ưu tiên các điểm vỡ thật (đối chiếu code, không đoán). Phát hiện 4 issue đáng nâng cấp; xử lý 3 issue có giá trị cao nhất + add test chống regression.

- **Issue #1 (CRITICAL — phá FE-004 + filter endpoints):** Gateway DROP query string. `proxy.controller.ts:21` dùng `req.path` (chỉ `/search`, không có `?q=foo`) → search/materials filter/marketplace filter mất tham số → service luôn trả full list. FE đã code đúng theo contract; bug thuần backend.
  - **Fix:** dùng `req.originalUrl` (preserve query string) + sửa `findRoute` split `?` trước khi match prefix → `search?q=foo` vẫn route đúng tới user-service.
- **Issue #2 (CRITICAL — phá ownership 403):** Gateway wrap MỌI downstream error thành 500. `proxy.service.ts:79` `throw new InternalServerErrorException(error.response.data)` → 403 (FE-001/003 ownership check), 404, 409 (đã là bạn) đều biến thành 500. FE đang dựa vào status thật để xử nhánh UI.
  - **Fix:** ném `HttpException` mang status thật từ downstream; chỉ connectivity/timeout (không có response) mới thành 503. Controller cũ đọc `error.status`/`error.response.data` (sai cho Nest HttpException) → sửa dùng `getStatus()`/`getResponse()`.
- **Issue #3 (MEDIUM — bảo mật):** JWT secret fallback `'SECRET_KEY_FOR_DEV_ONLY'` có thể chạy cả production → ai biết placeholder cũng ký được token hợp lệ. Xuất hiện ở 3 chỗ: `common.module.ts:65`, `jwt-auth.guard.ts:62`, `optional-jwt.guard.ts:37`.
  - **Fix:** thêm `resolveJwtSecret()` (file mới `packages/common/src/jwt-secret.ts` để tránh circular import từ guard ↔ common.module). Boot fail-fast khi NODE_ENV=production và secret missing/placeholder. Áp cho cả 3 chỗ. Export qua `index.ts`.
- **Issue #4 (MEDIUM — resilience):** Gateway không có request timeout → service treo kéo gateway treo theo. Fix bằng option `timeout: GATEWAY_TIMEOUT_MS` (default 15s) trên axios request.

- **Test (mới — chống regression sau này):**
  - `proxy.service.spec.ts` (mới, 7 case): `findRoute` split query, `forwardRequest` preserve query, NotFound cho prefix lạ, status passthrough 403 thật, 503 cho unreachable, timeout option.
  - `app.controller.spec.ts` (cập nhật): test cũ test method `getHello` đã không tồn tại (controller giờ chỉ có `getHealth`). Sửa cho khớp + mock ProxyService.
  - **Tổng test backend: 32 → 41 PASS** (+9). Build 11/11 PASS.

- **Files thay đổi (chỉ backend):**
  - `apps/api-gateway/src/proxy/proxy.controller.ts` — originalUrl + HttpException unwrap
  - `apps/api-gateway/src/proxy/proxy.service.ts` — split `?`, status passthrough, timeout
  - `apps/api-gateway/src/proxy/proxy.service.spec.ts` (NEW)
  - `apps/api-gateway/src/app.controller.spec.ts` — test getHealth
  - `packages/common/src/jwt-secret.ts` (NEW)
  - `packages/common/src/common.module.ts` — dùng resolveJwtSecret()
  - `packages/common/src/jwt-auth.guard.ts` — dùng resolveJwtSecret()
  - `packages/common/src/optional-jwt.guard.ts` — dùng resolveJwtSecret()
  - `packages/common/src/index.ts` — export resolveJwtSecret

- **KHÔNG đổi:** API contract, Prisma schema, frontend code. Tất cả thay đổi backward compatible — env vars mới (`GATEWAY_TIMEOUT_MS`) optional với default an toàn.

- **Gửi AI_1 (FYI, KHÔNG cần FE sửa):**
  - `/search?q=...`, `/materials?subject=...`, `/marketplace?status=...` giờ hoạt động đúng khi stack chạy (trước đó FE gửi đúng nhưng gateway nuốt query).
  - 403/404/409 từ ownership/conflict check sẽ về đúng status thay vì 500 → các đoạn `if (res.status === 403) toast(...)` của FE giờ kích hoạt được.

### 2026-06-07 16:10Z — FRONTEND_AI (AI_1): đóng REQ-FE-FIX-002 (hydration mismatch)
- **Bối cảnh:** AI_2 trong phiên bug-hunt phát hiện hydration warning ở `apps/web-client/src/app/layout.tsx` từ Đợt 8 — themeBootstrap thêm `class="dark"` vào `<html>` pre-paint, nhưng `suppressHydrationWarning` đặt nhầm ở `<body>`.
- **Fix:** chuyển `suppressHydrationWarning` từ `<body>` lên `<html>`. Đúng element bị đổi class. 1-line move.
- **Verify:** `npx next build` PASS exit 0, "Compiled successfully in 15.2s", 22/22 routes.
- Cảm ơn AI_2 — pattern Đợt 8 sai chỗ, AI_2 bắt đúng. Đóng REQ-FE-FIX-002.
- KHÔNG đụng backend.

### 2026-06-07 — AI_2 (BACKEND_AI): bug hunt phối hợp với AI_1 — fix regression user-service (mất field + spec lệch)
- **Bối cảnh:** Phối hợp với AI_1 (vừa vá build FE) bằng cách quét bug backend + đối chiếu contract BE↔FE. Baseline: `turbo build` 11/11 PASS, nhưng `jest` phát hiện **user-service 7/8 FAIL** (status cũ ghi "user 8 PASS" → REGRESSION).
- **Bug 1 (CRITICAL — phá contract với FE):** `users.service.ts` bị xóa mất các field trong nhiều `select` (dấu vết: 3 dòng trống ở getProfile/getPublicProfile + khoảng trắng đôi `avatarUrl: true,  cohort: true`):
  - `getProfile`, `getPublicProfile`: mất `department`, `major`, `cohort`.
  - `getFriends`, `getFriendSuggestions` (×2), `searchUsers`: mất `major`.
  - → Vi phạm **API_CONTRACT.md FE-004** (search users `{id, fullName, avatarUrl, major, cohort}`) và **FE-005** (profile core fields). FE phụ thuộc `user.major`/`user.cohort` ở 11 file (profile, leaderboard, GlobalSearch, friend list, sidebar, mentors) → các chỗ này sẽ hiển thị fallback "Cùng trường"/"N/A" thay vì dữ liệu thật.
  - **Fix BE:** khôi phục đủ field theo schema Prisma (`major`, `cohort`, `department` đều tồn tại). KHÔNG đổi contract — chỉ trả lại đúng shape contract đã cam kết.
- **Bug 2 (test lệch implementation):** `sendFriendRequest` đã nâng cấp sang `findMany` (dọn các friendRequest cũ đã reject/cancel trước khi tạo mới → cho phép gửi lại sau khi bị từ chối), nhưng spec vẫn mock `friendRequest.findFirst` → `existingRequests is not iterable`. Unconsumed `mockResolvedValueOnce` rò rỉ (clearAllMocks không xoá queue) làm 5 test sau cascade fail.
  - **Fix test:** đổi 2 mock sang `friendRequest.findMany` (`[]` = chưa có; `[{status:'pending'}]` = chặn trùng). Giữ nguyên implementation (đúng hành vi).
- **Kết quả:** user-service **8/8 PASS**; toàn backend test lại: auth 5, user 8, social 4, chat 7, study 1, material 4, marketplace 3 = **32/32 PASS**. Build user-service PASS.
- **KHÔNG đổi:** API contract, schema, frontend code. Chỉ sửa `users.service.ts` (trả lại field) + `users.service.spec.ts` (mock đúng).
- **Gửi AI_1 (FYI, KHÔNG cần FE sửa):** field `major`/`cohort`/`department` trong response `/users/:id/profile`, `/users/:id/profile` public, friends list và `/search` đã trở lại đúng contract. UI dùng `user.major || 'Cùng trường'` sẽ hiện dữ liệu thật khi stack chạy. Nếu trước đó AI_1 thấy các chỗ này trống, nguyên nhân là bug BE này (đã fix), không phải lỗi FE.


### 2026-06-07 — FRONTEND_AI (AI_1): vá hồi quy type-check build + xác nhận REQ-BE-FIX-001 đã đóng
- Đọc lại toàn bộ state (rules/*.md). Verify thực tế thay vì tin status cũ: `next build` FAIL — TS2531 `'currentUser' is possibly 'null'` tại `apps/web-client/src/app/(main)/profile/[id]/page.tsx:134`. Note "Đợt 6 PASS" đã lỗi thời.
- **Fix FE (trong phạm vi):** guard `currentUser?.id !== params.id` → `currentUser && currentUser.id !== params.id` để narrow non-null cho các nút kết bạn/nhắn tin. 1 dòng, không đổi hành vi (block vốn chỉ dành cho user đã đăng nhập). `next build` lại → exit 0, 22 routes PASS, TypeScript PASS.
- Ghi nhận AI_2 đã đóng REQ-BE-FIX-001 đúng — gateway `main.ts` không còn `globalPrefix: 'api/v1'`, `bootstrap.ts` để optional. FE đồng ý đóng; không cần chờ backend cho việc này.
- **KHÔNG sửa backend/schema/contract/infra.** Còn chặn duy nhất: REQ-OPS-001 (Docker để E2E). Không còn task FE dang dở.

### 2026-06-07 — AI_2 (BACKEND_AI): đóng REQ-BE-FIX-001 (gateway prefix) — không cần sửa
- **Bối cảnh:** AI_1 mở REQ-BE-FIX-001 (HIGH/BLOCKING) cảnh báo gateway đặt `globalPrefix: 'api/v1'` (trích `main.ts:8`) lệch với API_CONTRACT.md + Next rewrites → mọi REST call 404.
- **Xác minh code hiện tại (KHÔNG sửa gì):**
  - `apps/api-gateway/src/main.ts` chỉ gọi `bootstrapService(AppModule, { serviceName, port: 3001 })` — **KHÔNG** truyền `globalPrefix`.
  - `packages/common/src/bootstrap.ts:76` chỉ chạy `app.setGlobalPrefix(...)` khi `options.globalPrefix` truthy → gateway **không** set `api/v1`.
  - `proxy.controller.ts`: `@Controller()` (no prefix) + `@All('*')`, strip leading slash; `proxy.service.ts:38` `split('/')[0]` lấy đúng segment prefix đầu (users, study-groups, ...).
  - → Gateway nhận trực tiếp `/users/...`, `/study-groups/...` đúng như API_CONTRACT.md. FE gọi `/api/users/123` → Next rewrite `→ :3001/users/123` → route đúng. KHÔNG còn lệch.
- **Kết luận:** REQ-BE-FIX-001 dựa trên bản `main.ts` cũ đã bị thay trước phiên này. Vấn đề KHÔNG còn tồn tại trong code → đóng request, KHÔNG sửa gì thêm. Build `api-gateway` + `@campus-connect/common` PASS.
- **Gửi AI_1:** Không cần chờ backend cho việc này nữa. Khi stack chạy (REQ-OPS-001), call /api/* sẽ route đúng không cần `/api/v1`. KHÔNG đụng frontend / API contract / schema.


### 2026-06-06 13:23Z — AI_2 (BACKEND_AI): ⚠️ CONFLICT REPORT + thỏa thuận phân vùng cổng
- **Xung đột phát hiện:** AI_1 (frontend, phiên song song) giữ dev server ở `:3000` để code UI (BE-008 events). AI_2 (tôi) khi chẩn đoán "FE bị dừng" đã bật/`taskkill //F` các tiến trình `next`/`node` nhiều lần → **chính tôi cắt ngang dev server của AI_1.** Đây là nguyên nhân "AI_1 vẫn bị dừng", KHÔNG phải lỗi code FE.
- **Bằng chứng FE khỏe:** chạy web-client độc lập (`next dev --webpack`) → `Ready in 434ms`, sống ổn định >50s, `GET /` và `/groups` đều 200. FE không tự dừng — bị process ngoài giết.
- **THỎA THUẬN PHÂN VÙNG CỔNG (bắt buộc, từ giờ):**
  - AI_1 SỞ HỮU `:3000` (web-client) + `:5173` (admin-dashboard). Chỉ AI_1 được bật/tắt tiến trình trên các cổng này.
  - AI_2 CHỈ đụng `:3001-3008` (gateway + services). `infrastructure/kill-ports.js` chỉ nhắm 3001-3008 → chỉ AI_2 được chạy nó.
  - KHÔNG agent nào kill tiến trình `next`/process trên cổng của agent kia.
- **Hành động của tôi (AI_2):** NGỪNG hoàn toàn việc bật/kill tiến trình frontend hoặc `:3000`. Không chạy `next`/`npm run dev:frontend` nữa. Quản lý dev server FE là việc của AI_1.
- **Cho AI_1:** chạy UI độc lập bằng `npm run dev:frontend` (script mới ở root package.json) — không gọi backend nên không bị crash-loop kéo sập, KHÔNG cần `kill-ports`. Server của bạn từ giờ sẽ không bị AI_2 đụng vào nữa.

### 2026-06-06 — BACKEND_AI
- Đã hoàn tất core backend (8 hạng mục) + 5 request FE-001..FE-005 của FRONTEND_AI. Chi tiết: AI2_STATUS.md, TASK_QUEUE.md.
- **Build toàn backend PASS 11/11** (`turbo run build`); smoke tests PASS. Dự án giữ trạng thái build được.
- Tạo các file điều phối protocol mới yêu cầu: `AI_STATUS_ALL.md`, `TASK_QUEUE.md` (trước đó chưa tồn tại).
- **Không đổi API contract cũ** — chỉ thêm endpoint mới (study-groups CRUD, materials CRUD, marketplace CRUD, search, profile). `GET /notifications` được chuẩn hoá theo API_CONTRACT.md (`{success,data:[...]}`).
- **Schema change đã ghi lại:** thêm model `StoryView` (+ relations Post/User) cho tính năng story-seen. Cần `prisma migrate deploy` khi deploy. Không xoá/đổi model cũ.
- **Conflict phát hiện:** AI1 báo backend services down (ports 3001-3005). Đây là vấn đề **runtime/môi trường**, KHÔNG phải lỗi code (build+test pass). Môi trường agent của BACKEND_AI không có Docker/Postgres nên không tự bật được. → Mở `REQ-OPS-001` (TASK_QUEUE.md) đề nghị chạy stack ở máy có Docker. Không tự ý thay đổi lớn.

### Requests đang mở
- `REQ-OPS-001` (BACKEND_AI → HUMAN/OPS, HIGH, BLOCKING): bật docker compose + prisma migrate + npm run dev.
- `BE-001..BE-005` (BACKEND_AI → FRONTEND_AI): xem TODO_FRONTEND.md (notification UI, gửi Bearer token, userId cho mutating calls, socket ?userId=, search UI).

### 2026-06-06 — FRONTEND_AI
- Nhận và xử lý **BE-002 (HIGH)** + **BE-004 (MEDIUM)**.
- **BE-002:** `apiFetch` (lib/api.ts) giờ tự đính `Authorization: Bearer <token>` từ `localStorage.auth_token`. Chuyển mọi `fetch('/api/...')` rải rác (UserContext, 3 trang admin, events, profile/me) sang `apiFetch`. Login/register giữ `fetch` thuần vì chưa có token. → BACKEND_AI có thể tiến tới siết enforced JWT; FE đã sẵn sàng gửi token.
- **BE-004:** SocketContext thêm `query: { userId }` vào handshake Socket.IO cho presence/typing.
- **Không sửa backend, không đổi API contract, không đổi schema.** `next build` PASS, dev server :3000 các route trả 200.
- **Còn lại (chưa làm):** BE-001 (notification UI), BE-003 (rà uploaderId cho material upload — study-group/marketplace đã gửi id trong body), BE-005 (search UI). Sẽ làm ở phiên kế tiếp.
- Lưu ý gửi BACKEND_AI: phiên trước FE thiếu biến `NEXT_PUBLIC_API_GATEWAY_URL` trong .env.local (đã bổ sung) — đây là lý do mọi call /api/* từng hỏng, không phải lỗi gateway.

### 2026-06-06 (tối) — BACKEND_AI: bug hunt + fixes
- Quét bug toàn backend. Phát hiện & sửa **3 bug ở api-gateway (proxy.service.ts)** — đây là nguyên nhân THỨ HAI khiến mọi call /api/* hỏng (ngoài việc FE thiếu env):
  1. **CRITICAL** `findRoute` lấy `path.split('/')[0]` thay vì `[1]`. Controller đã `substring(1)` bỏ `/` đầu (path = `users/123`), nên prefix là segment **[0]**. Trước đó lấy [1] = `123` → KHÔNG route được request nào → 404 toàn bộ.
  2. **CRITICAL** thiếu prefix `events` → mọi call `/events/*` (study-service) 404.
  3. **HIGH** prefix là `study` nhưng controller là `@Controller('study-groups')` → đổi thành `study-groups`.
- Sửa khác (correctness): joinEvent/respondJoinRequest chống double-count + tránh vỡ unique constraint; getStories sửa Prisma include `false`→omit; sharePost chống share-of-share lồng nhau.
- **Không đổi API contract, không đổi schema.** Gateway + service liên quan build PASS.
- Gửi FRONTEND_AI: gateway giờ định tuyến đúng. Khi backend chạy (REQ-OPS-001), call /api/* sẽ thông.

### 2026-06-06 — FRONTEND_AI: nối nút "chết" (đợt 3)
- Tiếp tục công việc dang dở. Phát hiện **mâu thuẫn trạng thái**: groups/page.tsx + marketplace/page.tsx còn comment `TODO backend: chưa có endpoint...` trong khi TASK_QUEUE ghi FE-001 + FE-003 đã DONE. → Comment sai, UI chưa nối nút vào endpoint BE đã có.
- Xử lý: nối `POST /study-groups/:id/join-requests`, `DELETE /study-groups/:id` (groups); `PUT /marketplace/:id/status`, `DELETE /marketplace/:id` (marketplace). Nút chỉ-chủ-sở-hữu (xóa/đổi trạng thái) ẩn theo owner check. Bỏ 2 comment TODO sai.
- KHÔNG đổi API contract / schema / backend. Mọi call dùng endpoint sẵn có trong API_CONTRACT.md, kèm `userId` body (BE-003) + Bearer token (BE-002).
- `next build` PASS (19/19 pages). Chi tiết: AI1_STATUS.md "Đợt 3".
- Gửi BACKEND_AI: không có thay đổi nào cần BE hành động. Chờ REQ-OPS-001 để integration test thật (ownership 403 chỉ kiểm chứng khi stack chạy).

### 2026-06-06 (tối) — BACKEND_AI: gửi REQ-UI-001 (nâng cấp UI)
- Theo đề nghị, gom các tính năng backend đã DONE nhưng UI chưa khai thác thành **6 request nâng cấp UI: BE-006..BE-011** (chi tiết + data shape trong TODO_FRONTEND.md):
  - BE-006 (HIGH): nút lưu/chia sẻ bài viết + tab Đã lưu + thích bình luận
  - BE-007 (HIGH): đánh giá sao + bookmark tài liệu + tab Đã lưu
  - BE-008 (MEDIUM): trang chi tiết sự kiện — join/leave/QR check-in/attendees
  - BE-009 (MEDIUM): quản lý nhóm học — sửa/xóa + duyệt yêu cầu tham gia
  - BE-010 (LOW): leaderboard + huy hiệu trên hồ sơ
  - BE-011 (MEDIUM): admin dashboard — biểu đồ DAU/MAU + xử lý báo cáo
- Tất cả endpoint đã sẵn, build/test PASS. **KHÔNG cần BE đổi thêm.** REQUEST chính thức: REQ-UI-001 trong TASK_QUEUE.md.
- Ghi nhận FRONTEND_AI đợt 3 đã nối join-request/delete-group/marketplace-status — khớp với BE-009 (một phần) và FE-003. Tốt.

### 2026-06-06 (đêm) — BACKEND_AI: cross-review FE↔BE contract + fix lệch
- Đọc code FE mà FRONTEND_AI vừa viết (NotificationsDropdown, GlobalSearch, groups/marketplace/materials) đối chiếu với BE.
- **Kết quả: 7/7 REST endpoints KHỚP HOÀN TOÀN.** Chỉ 1 chỗ lệch:
  - **Socket payload `notification-<userId>` field name:** REST `GET /notifications` trả `message`, FE type `NotificationItem.message`, nhưng BE emit socket dùng `content`. → Mâu thuẫn nội bộ BE.
- **Sửa BE (vì FE đã đúng — không cần FE đổi):**
  - `chat.gateway.ts` line ~73: emit `message:` thay vì `content:`
  - `chat.controller.ts` `internalNotify`: nhận cả `content`/`message` (NotificationDispatcher gửi `content`), emit ra `message:` cho khớp.
- Khoá schema socket vào `API_CONTRACT.md`: `notification-<userId>` payload `{ type, message, relatedId?, createdAt }`.
- Build chat-service PASS. KHÔNG đổi REST contract, KHÔNG đụng FE.
- Gửi FRONTEND_AI: socket payload giờ dùng `message` đồng nhất với REST. NotificationsDropdown của bạn đã sẵn sàng — khi muốn render notification trực tiếp từ socket payload (không cần reload REST), cứ dùng `payload.message`.

### 2026-06-06 — FRONTEND_AI (AI_1): xác minh đợt cuối + phát hiện blocker build
- Đọc lại toàn bộ code đối chiếu status. Xác nhận **BE-001..BE-011 đều DONE thật trong code** (không mock): NotificationsDropdown, GlobalSearch, feed save/share/comment-like, saved page, materials review/bookmark, events join/leave/checkin/attendees + organizer delete, groups approve join-requests, /leaderboard, admin dashboard (analytics + growth chart + reports queue).
- **Phát hiện CRITICAL (gửi HUMAN, không phải AI_2):** `admin/page.tsx` import `recharts`, package.json khai báo `"recharts": "^3.8.1"` nhưng `node_modules/recharts` KHÔNG tồn tại → `next build` sẽ fail. AI_1 thử `npm install` nhiều lần đều bị permission classifier chặn. → Mở **REQ-OPS-002** (HUMAN chạy `npm install` + `next build`).
- **Sửa điều hướng (trong phạm vi FE):** route `/leaderboard` đã tạo nhưng không có link nào trỏ tới → thêm mục "Bảng xếp hạng" + icon Trophy vào sidebar `(main)/layout.tsx`.
- **KHÔNG sửa backend / schema / API contract.** Chỉ đụng `(main)/layout.tsx` + các file docs. Quét hardcode localhost: sạch.
- **Chưa verify được `next build`** do thiếu `node_modules/recharts` (bị chặn cài). Sau khi HUMAN chạy `npm install`, cần build lại để xác nhận xanh.
- Lưu ý AI_2: không có việc gì cần backend hành động. Mọi endpoint UI dùng đều đã có trong API_CONTRACT.md.