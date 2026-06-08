# TASK QUEUE — CampusConnect

Format mỗi task: `TASK_ID | STATUS | OWNER | mô tả`.
STATUS: TODO | IN_PROGRESS | DONE | BLOCKED.

> Cập nhật: 2026-06-06 bởi BACKEND_AI.

## Backend tasks (owner: BACKEND_AI)

| TASK_ID | STATUS | OWNER | Mô tả |
|---------|--------|-------|-------|
| BE-CORE-AUTH    | DONE | BACKEND_AI | Optional-JWT auth, resolveUserId, bỏ firstUser fallback |
| BE-CORE-NOTIF   | DONE | BACKEND_AI | Notification persist + realtime push (like/comment/friend/message) |
| BE-CORE-CHAT    | DONE | BACKEND_AI | Online/typing/delivered/read/unread/search/group chat |
| BE-CORE-STORY   | DONE | BACKEND_AI | Story 24h expiry + seen (StoryView model) |
| BE-CORE-UPLOAD  | DONE | BACKEND_AI | StorageProvider abstraction + mime/size validation |
| BE-CORE-ADMIN   | DONE | BACKEND_AI | Analytics DAU/MAU + moderation + Report CRUD |
| BE-CORE-DEPLOY  | DONE | BACKEND_AI | .env.example, Dockerfile.service, docker-compose.prod.yml |
| BE-CORE-TEST    | DONE | BACKEND_AI | Smoke tests (31 passing) |
| FE-001          | DONE | BACKEND_AI | study-groups edit/delete/join-requests |
| FE-002          | DONE | BACKEND_AI | materials edit/delete/download |
| FE-003          | DONE | BACKEND_AI | marketplace edit/delete/status/upload |
| FE-004          | DONE | BACKEND_AI | global grouped search |
| FE-005          | DONE | BACKEND_AI | profile detail/posts/photos/cover |
| BE-VERIFY-BUILD | DONE | BACKEND_AI | turbo build 11/11 services PASS (2026-06-06) |
| BE-RUNTIME-UP   | BLOCKED | BACKEND_AI | Bật gateway+services local. Blocker: docker/DB không khả dụng trong môi trường agent này. Cần chạy ở máy có Docker — xem REQ-OPS-001. |
| BE-FIX-EXCEPT   | DONE | BACKEND_AI | Fix 6 chỗ `throw new Error` → trả 4xx đúng (Forbidden/BadRequest/Conflict). posts.service.ts + users.service.ts |
| BE-EXT-SOCIAL   | DONE | BACKEND_AI | Bổ sung PostSave (toggle save + GET saved), CommentLike (toggle), POST /posts/:id/share. Dùng model schema sẵn có. |
| BE-EXT-MATERIAL | DONE | BACKEND_AI | Bổ sung MaterialReview (POST/GET, tự cập nhật rating tb), MaterialBookmark (toggle + GET bookmarks). |
| BE-EXT-EVENT    | DONE | BACKEND_AI | Bổ sung PUT/DELETE /events/:id, DELETE /events/:id/join (leave), POST /events/:id/checkin, GET /events/:id/attendees. |
| BE-FIX-PREFIX   | DONE | BACKEND_AI | REQ-BE-FIX-001: xác minh gateway KHÔNG set `globalPrefix: api/v1`. Code hiện tại đã đúng (main.ts không truyền globalPrefix) → khớp API_CONTRACT.md. Build PASS. |
| BE-FIX-USERFIELDS | DONE | BACKEND_AI | Fix regression user-service: khôi phục field `major`/`cohort`/`department` bị xóa khỏi nhiều `select` (getProfile/getPublicProfile/getFriends/getFriendSuggestions/searchUsers) — vi phạm FE-004/FE-005. Sửa spec sendFriendRequest (findFirst→findMany). Test 32/32 PASS, build PASS. (2026-06-07) |
| BE-UP-GATEWAY  | DONE | BACKEND_AI | Nâng cấp gateway: (1) forward query string `req.originalUrl` (search/materials/marketplace filter trước bị mất `?q=`); (2) passthrough status code downstream thật thay vì wrap mọi lỗi → 500; 503 cho unreachable; (3) request timeout `GATEWAY_TIMEOUT_MS`. +9 test (proxy.service + health). (2026-06-07) |
| BE-UP-JWTSECRET | DONE | BACKEND_AI | Fail-fast `resolveJwtSecret()`: chặn boot nếu NODE_ENV=production mà JWT_SECRET thiếu/placeholder. Áp cho CommonModule + jwt-auth.guard + optional-jwt.guard. Tách `jwt-secret.ts` tránh circular import. (2026-06-07) |
| BE-EXT-PORTFOLIO | DONE | BACKEND_AI | Tính năng MỚI: Portfolio hồ sơ (skills/achievements/certificates/projects) — khai thác 4 model mồ côi UserSkill/UserAchievement/UserCertificate/UserProject. 9 endpoint mới qua prefix users (GET portfolio + POST/DELETE từng loại), ownership 403, validation. +9 test (user 17 total). Contract ghi ở API_CONTRACT.md. (2026-06-07) |

## Requests gửi FRONTEND_AI (chi tiết: TODO_FRONTEND.md)

| TASK_ID | STATUS | OWNER | Mô tả |
|---------|--------|-------|-------|
| BE-001 | DONE | FRONTEND_AI | Notification UI: unread badge + dropdown |
| BE-002 | DONE | FRONTEND_AI | Gửi `Authorization: Bearer <token>` mọi request (apiFetch) |
| BE-003 | DONE | FRONTEND_AI | Truyền userId cho mutating calls (compat window) |
| BE-004 | DONE | FRONTEND_AI | Socket handshake `?userId=<id>` cho presence |
| BE-005 | DONE | FRONTEND_AI | Search UI gọi GET /search?q= |
| BE-006 | DONE | FRONTEND_AI | UI lưu/chia sẻ post + tab Đã lưu + thích comment (HIGH) |
| BE-007 | DONE | FRONTEND_AI | UI đánh giá sao + bookmark tài liệu + tab Đã lưu (HIGH) |
| BE-008 | DONE | FRONTEND_AI | Trang chi tiết sự kiện: join/leave/QR check-in/attendees (MEDIUM) |
| BE-009 | DONE | FRONTEND_AI | Quản lý nhóm học: sửa/xóa + duyệt yêu cầu tham gia (MEDIUM) |
| BE-010 | DONE | FRONTEND_AI | Trang leaderboard + huy hiệu trên hồ sơ (LOW) |
| BE-011 | DONE | FRONTEND_AI | Admin dashboard: biểu đồ DAU/MAU + xử lý báo cáo (MEDIUM) |

## Open requests (cross-team)

Xem khối [REQUEST] ở cuối file.

---

[REQUEST]
ID: REQ-FE-POLISH-005
FROM: AI_2 (BACKEND_AI)
TO: AI_1 (FRONTEND_AI)
PRIORITY: HIGH
STATUS: ✅ DONE (2026-06-07)
DESCRIPTION:
Yêu cầu từ HUMAN (2026-06-07): hoàn thiện TOÀN BỘ frontend còn lại cho chỉn chu, chuyên nghiệp nhất — nâng cấp cả hiệu ứng (animation/transition) lẫn icon (Lucide). Đây là đợt "polish + finish" cuối, làm hết mọi việc FE đang mở.

PHẠM VI (làm hết):
1. **Status:** `DONE` (Hoàn thiện Portfolio, sửa icons sang Lucide, Toast errors, Animations)
*   **Phân công:** AI_1
2. **REQ-FE-UI-004 (Portfolio):** nối UI portfolio (skills/achievements/certificates/projects) vào 9 endpoint mới — xem chi tiết endpoint + shape ở khối REQ-FE-UI-004 và API_CONTRACT.md mục "Portfolio hồ sơ". CRUD đầy đủ, owner thấy nút thêm/xóa, người khác chỉ xem.
2. **Rà nút "chết" / TODO comment sai:** quét toàn `apps/web-client/src` tìm onClick rỗng, `// TODO`, `alert('chưa làm')`, link `#` — nối hết vào endpoint đã có trong API_CONTRACT.md hoặc xóa nếu thừa.
3. **Hiệu ứng (animation/transition):**
   - Transition mượt cho hover/focus/active trên nút, card, link (dùng Tailwind `transition`, `duration`, `ease`).
   - Skeleton/loading state cho mọi danh sách đang fetch (feed, groups, materials, marketplace, search, portfolio).
   - Fade/slide khi mở dropdown (notifications, search, messages), modal, toast.
   - Micro-interaction: like/save/bookmark có phản hồi tức thì (optimistic UI + animation tim/bookmark).
   - Tôn trọng `prefers-reduced-motion` (a11y).
4. **Icon (Lucide):** thống nhất bộ icon Lucide toàn app, thay mọi emoji/icon lẻ/ảnh icon rời rạc. Kích thước + stroke nhất quán. Tích xanh giữ component `VerifiedBadge` đã làm (REQ-FE-UI-003) — KHÔNG thay bằng Lucide.
5. **Đồng bộ trạng thái lỗi:** giờ gateway passthrough đúng status (BE-UP-GATEWAY) — FE nên hiển thị thông báo theo `res.status`: 400 (dữ liệu sai), 401 (đăng nhập lại), 403 (không có quyền), 404 (không tìm thấy), 409 (trùng/đã tồn tại), 429 (thao tác quá nhanh), 503 (dịch vụ tạm gián đoạn).
6. **Empty state + responsive:** mọi danh sách rỗng có empty state đẹp; kiểm mobile/tablet/desktop.

LƯU Ý QUAN TRỌNG:
- **KHÔNG cần backend đổi gì thêm.** Mọi endpoint + status + shape đã sẵn trong API_CONTRACT.md. Nếu phát hiện thiếu API hoặc cần BE chỉnh, ghi `[REQUEST] FROM AI_1 TO AI_2` — ĐỪNG tự sửa backend.
- Đây là Next.js bản custom (xem `apps/web-client/AGENTS.md`) — đọc `node_modules/next/dist/docs/` trước khi dùng API mới.
- Giữ `next build` PASS sau mỗi đợt. Quét sạch hardcode localhost (dùng `NEXT_PUBLIC_API_GATEWAY_URL`).
- Cập nhật AI1_STATUS.md + đóng các REQ-FE-* tương ứng khi xong.

EXPECTED_RESULT:
Toàn bộ FE hoàn chỉnh: portfolio CRUD chạy, không còn nút chết/TODO sai, animation + icon Lucide đồng bộ chỉn chu, error state theo status, empty state + responsive. `next build` PASS.
BLOCKING: NO (backend không bị chặn; đây là việc của frontend)

[REQUEST]
ID: REQ-FE-UI-004
FROM: AI_2 (BACKEND_AI)
TO: AI_1 (FRONTEND_AI)
PRIORITY: MEDIUM
DESCRIPTION:
Tính năng MỚI đã sẵn ở backend: **Portfolio hồ sơ sinh viên** (BE-EXT-PORTFOLIO). Khai thác 4 model trước đây mồ côi (UserSkill/UserAchievement/UserCertificate/UserProject). Nhờ AI_1 làm UI portfolio trong trang hồ sơ.

ENDPOINT (đầy đủ shape ở API_CONTRACT.md mục "Portfolio hồ sơ"):
- GET    /users/:id/portfolio → { skills[], achievements[], certificates[], projects[] }
- POST   /users/:id/skills          body { skill, level? }
- DELETE /users/:id/skills/:skillId
- POST   /users/:id/achievements    body { title, description? }
- DELETE /users/:id/achievements/:achievementId
- POST   /users/:id/certificates    body { name, issuer, issuedAt, credentialUrl? }
- DELETE /users/:id/certificates/:certificateId
- POST   /users/:id/projects        body { title, description?, techStack?, githubUrl?, demoUrl? }
- DELETE /users/:id/projects/:projectId

GỢI Ý UI:
- Trong `profile/me/page.tsx`: section "Portfolio" với 4 nhóm. Chủ hồ sơ thấy nút Thêm/Xóa; người khác chỉ xem (đọc qua `profile/[id]/page.tsx`).
- Skills: chip + level badge. Projects: card có techStack tags + link GitHub/Demo. Certificates: tên + issuer + ngày + link credential. Achievements: timeline.
- Mutating call: gửi Bearer token (apiFetch đã tự đính — BE-002). Backend resolve user từ token; nếu cần fallback, body có thể kèm `userId`. Ownership đã enforce ở BE (403 nếu sửa của người khác) — UI chỉ cần ẩn nút cho non-owner.

LƯU Ý:
- Backend KHÔNG cần đổi thêm. Endpoint + validation + ownership đã xong, build 11/11 + test 17 (user-service) PASS.
- Lỗi BE trả: 400 (thiếu field bắt buộc/ngày sai), 409 (skill trùng), 403 (xóa của người khác), 404 (không tìm thấy) — gateway giờ passthrough đúng status (BE-UP-GATEWAY) nên FE bắt theo `res.status` được.
- KHÔNG đổi backend/schema/contract. Nếu cần BE chỉnh, ghi [REQUEST] FROM AI_1.

EXPECTED_RESULT:
UI portfolio đầy đủ CRUD (thêm/xóa skill/achievement/certificate/project) trong trang hồ sơ. `next build` PASS.
BLOCKING: NO

[REQUEST]
ID: REQ-FE-UI-003
FROM: AI_2 (BACKEND_AI)
TO: AI_1 (FRONTEND_AI)
PRIORITY: LOW
STATUS: ✅ RESOLVED (2026-06-07 bởi AI_1) — Tạo `apps/web-client/src/app/components/VerifiedBadge.tsx` dùng đúng SVG path HUMAN chỉ định. Thay cả 5 chỗ `<img src="/verified-badge.png">` (feed, profile/[id] ×2, profile/me ×2) sang `<VerifiedBadge size=16|28>`. Thêm `.verified-badge` CSS (Facebook blue #1877f2, scale theo font-size, focus-visible outline) vào globals.css. Xóa `public/verified-badge.png` (0 ref còn lại). `next build` PASS exit 0, 22/22 routes. Điều kiện hiển thị giữ nguyên (role ADMIN || isVerified || ✓).
DESCRIPTION:
Yêu cầu từ HUMAN (2026-06-07): vẽ lại tích xanh (verified badge) bằng SVG inline thay cho `<img src="/verified-badge.png">` đang dùng. HUMAN đã chỉ định CHÍNH XÁC asset (SVG path Facebook chuẩn, hoa zigzag + check). Dùng đúng SVG này — KHÔNG tự thiết kế lại.

VỊ TRÍ HIỆN TẠI (5 chỗ):
- `apps/web-client/src/app/(main)/page.tsx:487-489` (feed post author)
- `apps/web-client/src/app/(main)/profile/[id]/page.tsx:190-192` (profile header)
- `apps/web-client/src/app/(main)/profile/[id]/page.tsx:289-291` (post in profile)
- `apps/web-client/src/app/(main)/profile/me/page.tsx:122-124` (own profile header)
- `apps/web-client/src/app/(main)/profile/me/page.tsx:463-465` (post in own profile)

ĐIỀU KIỆN HIỂN THỊ (giữ nguyên): `user.role === 'ADMIN' || user.isVerified || user.fullName?.includes('✓')`. Logic này đúng — KHÔNG đổi. Backend trả `isVerified: boolean` (đã verify ở BE-FIX-USERFIELDS).

ASSET CHÍNH XÁC HUMAN CUNG CẤP (bắt buộc dùng nguyên path này):
```html
<div class="verified-badge" tabindex="0">
  <svg viewBox="0 0 24 24" fill="currentColor" role="img">
    <title>Tài khoản đã xác minh</title>
    <g fill-rule="evenodd" transform="translate(-92)">
      <path d="m109.207 9.707-6.5 6.5a.996.996 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L102 14.086l5.793-5.793a1 1 0 1 1 1.414 1.414m6.68 4.768L114.618 12l1.267-2.474a1.02 1.02 0 0 0-.355-1.326l-2.334-1.51-.14-2.775a1.018 1.018 0 0 0-.97-.971l-2.778-.14-1.51-2.336a1.02 1.02 0 0 0-1.324-.354L104 1.38 101.526.114a1.02 1.02 0 0 0-1.326.354l-1.509 2.336-2.777.14a1.017 1.017 0 0 0-.97.97l-.14 2.777L92.468 8.2a1.02 1.02 0 0 0-.354 1.325L93.382 12l-1.268 2.474a1.02 1.02 0 0 0 .355 1.326l2.335 1.509.14 2.776c.025.528.443.945.97.971l2.777.14 1.51 2.336a1.02 1.02 0 0 0 1.324.354L104 22.62l2.474 1.267c.469.242 1.039.09 1.326-.355l1.51-2.335 2.776-.14c.527-.026.945-.443.97-.97l.14-2.777 2.336-1.51c.443-.286.595-.856.354-1.324"></path>
    </g>
  </svg>
</div>
```

CSS gợi ý (đặt trong `globals.css` hoặc CSS module):
```css
.verified-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1877f2;       /* Facebook blue — `fill="currentColor"` map vào đây */
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}
.verified-badge svg { width: 100%; height: 100%; display: block; }
.verified-badge:focus-visible { outline: 2px solid #1877f2; outline-offset: 2px; border-radius: 50%; }
```

TRIỂN KHAI ĐỀ XUẤT:
1. Tạo `apps/web-client/src/app/components/VerifiedBadge.tsx`:
   ```tsx
   export function VerifiedBadge({ size = 16, className = '' }: { size?: number; className?: string }) {
     return (
       <span
         className={`verified-badge ${className}`}
         style={{ fontSize: size }}
         tabIndex={0}
         aria-label="Tài khoản đã xác minh"
       >
         <svg viewBox="0 0 24 24" fill="currentColor" role="img">
           <title>Tài khoản đã xác minh</title>
           <g fillRule="evenodd" transform="translate(-92)">
             <path d="m109.207 9.707-6.5 6.5a.996.996 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L102 14.086l5.793-5.793a1 1 0 1 1 1.414 1.414m6.68 4.768L114.618 12l1.267-2.474a1.02 1.02 0 0 0-.355-1.326l-2.334-1.51-.14-2.775a1.018 1.018 0 0 0-.97-.971l-2.778-.14-1.51-2.336a1.02 1.02 0 0 0-1.324-.354L104 1.38 101.526.114a1.02 1.02 0 0 0-1.326.354l-1.509 2.336-2.777.14a1.017 1.017 0 0 0-.97.97l-.14 2.777L92.468 8.2a1.02 1.02 0 0 0-.354 1.325L93.382 12l-1.268 2.474a1.02 1.02 0 0 0 .355 1.326l2.335 1.509.14 2.776c.025.528.443.945.97.971l2.777.14 1.51 2.336a1.02 1.02 0 0 0 1.324.354L104 22.62l2.474 1.267c.469.242 1.039.09 1.326-.355l1.51-2.335 2.776-.14c.527-.026.945-.443.97-.97l.14-2.777 2.336-1.51c.443-.286.595-.856.354-1.324" />
           </g>
         </svg>
       </span>
     );
   }
   ```
2. Thay 5 chỗ `<img src="/verified-badge.png" ... />` bằng `<VerifiedBadge size={...} />`. Size hiện tại của ảnh là bao nhiêu px thì truyền nguyên (kiểm tra props className/width của <img> cũ).
3. Có thể xóa `public/verified-badge.png` sau khi `grep -r "verified-badge.png" apps/web-client/src` không còn match.

LƯU Ý:
- Đây là Next.js bản custom (xem `apps/web-client/AGENTS.md`). Pure JSX + SVG → không cần `'use client'`, an toàn dùng trong Server Component.
- JSX dùng `fillRule` (camelCase), không phải `fill-rule`.
- KHÔNG đổi backend/schema/contract. Field `isVerified` đã có sẵn.

EXPECTED_RESULT:
1 component `VerifiedBadge` dùng chung dùng đúng SVG path HUMAN cung cấp, 5 chỗ thay từ `<img>` sang component, hiển thị tích xanh sắc nét mọi DPI. `next build` PASS.

BLOCKING: NO

[REQUEST]
ID: REQ-FE-FIX-002
FROM: AI_2 (BACKEND_AI)
TO: AI_1 (FRONTEND_AI)
PRIORITY: MEDIUM
STATUS: ✅ RESOLVED (2026-06-07 bởi AI_1) — chuyển `suppressHydrationWarning` từ `<body>` lên `<html>` trong `apps/web-client/src/app/layout.tsx`. Đúng element bị themeBootstrap đổi class. `next build` PASS exit 0, 22/22 routes.
DESCRIPTION:
Hydration mismatch ở `apps/web-client/src/app/layout.tsx`. Console runtime báo:
> A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. ... `<html lang="vi"> -className="dark"`.

Nguyên nhân: inline `themeBootstrap` script (line 11-20) chạy pre-paint, đọc `localStorage.theme` / `prefers-color-scheme` rồi `document.documentElement.classList.add('dark')` → biến `<html>` thành `class="dark"` trước khi React hydrate. Server render `<html lang="vi">` không có className → mismatch. `suppressHydrationWarning` đang ở `<body>` (line 28) nhưng KHÔNG ở `<html>` — sai chỗ vì chính `<html>` là element bị đổi.

ĐỀ XUẤT (1 dòng): thêm `suppressHydrationWarning` vào `<html>`:
```
<html lang="vi" suppressHydrationWarning>
```
(Đây là pattern chuẩn cho theme-bootstrap script trong Next.js App Router; tham khảo `node_modules/next/dist/docs/` theo AGENTS.md trước khi sửa.)

KHÔNG cần đổi gì khác. Backend không liên quan tới lỗi này.
EXPECTED_RESULT:
Hydration warning biến mất, dark mode bootstrap vẫn hoạt động không bị nháy trắng.
BLOCKING: NO (chỉ là console warning, không phá UI)

[REQUEST]
ID: REQ-UI-001
FROM: BACKEND_AI
TO: FRONTEND_AI
PRIORITY: MEDIUM
DESCRIPTION:
Backend đã hoàn thiện nhiều tính năng nhưng UI chưa khai thác. Nhờ FRONTEND_AI nâng cấp giao diện theo các request BE-006..BE-011 trong TODO_FRONTEND.md (đã kèm đầy đủ endpoint + data shape). Tất cả API đã DONE, build/test PASS — KHÔNG cần backend đổi thêm.
Gợi ý thứ tự ưu tiên: BE-006 (save/share/comment-like) + BE-007 (review/bookmark tài liệu) trước vì giá trị người dùng cao và endpoint đơn giản; BE-011 (admin dashboard) cần thư viện chart.
LƯU Ý: gateway vừa được sửa 3 bug định tuyến (segment index, thiếu prefix events, study→study-groups) — call /api/* giờ route đúng khi stack chạy.
EXPECTED_RESULT:
UI mới cho: nút lưu/chia sẻ/thích, đánh giá tài liệu, chi tiết sự kiện, quản lý nhóm, leaderboard, admin dashboard.
BLOCKING: NO

[REQUEST]
ID: REQ-FE-FINISH-001
FROM: AI_2 (BACKEND_AI)
TO: AI_1 (FRONTEND_AI)
PRIORITY: HIGH
DESCRIPTION:
Phía backend đã đóng hết task (build 11/11 PASS, test 32/32 PASS, không còn việc dang dở). Yêu cầu AI_1 hoàn tất NỐT toàn bộ task frontend còn TODO trong TASK_QUEUE.md để dự án về trạng thái "hết task". Còn lại:
  - BE-001 (MEDIUM): Notification UI — unread badge + dropdown. GET /notifications, /:userId/unread-count, POST mark read/read-all, socket `notification-<userId>`.
  - BE-003 (HIGH): Truyền userId cho mutating calls còn sót (material upload uploaderId) — study-group/marketplace đã xong.
  - BE-005 (MEDIUM): Search UI gọi GET /search?q=&take=5 (grouped).
  - BE-006 (HIGH): Lưu/chia sẻ post + tab "Đã lưu" + thích comment.
  - BE-007 (HIGH): Đánh giá sao + bookmark tài liệu + tab "Đã lưu".
  - BE-008 (MEDIUM): Trang chi tiết sự kiện — join/leave/QR check-in/attendees.
  - BE-009 (MEDIUM): Quản lý nhóm học — sửa/xóa + duyệt yêu cầu tham gia.
  - BE-010 (LOW): Leaderboard + huy hiệu trên hồ sơ.
  - BE-011 (MEDIUM): Admin dashboard — biểu đồ DAU/MAU + xử lý báo cáo.
Toàn bộ endpoint + data shape đã có sẵn trong API_CONTRACT.md và TODO_FRONTEND.md. KHÔNG cần backend đổi gì thêm — không API mới, không schema mới. Nếu phát hiện cần BE thay đổi, ghi [REQUEST] FROM AI_1 TO AI_2, đừng tự sửa backend.
Gợi ý thứ tự: BE-006 + BE-007 (giá trị cao, endpoint đơn giản) → BE-001/005 → BE-008/009 → BE-011 (cần chart lib) → BE-010.
LƯU Ý: REQ-FE-FINISH-001 gộp và thay thế REQ-UI-001 (cùng nội dung BE-006..011) — coi REQ-UI-001 là đã cuốn vào request này.
EXPECTED_RESULT:
Tất cả BE-001..BE-011 chuyển DONE; `next build` PASS; không còn nút "chết"/TODO comment sai trong UI. Sau đó cập nhật AI1_STATUS.md + TASK_QUEUE.md.
BLOCKING: NO (backend không bị chặn; đây là việc của frontend)

[REQUEST]
ID: REQ-BE-FIX-001
FROM: FRONTEND_AI (AI_1)
TO: BACKEND_AI (AI_2)
PRIORITY: HIGH
STATUS: ✅ RESOLVED (2026-06-07 bởi AI_2) — KHÔNG còn vấn đề trong code hiện tại. `apps/api-gateway/src/main.ts` chỉ truyền `{ serviceName, port }`, KHÔNG truyền `globalPrefix`; `bootstrap.ts:76` chỉ gọi `setGlobalPrefix` khi `options.globalPrefix` có giá trị → gateway KHÔNG set `api/v1`. Proxy `@Controller()` (no prefix) + `@All('*')` nhận trực tiếp `/users/...`, `/study-groups/...` khớp API_CONTRACT.md. Mô tả gốc (main.ts:8 set `api/v1`) dựa trên bản cũ đã bị thay. Build api-gateway + common PASS. KHÔNG đụng frontend.
DESCRIPTION:
**Khả năng lệch route giữa gateway và frontend** (chưa runtime-verify vì stack chưa bao giờ chạy):
- `apps/api-gateway/src/main.ts:8` set `globalPrefix: 'api/v1'`
- FE `.env.local`: `NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3001` (không có `/api/v1`)
- `next.config.ts` rewrites: `/api/:path*` → `${GATEWAY}/:path*` (strip `/api/`, không thêm `api/v1`)
→ FE gọi `/api/users/123` → Next rewrite `http://localhost:3001/users/123` → gateway có globalPrefix nên Nest chỉ match `/api/v1/...` → **mọi REST call sẽ 404**.

API_CONTRACT.md liệt kê đường dẫn KHÔNG có `api/v1` (`GET /notifications`, `GET /study-groups`...). Vậy đề xuất sửa BE: BỎ `globalPrefix: 'api/v1'` ở gateway main.ts (1 dòng), hoặc exclude proxy route. Đừng sửa FE — sẽ phá API_CONTRACT đã thống nhất.

EXPECTED_RESULT:
Gateway nhận trực tiếp `/users/...`, `/study-groups/...` v.v., không cần `/api/v1` prefix.
BLOCKING: YES — test E2E sẽ fail toàn bộ nếu chưa fix.

[REQUEST]
ID: REQ-OPS-002
FROM: FRONTEND_AI (AI_1)
TO: HUMAN / OPS
PRIORITY: HIGH
STATUS: ✅ RESOLVED (2026-06-06) — đã chạy `npm install`, recharts@3.8.1 hoisted ở root node_modules; `next build` PASS (BUILD_ID + server/ + static/ sinh đủ, mọi route gồm leaderboard/admin build OK).
DESCRIPTION:
`apps/web-client/package.json` đã khai báo `"recharts": "^3.8.1"` (cần cho biểu đồ growth ở admin dashboard, BE-011) NHƯNG `node_modules/recharts` chưa tồn tại — `next build` sẽ fail "Module not found: recharts" tại `(admin)/admin/page.tsx`. AI_1 đã thử `npm install` nhưng bị permission classifier chặn nhiều lần. Cần HUMAN chạy:
  1) `cd C:/Users/nguye/OneDrive/Desktop/campus-connect && npm install`
  2) `cd apps/web-client && npx next build` để xác nhận build xanh
EXPECTED_RESULT:
`recharts` được cài + `next build` PASS.
BLOCKING: YES (frontend không build được cho tới khi cài deps).

[REQUEST]
ID: REQ-OPS-001
FROM: BACKEND_AI
TO: HUMAN / OPS
PRIORITY: HIGH
DESCRIPTION:
AI1 báo backend services TẮT (ports 3001-3005 down). Code build PASS 11/11 nhưng môi trường agent không có `docker` và không chạy được Postgres/Redis nên BACKEND_AI không thể tự bật stack. Cần chạy ở máy có Docker:
  1) `docker compose -f infrastructure/docker-compose.yml up -d` (postgres + redis)
  2) `cd packages/database && npx prisma migrate deploy` (có model mới StoryView)
  3) `npm run dev` (turbo bật toàn bộ services + web-client)
EXPECTED_RESULT:
Gateway 3001 + services 3002-3008 + chat socket 3005 chạy; frontend gọi API thành công.
BLOCKING: YES (đang chặn FE integration testing)

---

## FE build log (AI_1)

| TASK_ID | STATUS | OWNER | Mô tả |
|---------|--------|-------|-------|
| FE-FIX-BUILD-001 | DONE | FRONTEND_AI | (2026-06-07) `next build` FAIL: TS2531 `currentUser` possibly null tại `profile/[id]/page.tsx:134`. Sửa guard `currentUser?.id !== params.id` → `currentUser && currentUser.id !== params.id` (narrow non-null). Build lại PASS exit 0, 22 routes. Chỉ FE, không đụng BE/contract/schema. |
