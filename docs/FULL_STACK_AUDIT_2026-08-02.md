# CMC Network — Full-stack audit backlog

Ngày rà soát: 02/08/2026

## Trạng thái

Hệ thống chưa sẵn sàng để đạt độ tin cậy và độ hoàn thiện tương đương mạng xã hội lớn. Baseline hiện có 68 unit/infrastructure tests đều đạt, nhưng frontend không có test và backend E2E chủ yếu là smoke test. Audit này ưu tiên tính đúng, quyền riêng tư, toàn vẹn dữ liệu và khả năng vận hành trước polish giao diện.

## Đã sửa trong đợt 1

### P0 — IDOR trong user-service

- Bắt buộc `JwtAuthGuard` cho mutation tài khoản, avatar/cover, email, mật khẩu, quan hệ bạn bè và portfolio.
- Bắt buộc JWT cho mentor booking, đăng ký mentor, cập nhật booking và review.
- Bắt buộc JWT cho toàn bộ notification và preference.
- Các endpoint compatibility có `userId` trong path không còn dùng ID đó làm acting identity; subject JWT là nguồn danh tính duy nhất.
- Chỉ giữ public rõ ràng: user count, hồ sơ công khai, bài/ảnh công khai, danh sách bạn công khai, mutual friends, portfolio, danh sách mentor và hồ sơ mentor.

Xác minh: ESLint các controller sửa đạt; 17 unit tests user-service đạt; build user-service đạt.

## Đã sửa trong đợt 2

### P0 — Quyền xem bài viết

- Anonymous chỉ đọc bài `PUBLIC`.
- User đã đăng nhập đọc bài `PUBLIC`, bài của chính mình và bài `FRIENDS` của bạn bè.
- Policy áp dụng đồng nhất cho ranked feed, latest feed, user posts, club posts, post detail, comments và replies.
- Visibility do frontend gửi được validate bằng enum và lưu khi tạo bài; giá trị sai mặc định `PUBLIC`.

### P0 — Đăng ký lại không được xóa user

- Mọi email đã tồn tại đều bị từ chối đăng ký mới, kể cả account chưa xác minh.
- Xóa logic hard-delete có thể cascade post, comment, message, material và dữ liệu liên quan.
- Luồng khôi phục account chưa xác minh phải dùng resend OTP hoặc support workflow riêng, không dùng delete/recreate.

Xác minh: 15 tests social-service và 6 tests auth-service đạt; build hai service đạt; ESLint các file sửa đạt.

## Đã sửa trong đợt 3

### P1 — Bình luận và reply

- `commentLocked` được thực thi ở backend; post đã khóa trả lỗi và không tạo comment.
- Tạo comment kiểm tra user có quyền xem post trước khi ghi dữ liệu.
- `parentId` từ frontend được controller truyền vào service và lưu trong DB.
- Parent comment phải tồn tại, chưa bị xóa và thuộc đúng post; không thể gắn reply chéo bài.
- Nội dung comment được trim trước khi lưu.
- Thêm test cho comment lock, reply hợp lệ và parent thuộc bài khác.

### P1 — Đồng bộ cache frontend

- Update, delete, reaction, save, unsave và lock-comments invalidates cả feed và post detail.
- Save/unsave/delete invalidates saved-posts.
- Tạo comment invalidates comments, feed, post detail và replies của parent tương ứng.

Xác minh: 18 tests social-service đạt; build social-service và web-client đạt; ESLint các file thay đổi đạt.

## Đã sửa trong đợt 4

### P1 — Marketplace double-buy

- Thay read-then-update bằng `updateMany` có điều kiện `AVAILABLE` và `buyerId: null`.
- Chỉ request atomic claim được đúng một row mới thành công.
- Buyer đến sau nhận lỗi “Sản phẩm đã được bán”, không thể ghi đè `buyerId` đầu tiên.

### P1 — Reaction counter race

- Tạo/chuyển reaction chạy trong transaction.
- Unique relation quyết định request có được increment counter hay không.
- Race `P2002` được xử lý idempotent, không trả 500 và không increment lần hai.
- Remove reaction dùng `deleteMany`; chỉ decrement khi đã xóa đúng một relation.
- Decrement có điều kiện `likes > 0`, ngăn counter âm.

Xác minh: 20 tests social-service và 5 tests marketplace-service đạt; build hai service đạt; ESLint các file thay đổi đạt.

## Đã sửa trong đợt 5

### P1 — Study-group capacity race

- Duyệt join request dùng conditional reservation `memberCount < maxMembers`.
- Reservation, tạo member, chuyển request `APPROVED` và thêm conversation member chạy trong cùng transaction.
- Request đồng thời lấy slot cuối: chỉ một request cập nhật được counter; request còn lại rollback và nhận “Nhóm đã đủ thành viên”.
- Không còn nuốt lỗi chat membership; transaction rollback để study group và conversation không lệch nhau.
- `createMany(..., skipDuplicates: true)` giữ thao tác chat membership idempotent.

### P1 — Comment-like counter race

- Toggle comment-like chạy trong transaction.
- Unique relation quyết định increment; race `P2002` trở thành idempotent.
- Unlike dùng `deleteMany`; chỉ decrement khi xóa đúng một relation.
- Counter chỉ decrement khi `likes > 0`, ngăn số âm.

Xác minh: 3 tests study-service và 22 tests social-service đạt; build hai service đạt; ESLint không có error. Study service còn 2 warning `any` có sẵn tại luồng parse ngày.

## Đã sửa trong đợt 6

### P1 — Mentor booking race và state machine

- Tạo booking dùng PostgreSQL transaction advisory lock theo mentor trước khi kiểm tra overlap.
- Hai request đồng thời cùng mentor được serialize; request sau nhìn thấy booking trước và bị từ chối nếu gần trong cửa sổ 30 phút.
- Chỉ mentor được `CONFIRMED`, `COMPLETED`, `NO_SHOW`; mentee chỉ được `CANCELLED` booking của mình.
- Transition hợp lệ: `PENDING -> CONFIRMED|CANCELLED`, `CONFIRMED -> COMPLETED|CANCELLED|NO_SHOW`.
- Terminal state không thể chuyển tiếp hoặc hoàn thành lần hai.
- Status conditional update và `totalSessions` increment chạy cùng transaction; concurrent completion chỉ một request thành công.
- Loại mock Google Calendar từng log thành công giả dù không có integration.
- Mentee UI không còn hiển thị action xác nhận/hoàn thành trái quyền.

Xác minh: 21 tests user-service đạt; build user-service và web-client đạt; ESLint các file thay đổi đạt.

## Đã sửa trong đợt 7

### P1 — Session hydration và logout

- AuthProvider chờ Zustand persist hydration trước khi quyết định refresh session.
- Token JWT và user ID phải khớp; token lỗi, token sai user hoặc session stale sẽ refresh lại.
- Logout xóa localStorage và cả cookie `auth_token`, `access_token`, `refresh_token`.
- Logout dùng `window.location.replace('/login')`, reload sạch route và không để UI authenticated đứng lại.
- Axios 401 xóa session và tự redirect `/login` thay vì để trang hiện tại treo.
- Xóa gọi `/auth/logout` không tồn tại, tránh delay hoặc lỗi giả khi logout.

### P1 — Notification avatar

- Notification dropdown và trang notification nhận avatar từ `sender.avatarUrl`, `sender.avatar`, `senderAvatar` hoặc `avatarUrl`.
- Backend đã include sender projection; frontend giờ map đủ các response shape legacy/current.

Xác minh: ESLint các file thay đổi đạt; web-client production build đạt với 51 route.

## Đã sửa trong đợt 8

### P1 — Material storage consistency

- Nếu tạo DB material hoặc enqueue job lỗi sau khi file đã lưu, storage file được cleanup.
- Nếu DB record đã tạo nhưng queue lỗi, record tạm cũng được rollback best-effort.
- Xóa material chuyển sang soft-delete bằng `deletedAt` trước khi xóa file.
- Nếu storage cleanup lỗi, metadata soft-deleted vẫn còn để retry/audit; không mất tham chiếu DB ngay lập tức.
- Thêm regression tests cho DB failure cleanup và thứ tự soft-delete → storage delete.

Xác minh: 11 tests material-service đạt; build đạt; ESLint không có error, còn 2 warning `any` có sẵn ở test queue mock.

## Đã sửa trong đợt 9

### P1 — Redis production fail-closed

- `NODE_ENV=production` hoặc `REDIS_REQUIRED=true` bắt buộc Redis phải kết nối được.
- Redis startup failure không còn được coi là trạng thái vận hành bình thường trong production.
- Rate limiter không rơi sang Map local khi Redis bắt buộc nhưng chưa ready; trả `503 Service Unavailable`.
- Local development vẫn được phép dùng in-memory fallback nếu không bật `REDIS_REQUIRED`.
- Log không còn tuyên bố fallback an toàn khi hệ thống thực tế mất distributed state.

Xác minh: build common package đạt; ESLint các file Redis đạt.

## Đã sửa trong đợt 10

### P1 — AI endpoint auth, input và quota

- `/api/v1/ask` và `/api/v1/ask/stream` yêu cầu Bearer JWT hợp lệ bằng `JWT_SECRET` chung.
- Không còn tin `user_id` do client gửi; response dùng `sub` đã xác minh trong token.
- Câu hỏi rỗng bị từ chối.
- Câu hỏi vượt `AI_MAX_QUESTION_CHARS` bị từ chối; mặc định 4000 ký tự.
- Thêm rate limit theo user + IP; mặc định 20 request trong 60 giây, cấu hình qua `AI_RATE_LIMIT` và `AI_RATE_WINDOW_SECONDS`.
- Anonymous cost abuse bị chặn trước khi fetch website hoặc gọi LLM.
- Thêm dependency `PyJWT` và kiểm tra cú pháp Python.

Xác minh: `python3 -m py_compile main.py` đạt; build api-gateway đạt.

## P0 còn lại

1. **Session token phía trình duyệt**
   - Không ghi refresh token bằng JavaScript/localStorage.
   - Chuẩn hóa server-set `HttpOnly`, `Secure`, `SameSite` cookie và CSRF model.

2. **Secret production**
   - Rotate JWT, OTP, SMTP, AI, TURN, LiveKit và DB credentials đã xuất hiện trong runtime env.
   - Dùng secret manager; tắt OTP logging production.

3. **Prisma migration thiếu baseline**
   - Tạo baseline được kiểm chứng trên PostgreSQL sạch trước deploy.

## P1 — toàn vẹn dữ liệu và nghiệp vụ

1. Cleanup retry/outbox cho material storage để xử lý lỗi storage kéo dài.
1. Retry/outbox cleanup cho material storage.
1. AI rate-limit cần chuyển từ memory sang Redis để nhất quán multi-instance.
2. Retry/outbox cleanup cho material storage.

## P1 — frontend/realtime

1. `useMyStories()` đang dùng story feed của mọi người.
2. Chat không có error/retry rõ ràng khi fetch conversation thất bại.
3. Socket optimistic mutation thiếu ACK rollback.
4. Message có thể kẹt `SENDING` vô hạn; cần ACK timeout và retry.
5. Message notification không đồng nhất giữa `sendMessage` và `send_message`.
6. Infinite-scroll observer có nguy cơ leak/lặp request.
7. Hai feed trending/latest fetch đồng thời dù chỉ hiện một tab.

### Đã sửa một phần chat reliability

- Text message chờ ACK tối đa 12 giây; quá hạn chuyển `FAILED`.
- Media message chờ ACK tối đa 15 giây sau upload; quá hạn chuyển `FAILED`.
- ACK về đúng hạn hủy timer và chuyển `SENT`.
- Không còn message giữ `SENDING` vô hạn khi mạng rớt đúng lúc emit.
- Message `FAILED` hiện nút “Gửi lại”.
- Text retry giữ nội dung, reply target và message type.
- Media retry giữ file gốc và reply target; message lỗi cũ được thay bằng optimistic message mới.
- Temp media ID dùng monotonic counter thay timestamp.

Xác minh: ESLint trang conversation đạt; web-client production build đạt.

## P1 — deployment

1. Docker service URLs và DB không được dùng `localhost` giữa container.
2. Docker phải đặt `LISTEN_HOST=0.0.0.0`; PM2 host mode có thể tiếp tục loopback.
3. Production DB password phải fail closed; không fallback credential yếu.
4. Không public trực tiếp chat port nếu kiến trúc yêu cầu đi qua gateway.
5. Pin image PgBouncer; thêm migration job và health/readiness đúng dependency.
6. CI dùng Node 20 và chạy test, Prisma validate/migrate, audit, container build.

### Đã sửa một phần deployment

- Production Compose ép `LISTEN_HOST=0.0.0.0` cho service container.
- Database/service URLs dùng hostname Docker nội bộ thay vì `localhost`.
- Redis production bắt buộc qua `REDIS_REQUIRED=true`.
- PostgreSQL credentials không còn fallback password mặc định.
- PgBouncer image được pin version `1.23.1`.
- Chat port chỉ bind localhost host, không public trực tiếp ra mọi interface.

Cần xác minh bằng Docker Compose trên host có Docker Compose plugin; máy hiện tại chỉ có Docker CLI không hỗ trợ `docker compose`.

## P2 — chất lượng kiểu Facebook

1. Frontend Playwright cho đăng ký, đăng nhập, feed, post, comment, chat, notification và marketplace.
2. Loading/error/empty/offline state nhất quán; optimistic UI có rollback.
3. Virtualization, cursor pagination, image optimization và cache policy cho feed/chat.
4. Accessibility: nhãn bottom nav, focus trap modal, keyboard, reduced motion, contrast.
5. Observability: request ID xuyên gateway, structured logs, metrics, tracing, error reporting.
6. Moderation: report queue, appeal, rate limits, spam detection và audit log.
7. Privacy: account deletion, data export, consent ledger, retention scheduler.
8. Loại fallback giả `2048`, dead link và mock Google Calendar gây hiểu nhầm.

## Quality gate đề xuất

Mỗi nhóm fix phải có:

1. Test tái hiện lỗi trước khi sửa.
2. Unit/integration test cho policy và state transition.
3. Contract test qua gateway.
4. Build và lint workspace liên quan.
5. E2E cho luồng người dùng quan trọng.
6. Migration thử trên DB sạch nếu chạm schema.
7. Kế hoạch rollback và telemetry nếu chạm production data.
