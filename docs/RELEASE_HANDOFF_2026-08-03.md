# CMC Network — Release handoff 2026-08-03

> Trạng thái: production đang chạy qua PM2; build và các suite liên quan đã đạt trong từng đợt sửa. Tài liệu này là bản bàn giao tổng hợp cho toàn bộ worktree trước khi push.

## 1. Phạm vi đã hoàn thành

### Pháp lý và consent

- Thêm Chính sách bảo mật, Điều khoản sử dụng và Khai báo dữ liệu.
- Thêm route công khai `/privacy`, `/terms`, `/data-declaration`.
- Liên kết pháp lý xuất hiện ở đăng ký, đăng nhập và trang cài đặt.
- Proxy cho phép truy cập các route pháp lý khi chưa đăng nhập.

### Authorization và bảo mật

- Khóa IDOR của user-service: danh tính mutation lấy từ JWT subject, không tin `userId` do client gửi.
- Bắt buộc JWT cho user, mentor, notification và toàn bộ controller CLB.
- Legacy notification route có `:userId` chỉ cho phép ID khớp JWT subject.
- Admin/reputation/report route áp dụng JWT, role guard và verified-user guard phù hợp.
- AI `/ask` và `/ask/stream` xác minh JWT, giới hạn input và quota.
- AuthProvider chờ Zustand hydrate; logout xóa token/cookie liên quan và xử lý session stale.
- Redis production fail-closed; rate limiter không fallback local khi Redis bắt buộc.

### Toàn vẹn dữ liệu và race condition

- Marketplace: atomic claim ngăn double-buy.
- Post reaction/legacy like: transaction, xử lý `P2002`, counter không âm.
- Comment like: transaction và conditional counter.
- Comment/reply: thực thi comment lock, quyền xem post, parent đúng post.
- Study group/event capacity: conditional reservation trong transaction.
- Mentor booking: advisory lock, state machine và completion idempotent.
- Club join approval: conditional claim request trước khi thêm member.
- Livestream: advisory lock theo host, ngăn nhiều stream `LIVE` đồng thời.
- Material upload/delete: cleanup storage khi DB/queue lỗi và soft-delete trước cleanup.

### Chat và realtime

- Message text/media có ACK timeout và trạng thái `FAILED`.
- Thêm retry cho message lỗi, giữ nội dung/file/reply target.
- Temp message ID tránh va chạm timestamp.
- LiveKit/livestream module và UI được bổ sung; backend có test liên quan.

### Notification

- API trả sender projection gồm avatar.
- Backfill `senderId` an toàn cho notification cũ có actor suy ra chắc chắn.
- Avatar fallback dùng chữ cái đầu; URL lỗi không còn hiện ảnh vỡ.
- Dropdown có loading skeleton, empty state, sticky header/footer, Escape close và ARIA semantics.
- Deep-link bao phủ:
  - `LIKE`, `COMMENT`, `MENTION`, `SHARE` → `/posts/{relatedId}`.
  - `FRIEND_REQUEST`, `FRIEND_ACCEPT` → `/friends`.
  - Notification không có target không tạo link giả.
- Click item vẫn đánh dấu đã đọc.

### Tối ưu avatar

- `avatarUrl` trở thành thumbnail WebP tối đa `160×160`, quality 76.
- `avatarOriginalUrl` là ảnh chi tiết WebP tối đa `1600×1600`, quality 84.
- Upload auto-rotate EXIF, giới hạn pixel decode và từ chối nội dung ảnh lỗi.
- Hai file được lưu và cập nhật DB atomically; lỗi giữa chừng được cleanup.
- Profile chỉ tải ảnh chi tiết khi người dùng nhấn avatar.
- Migration thêm `users.avatarOriginalUrl` đã chạy production.
- Backfill 20/20 avatar hiện có; xóa 24 file orphan cũ.
- Baseline trung bình giảm từ `572.3 KB` xuống `4.2 KB` cho thumbnail (~99.3%).

### Deployment và vận hành

- Docker production dùng hostname nội bộ thay `localhost`, bind đúng interface, pin PgBouncer và không public chat port trực tiếp.
- PM2 service URLs/host được chuẩn hóa.
- Healthcheck/deploy script được cập nhật.
- Web-client production build hiện tạo 51 route.
- Trang Settings bị merge chồng đã được sửa, gồm theme, compact mode, profile và legal links.

## 2. Migration đã thêm

- `20260722120000_add_live_streams`
- `20260803120000_add_avatar_original_url`

Production phải luôn chạy `prisma migrate deploy` trước reload service dùng schema mới.

## 3. Verification đã thực hiện

- User-service gần nhất: 6 suites, 28 tests pass.
- Social-service posts: 18 tests pass; toàn social-service từng đạt 23 tests.
- Avatar optimizer: 2 tests pass.
- Notification legacy route: 3 tests pass.
- Web-client: TypeScript và Next production build pass, 51 routes.
- User-service, social-service và web-client đã reload PM2 và online.
- Production thumbnail/detail trả `HTTP 200`, `image/webp`.

## 4. Việc bắt buộc trước release chính thức

### P0

1. **Session cookie và CSRF**
   - Chuyển refresh token khỏi `localStorage`/cookie JavaScript.
   - Dùng server-set `HttpOnly`, `Secure`, `SameSite` cookie.
   - Chốt CSRF model cho các mutation dùng cookie.

2. **Rotate secret production**
   - Rotate JWT, OTP, SMTP, AI, TURN, LiveKit và DB credentials.
   - Không log OTP/token trong production.
   - Chuyển secret sang secret manager hoặc PM2 protected environment.

3. **Migration baseline sạch**
   - Chứng minh toàn bộ migration chạy được trên PostgreSQL mới hoàn toàn.
   - Thêm CI migration smoke test và rollback/runbook.

### P1

1. Thay Optional JWT còn lại bằng strict JWT sau khi loại hết legacy client fallback.
2. Thêm outbox/retry cho material storage cleanup và notification delivery.
3. Chuyển AI rate limit từ memory sang Redis để hỗ trợ nhiều instance.
4. Hoàn thiện realtime notification để payload socket và persisted API cùng contract.
5. Thêm cursor pagination/virtualization cho feed, notification và chat dài.
6. Chuẩn hóa loading/error/offline/optimistic rollback toàn frontend.
7. Thêm request ID, structured logs, metrics, tracing và error reporting.

### P2

1. Playwright E2E cho register/login/feed/post/comment/chat/notification/marketplace.
2. Accessibility audit: focus trap modal, reduced motion, contrast và keyboard flows.
3. Data export, account deletion, consent ledger và retention scheduler.
4. Moderation queue, appeal workflow, spam controls và audit trail mở rộng.
5. Loại route/admin UI legacy sau khi migration sang admin dashboard hoàn tất.

## 5. Dependency security

`npm install` gần nhất báo 7 vulnerability trong dependency graph (6 high, 1 critical). Không chạy `npm audit fix --force` vì có thể gây breaking changes. Cần:

1. Chạy `npm audit --omit=dev` và lưu JSON artifact CI.
2. Phân loại dependency trực tiếp/gián tiếp và khả năng khai thác runtime.
3. Nâng từng package có kiểm soát, chạy build/test/E2E sau mỗi nhóm.
4. Không downgrade/upgrade Next, Nest, Nodemailer hoặc Sharp bằng `--force` thiếu review.

## 6. Quy trình deploy đề xuất

1. `npm ci`
2. `npm run prisma:generate`
3. `npx prisma migrate deploy --schema packages/database/prisma/schema.prisma`
4. `npm run build`
5. `npm test`
6. `pm2 reload ecosystem.config.js --update-env`
7. `pm2 save`
8. `node scripts/deploy-healthcheck.js`
9. Smoke test login, feed, post detail, notification deep-link, avatar upload/view, chat retry và marketplace buy.

## 7. Ghi chú dữ liệu

- Không commit `.env`, upload runtime, token hoặc credential thật.
- Notification cũ không có `relatedId` không được đoán target.
- Notification cũ không suy ra actor chắc chắn vẫn giữ sender null.
- Avatar original cũ đã được chuyển sang WebP detail; list UI chỉ dùng thumbnail.
