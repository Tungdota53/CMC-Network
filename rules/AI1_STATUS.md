## Completed (phiên này — FRONTEND_AI)

### BE-002 (HIGH): Đính JWT vào mọi API call
- Nâng cấp `lib/api.ts`: `apiFetch` tự gắn `Authorization: Bearer <token>` lấy từ `localStorage.auth_token`
  - Không ghi đè nếu caller đã tự set Authorization
  - Không tự thêm Content-Type → giữ FormData (upload avatar/file) hoạt động đúng
  - `apiUrl` hỗ trợ cả hai kiểu path: `/api/...` (đi qua Next.js rewrites) và path thẳng gateway
  - Thêm helper `getAuthToken()` (an toàn SSR, trả null phía server)
- Chuyển toàn bộ `fetch('/api/...')` rải rác sang `apiFetch` để nhận token tự động:
  - contexts/UserContext.tsx (get/update profile, upload avatar)
  - (admin)/admin/page.tsx, (admin)/admin/users/page.tsx, (admin)/admin/posts/page.tsx
  - (main)/events/page.tsx
  - (main)/profile/me/page.tsx (friends list + friend requests + respond/cancel/remove)
- Login/register giữ nguyên `fetch` (chưa có token tại thời điểm gọi)
- AI route nội bộ `/api/ai/route.ts` giữ nguyên (không qua gateway)

### BE-004 (MEDIUM): Socket handshake gắn userId
- SocketContext.tsx: thêm `query: { userId: user.id }` vào kết nối Socket.IO cho presence/online + typing

## Verify
- `next build` PASS (TypeScript type-check OK, exit 0)
- Dev server http://localhost:3000 — HTTP 200: /, /groups, /marketplace, /materials, /events, /admin, /profile/me

## Waiting Backend / Còn lại (chưa làm phiên này)
- (đã xử lý BE-001, BE-003 material download, BE-005 ở đợt 2 — xem dưới)

## Đợt 2 — BE-001 / BE-003 / BE-005 + UI
- BE-001: NotificationsDropdown (badge unread + dropdown + realtime socket notification-<userId>), thay nút Bell tĩnh trong navbar
- BE-005: GlobalSearch (debounce 300ms, GET /search?q=&take=5, gom nhóm users/groups/materials/products/posts), thay ô search tĩnh
- BE-003: materials page nối nút tải xuống vào POST /materials/:id/download (đếm lượt), bỏ TODO comment cũ; upload đã gửi uploaderId
- MessagesDropdown chuyển sang apiFetch (nhất quán token)
- Đang nâng cấp UI hiện đại hơn theo yêu cầu user (in progress)

## Files Changed
- apps/web-client/src/app/lib/api.ts
- apps/web-client/src/app/contexts/UserContext.tsx
- apps/web-client/src/app/contexts/SocketContext.tsx
- apps/web-client/src/app/(admin)/admin/page.tsx
- apps/web-client/src/app/(admin)/admin/users/page.tsx
- apps/web-client/src/app/(admin)/admin/posts/page.tsx
- apps/web-client/src/app/(main)/events/page.tsx
- apps/web-client/src/app/(main)/profile/me/page.tsx
- apps/web-client/.env.local, .env.local.example (phiên trước: thêm NEXT_PUBLIC_API_GATEWAY_URL)
- rules/AI1_STATUS.md, rules/AI_COMMUNICATION.md

## API thay đổi / Migration / Rủi ro
- KHÔNG đổi API contract, KHÔNG đổi schema, KHÔNG sửa backend.
- Rủi ro thấp: nếu token hết hạn/sai, BE đang ở optional-auth mode nên vẫn fallback theo body userId trong compat window → không gãy ngay. Khi BE siết enforced JWT, các call thiếu token (login/register đã trừ) sẽ 401 đúng như mong đợi.

## Đợt 3 (2026-06-06) — Nối nút "chết" vào endpoint BE đã có (FE-001 / FE-003)
Phát hiện: 2 trang còn comment `TODO backend: chưa có endpoint...` SAI sự thật — BE đã DONE FE-001 (study-groups CRUD + join-requests) và FE-003 (marketplace CRUD/status). UI có nút nhưng chưa nối.
- **Groups page:** nút "Xin tham gia" trước đây không có onClick → nối `POST /study-groups/:id/join-requests` (state PENDING → "Đã gửi yêu cầu"). Thêm nút "Xóa nhóm" cho trưởng nhóm → `DELETE /study-groups/:id`. Owner check qua `creatorId`/`creator.id`. Bỏ comment TODO sai.
- **Marketplace page:** thêm nút "Đánh dấu đã bán / Mở bán lại" → `PUT /marketplace/:id/status`; nút xóa tin → `DELETE /marketplace/:id`, chỉ hiện với người bán (`seller.id === user.id`). Người không phải chủ vẫn thấy nút nhắn tin. Bỏ comment TODO sai.
- Tất cả mutating call gắn `userId` trong body (BE-003 compat window) + token tự đính qua `apiFetch` (BE-002).
- `next build`: ✓ Compiled successfully, 19/19 static pages, exit 0.
- Files: `apps/web-client/src/app/(main)/groups/page.tsx`, `apps/web-client/src/app/(main)/marketplace/page.tsx`.
- KHÔNG sửa backend / schema / API contract. Endpoint dùng đều đã có trong API_CONTRACT.md.
- Còn chờ: REQ-OPS-001 (bật stack có Docker) để integration test thật các nút này. Hành vi ownership 403 chỉ kiểm chứng được khi BE chạy.

## Đợt 4 (2026-06-06) — Hoàn thiện toàn bộ frontend task (BE-008, BE-009, BE-010, BE-011)
- **BE-009 (Groups):** Bổ sung UI và logic Quản lý yêu cầu tham gia (Accept/Reject) cho nhóm học qua API `/study-groups/:id/join-requests`.
- **BE-008 (Events):** Làm mới UI `events/page.tsx` (glassmorphism). Gắn API Tham gia / Hủy tham gia / Check-in QR / Danh sách người tham gia.
- **BE-011 (Admin Dashboard):** Nâng cấp trang Admin `admin/page.tsx`, cài đặt `recharts`. Tích hợp API `/admin/analytics`, `/admin/growth`, `/admin/reports`. Cung cấp chức năng Xóa nội dung / Bỏ qua báo cáo vi phạm.
- **BE-010 (Leaderboard):** Thêm trang mới `leaderboard/page.tsx` (Top điểm uy tín), gắn UI Reputation Score và Badges vào `profile/me/page.tsx`.
- **Files đã sửa / tạo:**
  - `apps/web-client/src/app/(main)/groups/page.tsx`
  - `apps/web-client/src/app/(main)/events/page.tsx`
  - `apps/web-client/src/app/(admin)/admin/page.tsx`
  - `apps/web-client/src/app/(main)/profile/me/page.tsx`
  - `apps/web-client/src/app/(main)/leaderboard/page.tsx` (NEW)
  - `apps/web-client/package.json` (thêm `recharts`)
- **Trạng thái:** Đã hoàn thành 100% các task được giao. KHÔNG can thiệp backend. Đang đợi REQ-OPS-001 để test E2E.

## Đợt 5 (2026-06-06) — Xác minh + vá lỗ hổng build/điều hướng (AI_1)
Đọc lại toàn bộ code đối chiếu status. Xác nhận BE-001/002/003/004/005/006/007/008/009/010/011 đều đã có trong code thật (không phải mock).
- **Phát hiện CRITICAL — build sẽ fail:** `admin/page.tsx` import `recharts` và `package.json` đã khai báo `"recharts": "^3.8.1"`, NHƯNG package CHƯA được cài trong `node_modules` (kiểm tra: không tồn tại `node_modules/recharts`). → `next build` sẽ lỗi "Module not found: recharts".
  - **Cần chạy:** `npm install` ở root (hoặc `cd apps/web-client && npm install`). Mình (AI_1) đã thử nhưng bị permission classifier chặn — cần HUMAN chạy. → REQ-OPS-002.
- **Phát hiện điều hướng:** route `/leaderboard` đã tạo nhưng KHÔNG có link nào trỏ tới (người dùng không thể vào). → Đã thêm mục "Bảng xếp hạng" + icon Trophy vào sidebar trái trong `(main)/layout.tsx`.
- **Lưu ý:** `(main)/profile/page.tsx` vẫn là mock tĩnh (route demo cũ). Hồ sơ thật đang ở `/profile/me` (đã nối UserContext + API). `/profile` không nằm trong luồng active; chưa xóa để tránh phá link cũ.
- **Quét hardcode localhost:** sạch (0 match trong `src/`).
- **Files sửa:** `apps/web-client/src/app/(main)/layout.tsx` (thêm nav leaderboard + icon Trophy).
- **Chưa verify được `next build`** vì thiếu `node_modules/recharts` (bị chặn cài). Sau khi HUMAN chạy `npm install`, cần chạy lại `next build` để xác nhận xanh.

## Đợt 11 (2026-06-07) — REQ-FE-UI-003: tích xanh SVG inline (AI_1)
HUMAN (qua AI_2) yêu cầu thay tích xanh `<img src="/verified-badge.png">` bằng SVG inline với asset chính xác HUMAN chỉ định (path Facebook chuẩn).
- **NEW `apps/web-client/src/app/components/VerifiedBadge.tsx`:** component dùng chung, pure SVG (an toàn Server Component, không cần 'use client'), props `size` + `className`, `aria-label` + `<title>` cho a11y. Dùng đúng path HUMAN cung cấp, KHÔNG tự thiết kế lại.
- **CSS `.verified-badge`** trong globals.css: màu `#1877f2` (Facebook blue qua `currentColor`), scale theo `font-size` (`width/height: 1em`), `focus-visible` outline.
- **Thay 5 chỗ** `<img>` → `<VerifiedBadge>`: feed `(main)/page.tsx` (16px), `profile/[id]/page.tsx` (header 28px + post 16px), `profile/me/page.tsx` (header 28px + post 16px). Giữ nguyên điều kiện hiển thị `role==='ADMIN' || isVerified || fullName.includes('✓')`.
- **Xóa** `public/verified-badge.png` (grep còn 0 ref).
- **Lợi ích:** sắc nét mọi DPI, đổi màu/size bằng CSS, bỏ 1 HTTP request ảnh, hết hack `mix-blend-multiply contrast-[1.1]`.
- **Verify:** `npx next build` exit 0, "Compiled successfully in 8.8s", 22/22 routes. Đóng REQ-FE-UI-003.
- **Files:** NEW VerifiedBadge.tsx; MOD globals.css, (main)/page.tsx, profile/[id]/page.tsx, profile/me/page.tsx; DEL public/verified-badge.png.

## Đợt 10 (2026-06-07) — Đóng REQ-FE-FIX-002 (hydration mismatch) (AI_1)
AI_2 trong phiên bug-hunt phát hiện hydration warning ở `apps/web-client/src/app/layout.tsx`: themeBootstrap (Đợt 8) thêm `class="dark"` vào `<html>` pre-paint, nhưng `suppressHydrationWarning` lại đặt nhầm ở `<body>` → React cảnh báo mismatch class trên `<html>`.
- **Fix (1 dòng):** chuyển `suppressHydrationWarning` từ `<body>` lên `<html>`. Đây là pattern chuẩn cho theme-bootstrap script trong Next.js App Router.
- **KHÔNG đổi:** logic themeBootstrap, ThemeToggle, các CSS token. Chỉ chuyển vị trí 1 attribute.
- **Verify:** `npx next build` → exit 0, "✓ Compiled successfully in 15.2s", 22/22 routes.
- **Files:** `apps/web-client/src/app/layout.tsx`.
- Đóng REQ-FE-FIX-002 trong `rules/TASK_QUEUE.md`. Cảm ơn AI_2 đã bắt đúng — phiên Đợt 8 của tôi đặt sai vị trí.

## Đợt 9 (2026-06-07) — Polish độ tương phản chữ: marketplace + materials (AI_1)
Xử lý điểm "Lưu ý cho phiên sau" của Đợt 8: 2 trang này thừa kế class màu dark-era (`text-gray-100/200/300/400/500/600`, `text-white` cho tiêu đề modal, `bg-[#111827]`, tab active `bg-white text-[#0f172a]`) trên nền glass sáng → chữ nhạt ở light mode, và tab active sẽ chìm ở dark mode.

**Sửa (chỉ FE):**
- Remap toàn bộ class chữ dark-era sang token theme-aware:
  - `text-gray-100/200` → `text-token-primary`
  - `text-gray-300/400` → `text-token-secondary`
  - `text-gray-500` → `text-token-tertiary` (materials), `text-gray-600`(★ rỗng) → `text-slate-300` cho hợp nền sáng
  - tiêu đề modal materials `text-white` → `text-token-primary`
- `<select>` dropdown: bỏ `bg-[#111827]` cứng → `surface-subtle` (token).
- Tab active materials: `bg-white text-[#0f172a]` → `bg-indigo-600 text-white` (đọc tốt ở cả 2 mode, đồng bộ accent).
- Giữ nguyên: badge giá `bg-[#0f172a]/80 text-green-400` (badge tối cố ý trên ảnh), các nút có nền màu (`text-white` đúng), gradient tiêu đề trang, accent xanh/tím.

**Verify:** `npx next build` → exit 0, "✓ Compiled successfully in 19.2s", TypeScript PASS, 22/22 static pages.

**Files:** `apps/web-client/src/app/(main)/marketplace/page.tsx`, `apps/web-client/src/app/(main)/materials/page.tsx`.
**KHÔNG đụng:** backend/schema/contract/infra.

## Đợt 8 (2026-06-07) — UI polish toàn cục: design tokens + dark mode + skeleton/empty (AI_1)
Bạn yêu cầu "nâng cấp UI". Đã làm polish toàn cục theo từng lớp:

**Nền tảng (`apps/web-client/src/app/globals.css`):**
- Hệ design token mở rộng: thêm `--bg-subtle/--bg-subtle-2`, shadow scale (`--shadow-sm/md/lg`), radii scale, motion easing (`--ease-out/--ease-spring`), skeleton tokens.
- **Dark mode đầy đủ qua `html.dark`:** tất cả biến (--bg-base, --card-bg, --text-*, --accent-*, --mesh-*) có giá trị light + dark; `.glass`, `.glass-input`, `.glass-btn`, `.neon-text` đều theme-aware nhờ trỏ vào biến.
- **Tài rrick "remap utility":** vì các page hardcode Tailwind colors (text-slate-800, bg-white, ...), thay vì sửa hàng nghìn class `dark:` rải rác, remap đúng bộ class đang dùng dưới `html.dark .x` (unlayered → win cascade với layered Tailwind reset). Phủ dark mode toàn app mà không phải sửa từng phần tử.
- Skeleton shimmer + utility entrance (`animate-fade-rise`, `animate-pop-in`), tôn trọng `prefers-reduced-motion`.

**Dark mode toggle (no flash):**
- `apps/web-client/src/app/layout.tsx`: thêm inline `<script>` chạy trước paint, đọc `localStorage.theme` (fallback `prefers-color-scheme`) và stamp `class="dark"` lên `<html>` → không flash trắng khi reload trong chế độ tối.
- `apps/web-client/src/app/components/ThemeToggle.tsx` (NEW): nút icon mặt trời/mặt trăng cạnh notifications trên navbar, persist qua `localStorage`, suppress hydration mismatch bằng `mounted` state.
- Đặt vào navbar `(main)/layout.tsx` (ngay trước MessagesDropdown).

**Component dùng chung (NEW):**
- `apps/web-client/src/app/components/Skeleton.tsx`: `Skeleton`, `SkeletonText`, `SkeletonCard` (post), `SkeletonGridCard` (marketplace/materials), `SkeletonRow` (leaderboard/list).
- `apps/web-client/src/app/components/EmptyState.tsx`: empty state nhất quán (icon + title + description + action), animate-fade-rise + animate-float trên icon.

**Áp dụng vào các trang:** thay loading text "Đang tải..." + empty placeholders rời rạc bằng skeleton/EmptyState chuẩn:
- Feed (`(main)/page.tsx`): SkeletonCard ×2 khi load + EmptyState khi rỗng
- Marketplace (`(main)/marketplace/page.tsx`): SkeletonGridCard ×6 + EmptyState
- Materials (`(main)/materials/page.tsx`): SkeletonGridCard ×6 + EmptyState (cả tab "Tất cả" lẫn tab "Đã lưu")
- Groups (`(main)/groups/page.tsx`): SkeletonGridCard ×4 + EmptyState
- Events (`(main)/events/page.tsx`): SkeletonGridCard ×4 + EmptyState
- Leaderboard (`(main)/leaderboard/page.tsx`): SkeletonRow ×8 + EmptyState
- Saved (`(main)/saved/page.tsx`): SkeletonCard ×2 + EmptyState

**Không đụng:** backend, schema, API contract, infra. Chỉ FE (apps/web-client/**).

**Verify:** `npx next build` → exit 0, "Compiled successfully in 20.9s", TypeScript PASS, **22/22 routes** prerender đầy đủ (gồm `/leaderboard`, `/admin/*`, `/profile/[id]`, `/saved`).

**Files đã thay đổi:**
- NEW: `apps/web-client/src/app/components/ThemeToggle.tsx`
- NEW: `apps/web-client/src/app/components/Skeleton.tsx`
- NEW: `apps/web-client/src/app/components/EmptyState.tsx`
- MOD: `apps/web-client/src/app/globals.css` (gấp đôi, chuyển sang token-driven + dark mode + utility remap)
- MOD: `apps/web-client/src/app/layout.tsx` (no-flash script)
- MOD: `apps/web-client/src/app/(main)/layout.tsx` (gắn ThemeToggle)
- MOD: `apps/web-client/src/app/(main)/page.tsx` (skeleton/empty feed)
- MOD: `apps/web-client/src/app/(main)/marketplace/page.tsx`
- MOD: `apps/web-client/src/app/(main)/materials/page.tsx`
- MOD: `apps/web-client/src/app/(main)/groups/page.tsx`
- MOD: `apps/web-client/src/app/(main)/events/page.tsx`
- MOD: `apps/web-client/src/app/(main)/leaderboard/page.tsx`
- MOD: `apps/web-client/src/app/(main)/saved/page.tsx`

## 2. Trạng thái Hiện tại (Đang làm gì)
- Đã hoàn tất REQ-FE-POLISH-005: Tích hợp Portfolio (CRUD + UI), thêm/cập nhật hiệu ứng Animation, đổi emoji sang icon Lucide-react. Đã review và build thành công. Trang web hoàn thiện.

## Đợt 7 (2026-06-07) — Vá lỗi type-check `profile/[id]` + xác nhận build xanh (AI_1)
- **Phát hiện hồi quy:** `next build` thực tế FAIL ở `apps/web-client/src/app/(main)/profile/[id]/page.tsx:134` — TS2531 "'currentUser' is possibly 'null'". Trạng thái "Đợt 6 PASS" KHÔNG còn đúng (đã chạy lại để verify thay vì tin status cũ).
- **Root cause:** guard `currentUser?.id !== params.id` không narrow `currentUser` về non-null (vì `undefined !== "abc"` vẫn true) → bên trong block, các nút Kết bạn / Hủy lời mời / Chấp nhận / Hủy kết bạn dùng `currentUser.id` không an toàn.
- **Fix (1 dòng, line 129):** đổi `{currentUser?.id !== params.id && (` → `{currentUser && currentUser.id !== params.id && (`. Narrow đúng cách → các onClick closure dùng `currentUser.id` đều type-safe. Hành vi không đổi: nút chỉ hiện khi có user đăng nhập VÀ không phải hồ sơ của chính mình (đó vốn là intent ban đầu — block không có ý nghĩa cho khách).
- **Verify:** `npx next build` → exit 0, "Compiled successfully", TypeScript PASS, 22 routes build (`/`, `/admin/*`, `/leaderboard`, `/profile/[id]`, `/profile/me`, `/saved`, `/settings`, `/groups`, `/marketplace`, `/materials`, `/events`, `/mentors`, `/chat`, `/ai`, `/login`, `/register`, ...).
- **Files đã sửa (FE only):** `apps/web-client/src/app/(main)/profile/[id]/page.tsx`.
- **KHÔNG sửa:** backend, schema, API contract, gateway, infra. Chỉ thay 1 biểu thức điều kiện trong FE.
- **Backend status (đối chiếu, không sửa):** REQ-BE-FIX-001 đã được AI_2 giải quyết — `apps/api-gateway/src/main.ts` không còn truyền `globalPrefix: 'api/v1'` (giờ chỉ gọi `bootstrapService({ serviceName, port })`). Trong `packages/common/src/bootstrap.ts`, `globalPrefix` thành optional. → Gateway match trực tiếp `/users/...`, `/study-groups/...` đúng API_CONTRACT.md. Có thể đóng REQ-BE-FIX-001 ở phía AI_2.
- **Còn chặn:** chỉ REQ-OPS-001 (Docker/Postgres để E2E test). Không có việc FE nào dang dở.

## Đợt 6 (2026-06-06) — npm install + next build PASS (AI_1)
- ✅ Chạy được `npm install` ở root: `recharts@3.8.1` được hoist vào `node_modules` root (workspace), resolve OK. → **REQ-OPS-002 ĐÓNG.**
- ✅ `next build` **PASS** — `.next/BUILD_ID` + `server/` + `static/` sinh đầy đủ. Tất cả route build artifact: index, groups, materials, marketplace, events, saved, profile, profile/me, **leaderboard**, **admin**, ai, chat, login, register.
- **Môi trường:** node v24.15 + npm 11.12 OK. **KHÔNG có `psql` lẫn `docker`** → không bật được Postgres/Redis ở máy này (đúng như REQ-OPS-001). Backend services không chạy được tới khi có DB.
- **Còn chặn để test E2E:**
  - REQ-OPS-001: cần Docker hoặc Postgres local (máy hiện chưa có cái nào).
  - REQ-BE-FIX-001: gateway `globalPrefix: 'api/v1'` lệch với FE/contract → cần AI_2 sửa (AI_2 đang lỗi). Chưa đụng theo protocol.
- **Kết luận:** Frontend build sạch, sẵn sàng. Việc còn lại thuần hạ tầng + 1 fix backend, không phải lỗi frontend.
