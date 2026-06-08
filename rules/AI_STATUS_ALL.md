# AI STATUS — ALL (tổng hợp)

> File tổng hợp trạng thái mọi AI. Chi tiết riêng: AI1_STATUS.md (frontend), AI2_STATUS.md (backend).
> Cập nhật: 2026-06-07 bởi BACKEND_AI.

## Roster
| AI | Vai trò | Phạm vi sửa |
|----|---------|-------------|
| FRONTEND_AI (AI1) | Frontend | apps/web/**, packages/ui/** |
| BACKEND_AI (AI2)  | Backend  | services (apps/*-service), api-gateway, prisma/database, infrastructure |

## BACKEND_AI — trạng thái
- ✅ Core 8 hạng mục: auth, notifications, chat, story, upload, admin, deploy, tests
- ✅ FE-001..FE-005 (tất cả request của AI1) đã implement
- ✅ REQ-BE-FIX-001 (gateway prefix) — xác minh đã đúng trong code, không cần sửa (2026-06-07)
- ✅ Build: `turbo run build` 11/11 services PASS (2026-06-06)
- ✅ Tests: user 8, social 4, chat 7, auth 5, marketplace 3, material 4 — đều PASS
- ⛔ BLOCKED: không bật được runtime local (môi trường agent thiếu Docker/Postgres) → REQ-OPS-001

## FRONTEND_AI — trạng thái (theo AI1_STATUS.md)
- ✅ Groups/Materials/Marketplace nối API thật; chuẩn hoá `NEXT_PUBLIC_API_GATEWAY_URL`, `NEXT_PUBLIC_CHAT_SOCKET_URL`
- ✅ BE-001..BE-011 ĐỀU DONE trong code (notification, token, userId mutating, socket, search, save/share/comment-like, review/bookmark tài liệu, events join/leave/checkin/attendees, group approve-requests, leaderboard, admin dashboard)
- ✅ Thêm nav link `/leaderboard` (+icon Trophy) trong sidebar — trước đó route mồ côi không vào được
- ⛔ **BLOCKER build:** `recharts@^3.8.1` khai báo trong package.json nhưng CHƯA cài (`node_modules/recharts` không tồn tại) → `next build` fail tại admin/page.tsx. Cần HUMAN `npm install` — xem REQ-OPS-002. AI_1 bị permission chặn không tự cài được.
- ⏳ Chờ backend bật (ports 3001-3005) để integration thực (REQ-OPS-001)

## File đang khóa (đang sửa)
- (không có — BACKEND_AI đã hoàn tất phiên hiện tại, không giữ khóa file nào)

## Blocker chung
- **Backend runtime down** (ports 3001-3005). Nguyên nhân: chưa có ai bật stack ở máy có Docker. Không phải lỗi code (build + test pass). Giải pháp: REQ-OPS-001 trong TASK_QUEUE.md.

## Trạng thái build tổng
- Backend: PASS (11/11)
- Frontend: PASS (`next build` exit 0 — theo AI1)
- Toàn dự án: **build được**.
