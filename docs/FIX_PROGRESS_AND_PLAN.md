# CampusConnect — Fix progress and implementation plan

> Cập nhật lần cuối: 2026-07-22
>
> Trạng thái hiện tại: **Giai đoạn 0 hoàn tất; chưa sẵn sàng release**
>
> Nguồn theo dõi chính cho công việc ổn định, sửa lỗi và chuẩn bị phát hành.

## 1. Mục tiêu

Tài liệu này ghi lại:

- Những lỗi đã xác nhận trong quá trình review toàn repository.
- Những thay đổi đã triển khai và kiểm chứng.
- Debt/rủi ro chưa xử lý.
- Tiến độ từng giai đoạn.
- Thứ tự triển khai và tiêu chí nghiệm thu cho các giai đoạn tiếp theo.

Tài liệu liên quan:

- [Local development baseline](./LOCAL_DEVELOPMENT.md)
- [API contract matrix](./API_CONTRACT_MATRIX.md)
- [ADR-001: Admin chính](./ADR-001-CANONICAL-ADMIN.md)
- [API design lịch sử](../API_DESIGN.md)

## 2. Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| `DONE` | Đã triển khai và qua verification |
| `IN PROGRESS` | Đang triển khai |
| `PENDING` | Chưa bắt đầu |
| `BLOCKED` | Có điều kiện bên ngoài ngăn tiếp tục |
| `DEBT` | Đã đo/ghi nhận nhưng chưa nằm trong phạm vi sửa hiện tại |

## 3. Tổng quan tiến độ

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 0 | Baseline build, test, env, port, API contract, admin ownership | `DONE` |
| 1 | Khóa authorization/IDOR, strict JWT và admin RBAC | `PENDING` |
| 2 | Thiết kế lại session, refresh và logout | `PENDING` |
| 3 | Hoàn thiện login, 2FA, OAuth và password lifecycle | `PENDING` |
| 4 | Đồng bộ hợp đồng frontend/backend | `PENDING` |
| 5 | Sửa race condition và tính toàn vẹn dữ liệu | `PENDING` |
| 6 | UX loading/error/mobile và giảm hiện tượng khựng | `PENDING` |
| 7 | E2E, security hardening, dependency và release gate | `PENDING` |

Ghi chú: số giai đoạn hoàn tất không đại diện trực tiếp cho phần trăm effort vì
Giai đoạn 1–3 có độ phức tạp và rủi ro cao hơn Giai đoạn 0.

## 4. Giai đoạn 0 — Những gì đã fix

### 4.1 Build và Prisma pipeline — `DONE`

Vấn đề ban đầu:

- Root build dừng giữa chừng ở nhiều service với lỗi `implicit any`.
- Declaration của `@campus-connect/database` từng xuất `prisma` thành `any` khi
  Turbo cache được tạo trước lúc Prisma client được generate.
- Turbo trên Windows có thể in `14/14 tasks successful` nhưng không tự thoát sau
  khi Next.js build xong.

Đã sửa:

- Thêm `prisma:generate`, `postinstall` và `prebuild` ở root.
- Thêm `generate` và `prebuild` cho package database khi build độc lập.
- Khai báo `prisma: PrismaClient` tường minh để declaration luôn giữ type.
- Tách build thành hai bước:
  1. Turbo build shared packages/backend, loại web-client khỏi lifecycle đó.
  2. Chạy Next.js build trực tiếp và truyền nguyên exit code.
- Thêm build orchestrator an toàn, không ghép command shell.

File chính:

- `package.json`
- `scripts/build.js`
- `packages/database/package.json`
- `packages/database/index.ts`

Kết quả:

- Root build kết thúc với exit code `0`.
- Backend build sau format: `13/13` task pass.
- Next.js build tạo thành công 48 static/dynamic page entries.

### 4.2 Test drift và test artifact — `DONE`

Vấn đề ban đầu:

- Auth test vẫn kỳ vọng registration tạo user ngay, trong khi implementation đã
  chuyển sang pending registration + OTP.
- Auth mock thiếu `prisma.user.delete` cho nhánh tài khoản chưa verify bị kẹt.
- User search test thiếu filter `emailVerified` và `isSuspended`.
- Material upload unit test ghi PDF thật vào runtime upload directory.

Đã sửa:

- Test registration kiểm tra pending email, password hash, student ID và OTP.
- Thêm test xóa tài khoản chưa verify bị kẹt trước khi tạo pending registration.
- Cập nhật expectation cho user search.
- Mock storage provider trong material test; không còn ghi file thật.
- Ignore runtime uploads để local/test artifact không xuất hiện trong Git.

File chính:

- `apps/auth-service/src/auth/auth.service.spec.ts`
- `apps/user-service/src/users/users.service.spec.ts`
- `apps/material-service/src/materials/materials.service.spec.ts`
- `.gitignore`

Kết quả:

- `62/62` test pass:
  - 11 infrastructure contract test.
  - 51 backend unit/integration test.
- Không có untracked test upload artifact sau khi chạy toàn bộ test.

### 4.3 Môi trường local và cô lập dữ liệu — `DONE`

Vấn đề ban đầu:

- Postgres/Redis mặc định dùng `5432/6379`, dễ kết nối nhầm database/Redis của
  project khác.
- Root environment template thiếu `NEXT_PUBLIC_API_GATEWAY_URL` và một số biến
  routing cần thiết.
- Các `.env.example` giữa service không thống nhất port/credential.

Đã sửa:

- Postgres local host port: `25432`.
- Redis local host port: `26379`.
- Compose project name: `cmc-network-dev`.
- Container name riêng:
  - `cmc_network_postgres_dev`
  - `cmc_network_redis_dev`
- Thêm healthcheck cho Postgres và Redis.
- Chuẩn hóa root `.env.example` và environment template của từng service.
- Thêm `apps/web-client/.env.example`.
- Root dev/build command nạp root `.env` khi file tồn tại.
- Thêm infrastructure contract test để ngăn port/env bị lệch trở lại.

File chính:

- `.env.example`
- `apps/*/.env.example`
- `apps/web-client/.env.example`
- `infrastructure/docker-compose.yml`
- `infrastructure/environment-contract.test.js`

### 4.4 Port cleanup an toàn — `DONE`

Vấn đề ban đầu:

- `predev` tự force-kill mọi process đang giữ port, không kiểm tra process có
  thuộc CampusConnect hay không.

Đã sửa:

- `npm run dev` chỉ kiểm tra và báo xung đột; không tự dừng process.
- `npm run dev:cleanup` là thao tác explicit.
- Cleanup chỉ dừng listener có command line chứa đúng absolute workspace path.
- Process từ project khác hoặc thư mục cùng tiền tố tên được giữ nguyên.
- Giữ port `25443` của dashboard Vite trong active port checks sau khi đồng bộ
  phiên bản remote mới nhất.
- Loại bỏ shell-built process commands; PID được truyền bằng argument riêng.

File chính:

- `infrastructure/kill-ports.js`
- `infrastructure/port-ownership.js`
- `infrastructure/port-ownership.test.js`

Kết quả:

- 4 ownership test pass.
- Predev xác nhận port khả dụng mà không thay đổi process bên ngoài.

### 4.5 Lint quality gate — `DONE`

Vấn đề ban đầu:

- `npm run lint` của Nest services dùng `--fix`, làm verification tự thay đổi
  source rồi vẫn báo pass.
- Khi chuyển lint về read-only, social-service lộ ra 27 lỗi Prettier bị che trước
  đó.

Đã sửa:

- `lint`: chỉ kiểm tra, không thay đổi file.
- `lint:fix`: formatter explicit.
- Chạy formatter explicit và build/test lại sau format.
- Thêm contract test ngăn `--fix` quay lại lệnh lint mặc định.

Kết quả:

- Lint toàn monorepo: exit code `0`.
- `0` error.
- Còn `22` warning về `any` và floating promises; đã ghi nhận là debt.
- Các source service bị formatter chạm tới chỉ thay đổi format, không thay đổi
  nghiệp vụ; build và test sau format đều pass.

### 4.6 API contract và admin ownership — `DONE`

Vấn đề ban đầu:

- Frontend và backend có endpoint lệch nhau nhưng chưa có bảng source of truth.
- Hai bề mặt admin cùng tồn tại giữa Next.js và dashboard Vite, nhưng chưa có
  tài liệu chốt runtime ownership.

Đã sửa:

- Tạo API contract matrix theo controller đang tồn tại.
- Đánh dấu rõ endpoint `ACTIVE`, legacy và `MISSING`.
- Ghi rõ `/auth/logout`, `/auth/session`, `/study-groups/my`, suggestions,
  free-slots và một số admin API chưa tồn tại.
- Khi đồng bộ hai commit mới nhất từ remote, giữ nguyên dashboard Vite vừa được
  nâng cấp và PM2 process trên port `25443`.
- Chốt `apps/admin-dashboard` là admin runtime chính theo trạng thái source mới;
  route Next.js `/admin/*` là legacy/đang chuyển tiếp.
- `npm run dev:admin` chạy dashboard Vite; `npm run dev:web` chạy cả hai frontend.
- Viết ADR ghi nhận quyết định, bằng chứng cập nhật và phạm vi migration sau này.

File chính:

- `docs/API_CONTRACT_MATRIX.md`
- `docs/ADR-001-CANONICAL-ADMIN.md`
- `apps/admin-dashboard/README.md`
- `ecosystem.config.js`
- `README.md`

## 5. Verification report của Giai đoạn 0

| Quality gate | Kết quả | Ghi chú |
|---|---|---|
| Root build | `PASS` | Backend + Next.js đều kết thúc exit `0` |
| Backend rebuild sau format | `PASS` | 13/13 task |
| TypeScript | `PASS` | Được kiểm tra trong Nest/Next production build |
| Lint phạm vi Giai đoạn 0 | `PASS` | 0 error trước khi đồng bộ remote |
| Root lint sau khi đồng bộ remote | `BLOCKED` | 2 lỗi Prettier trong `marketplace-service` từ commit remote mới; không sửa vì ngoài phạm vi commit này |
| Tests sau khi đồng bộ remote | `PASS` | 69/69 |
| Docker Compose config | `PASS` | Config hợp lệ với `.env.example` |
| Upload artifact | `PASS` | Không có file test upload mới |
| Embedded key/private key scan | `PASS` | Không phát hiện key/private key hard-code |
| Diff whitespace check | `PASS` | Không có whitespace error |
| Commit scope | `PASS` | Chỉ gồm file sửa/tạo của Giai đoạn 0; không còn thay đổi ngoài phạm vi trong worktree |

## 6. Debt và rủi ro chưa xử lý

### 6.1 Release blockers — `PENDING`

- User-service vẫn bật optional JWT ở cấp module.
- Một số mutation fallback sang `userId` trên URL/body, tạo rủi ro IDOR.
- Backend chưa có `/auth/logout` và `/auth/session`.
- Middleware coi cookie rác là authenticated.
- Session state bị chia giữa cookie, local storage, Zustand, React Query và
  socket.
- 2FA login response chưa được frontend xử lý.
- Microsoft OAuth callback/cookie name chưa khớp frontend.
- Role enforcement của dashboard và admin API chưa có E2E chứng minh đầy đủ.

### 6.2 Test coverage — `DEBT`

Coverage đo gần nhất:

| Package | Statement coverage |
|---|---:|
| auth-service | 21.54% |
| material-service | 20.74% |
| user-service | 9.54% |

Các regression test của Giai đoạn 0 đã có, nhưng coverage toàn package chưa đạt
mục tiêu 80%. Không được coi test pass hiện tại là đủ cho release production.

### 6.3 Dependency security — `DEBT`

`npm audit --omit=dev` hiện báo:

| Mức độ | Số lượng |
|---|---:|
| Critical | 1 |
| High | 12 |
| Moderate | 4 |
| Low | 1 |
| Tổng | 18 |

Nhóm cần ưu tiên gồm `tar`, `multer`, Nest platform-express, `nodemailer`,
`sharp`, `ws` và các dependency liên quan. Không chạy `npm audit fix --force`
vì audit đang đề xuất breaking downgrade/upgrade cho Next và Nodemailer.

### 6.4 Prisma migration — `DEBT`

Repo hiện chưa có lịch sử Prisma migrations. `npm run db:push` chỉ được chấp
nhận cho local baseline, không phải quy trình migrate production.

## 7. Plan triển khai tiếp theo

## Giai đoạn 1 — Authorization và IDOR

Trạng thái: `PENDING`

Ước lượng: 2–4 ngày làm việc tập trung.

### Công việc

- Lập inventory endpoint public/private/admin cho từng controller.
- Chuyển API private sang `JwtAuthGuard` bắt buộc.
- Xóa fallback identity từ URL/body cho mutation.
- Chuyển self-service mutation về identity từ JWT.
- Thêm ownership guard cho:
  - Profile, email, avatar và cover.
  - Friend request/block/unfriend.
  - Portfolio.
  - Material/product/post mutation.
- Bổ sung role guard cho admin API và dashboard shell.
- Tạo DTO thật cho email/password/profile thay vì inline type hoặc `any`.
- Tắt hoặc xóa endpoint legacy không thể bảo vệ an toàn.
- Viết negative test cho thiếu token, token rác, token user khác và sai role.

### Tiêu chí nghiệm thu

- Không token hoặc token không hợp lệ trả `401`.
- User A không thể sửa tài nguyên của B bằng cách đổi ID trên URL/body.
- User thường không thể gọi admin API hoặc mở admin protected shell.
- Mọi mutation quan trọng có ít nhất một authorization negative test.
- Build, lint và test toàn repo tiếp tục xanh.

## Giai đoạn 2 — Session, refresh và logout

Trạng thái: `PENDING`

Ước lượng: 3–5 ngày.

### Công việc

- Chọn server-managed session với cookie `HttpOnly`, `Secure`, `SameSite`.
- Không lưu access/refresh token trong local storage.
- Thêm `GET /auth/session`.
- Thêm idempotent `POST /auth/logout`.
- Thu hồi session/refresh token phía server khi logout.
- Refresh token có `sessionId/jti`, hash và rotation.
- Hỗ trợ nhiều thiết bị mà không ghi đè một Redis key duy nhất theo user.
- Dùng một refresh coordinator chung cho HTTP và socket.
- Frontend auth state machine: `unknown`, `authenticated`, `anonymous`.
- Logout theo đúng thứ tự:
  1. Disable nút và chống double click.
  2. Ngắt socket/call.
  3. Revoke session phía server.
  4. Xóa QueryClient/Zustand/IndexedDB theo user.
  5. `router.replace('/login')` và `router.refresh()`.
- Đồng bộ logout giữa tab bằng `BroadcastChannel`.

### Tiêu chí nghiệm thu

- Token không còn trong local storage.
- Refresh token cũ bị từ chối sau logout/rotation.
- Back button không hiển thị protected data cũ.
- Tài khoản A và B không dùng chung cache.
- Nhiều request 401 đồng thời chỉ tạo một refresh request.

## Giai đoạn 3 — Login variants, 2FA, OAuth và password

Trạng thái: `PENDING`

Ước lượng: 2–3 ngày.

### Công việc

- Chuẩn hóa login response thành các trạng thái rõ ràng.
- Thêm UI/flow nhập TOTP khi `TWO_FACTOR_REQUIRED`.
- Hoàn thiện Microsoft OAuth callback route hoặc redirect server-side hoàn chỉnh.
- Thống nhất cookie name cho password login và OAuth.
- Thống nhất allowed email domain giữa register/login/forgot/reset.
- Thống nhất password policy frontend/backend.
- Quyết định gửi hoặc bỏ DOB/gender khỏi registration form.
- Thu hồi session phù hợp sau change/reset password.

### Tiêu chí nghiệm thu

- Account bật 2FA đăng nhập được.
- OAuth success/error không 404 hoặc redirect loop.
- Suspended/unverified account nhận đúng state/message.
- Password reset làm session cũ mất hiệu lực theo policy.

## Giai đoạn 4 — Frontend/backend contract

Trạng thái: `PENDING`

Ước lượng: 3–5 ngày.

### Công việc

- Xây typed API client từ OpenAPI hoặc SDK theo domain.
- Loại URL/method rewrite khỏi Axios interceptor.
- Sửa hoặc implement các contract còn thiếu:
  - Study groups `my` và `suggestions`.
  - Timetable free-slot comparison.
  - Admin posts/materials/email domains.
  - Notification list/read/read-all.
  - Marketplace contact seller.
- Thống nhất response envelope và error schema.
- Gộp các notification hook/store trùng lặp.
- Admin dashboard dùng dữ liệu thật hoặc empty state, không dùng số hard-code.

### Tiêu chí nghiệm thu

- Mọi frontend API call có controller tương ứng.
- Contract test bắt được route hoặc method lệch.
- Axios không tự đổi HTTP method hoặc chèn acting user ID.

## Giai đoạn 5 — Data integrity và concurrency

Trạng thái: `PENDING`

Ước lượng: 2–4 ngày.

### Công việc

- Marketplace conditional update để chỉ một buyer mua được sản phẩm.
- Event capacity check và increment trong cùng transaction/lock.
- Study group approval kiểm tra capacity tại commit time.
- Đồng bộ study membership và conversation membership bằng transaction hoặc
  outbox/retry có quan sát.
- Bổ sung unique/check constraint phù hợp.
- Xử lý cleanup orphan upload và chiến lược object storage production.

### Tiêu chí nghiệm thu

- 20 concurrent buy request chỉ có một success.
- 20 concurrent join request cho slot cuối chỉ có một success.
- Counter luôn khớp số record thật.
- Group member và chat member không bị lệch trạng thái.

## Giai đoạn 6 — UX và giảm khựng

Trạng thái: `PENDING`

Ước lượng: 3–5 ngày.

### Công việc

- Thêm `loading.tsx`, `error.tsx` và `not-found.tsx` phù hợp.
- Pending/disabled state cho mọi mutation quan trọng.
- Chống double submit và hiển thị lỗi API rõ ràng.
- Skeleton giữ layout, tránh nhảy UI.
- Tách các file/hook 500–700 dòng.
- Lazy-load WebRTC; không mount call/chat provider trên route không cần.
- Scope React Query cache theo session/user.
- Sửa mobile cho messages, timetable, grades, auth keyboard và chat composer.

### Tiêu chí nghiệm thu

- Không còn login/logout redirect flicker.
- Network chậm/lỗi không biến thành blank screen.
- Mobile 320px không overflow ở luồng chính.
- Không double-create khi người dùng bấm nhiều lần.

## Giai đoạn 7 — Release hardening

Trạng thái: `PENDING`

Ước lượng: 2–4 ngày, chưa gồm dependency major migration lớn.

### Công việc

- Playwright E2E cho auth/session/admin và các mutation P0.
- Nâng dependency theo nhóm nhỏ, review từng breaking change.
- Xử lý critical/high production advisories hoặc có risk acceptance rõ ràng.
- Thêm CSP, frame, referrer và permissions policy.
- Thiết lập Prisma migration workflow.
- Structured log có request/session ID.
- Theo dõi login failure, refresh failure, logout latency, 401 loop và socket
  reconnect.
- Canary rollout trước production rollout toàn bộ.

### Release gate

- Build, lint và test xanh.
- P0 Playwright E2E xanh và không flaky.
- Không còn authorization bypass/IDOR đã biết.
- Logout thu hồi được session và token cũ bị từ chối.
- Không còn critical dependency vulnerability chưa có quyết định xử lý.
- Có migration/rollback và monitoring trước rollout.

## 8. Ma trận test bắt buộc cho các giai đoạn tiếp theo

| Nhóm | Kịch bản |
|---|---|
| Login | Đúng, sai password, unverified, suspended, 2FA, OAuth |
| Reload | Access hợp lệ, access hết hạn, refresh hợp lệ/hết hạn, cookie rác |
| Logout | Online, timeout, double click, nhiều tab, back button, token cũ |
| Authorization | Không token, token rác, ID user khác, user thường gọi admin |
| Cache | A logout → B login; B không thấy dữ liệu A |
| Concurrency | Buy, event slot cuối, group slot cuối |
| Mobile | 320px, keyboard auth/chat, nội dung dài, mạng chậm |
| Resilience | Gateway/Redis down, API 401/403/429/500 |

## 9. Thứ tự thực hiện ngay

1. Bắt đầu Giai đoạn 1 bằng inventory endpoint public/private/admin.
2. Viết authorization negative tests trước khi đổi guard.
3. Khóa user-service IDOR đầu tiên vì đây là rủi ro dữ liệu cao nhất.
4. Sau khi strict JWT ổn định, chuyển sang Giai đoạn 2 session/logout.
5. Không thêm tính năng mới vào auth/admin trước khi Giai đoạn 1–3 hoàn tất.

## 10. Change log

### 2026-07-22 — Giai đoạn 0

- Hoàn tất baseline build/test/lint.
- Sửa Prisma generation và Turbo/Next build lifecycle.
- Chuẩn hóa local environment và cô lập Postgres/Redis.
- Thay port auto-kill bằng ownership-aware explicit cleanup.
- Cập nhật test drift và loại test upload artifact.
- Chốt dashboard Vite là admin runtime chính sau khi bảo toàn hai commit remote
  mới nhất; Next `/admin` được ghi nhận là bề mặt legacy/đang chuyển tiếp.
- Tạo API contract matrix và ADR.
- Đo coverage/dependency debt và ghi nhận release blockers.
- Đồng bộ trên hai commit remote mới nhất, bảo toàn các tính năng AI/admin mới;
  test `69/69` và full build pass.
- Ghi nhận root lint còn bị chặn bởi hai lỗi format marketplace thuộc commit
  remote, không đưa sửa đổi ngoài phạm vi vào commit Giai đoạn 0.
