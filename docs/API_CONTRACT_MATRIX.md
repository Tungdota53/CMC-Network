# API contract matrix

Trạng thái: baseline Giai đoạn 0. Bảng này phản ánh controller đang tồn tại,
không phải danh sách tính năng mong muốn.

## Quy ước

- Browser gọi `/api/<path>` trên web client.
- Next.js forward request đến API gateway; gateway forward theo prefix.
- Đường dẫn dưới đây bỏ tiền tố `/api` phía browser.
- Danh tính người thực hiện phải đến từ JWT. `userId` trong URL/body chỉ mô tả
  tài nguyên đích và không được dùng thay thế danh tính đăng nhập.
- API chưa có controller được ghi rõ là `MISSING`; frontend không được giả định
  endpoint đó hoạt động.

## Service ownership

| Prefix | Service sở hữu | Controller chính | Trạng thái |
|---|---|---|---|
| `/auth` | auth-service | `auth.controller.ts` | Active |
| `/users`, `/admin`, `/reports` | user-service | users/admin controllers | Active; còn legacy identity cần khóa ở Giai đoạn 1 |
| `/notifications`, `/mentors`, `/clubs`, `/professors` | user-service | domain controllers | Active; còn endpoint legacy |
| `/grades`, `/timetable` | user-service | academics controller | Active |
| `/posts` | social-service | posts controller | Active |
| `/chat` | chat-service | chat controller | Active |
| `/study-groups`, `/events` | study-service | study/events controllers | Active |
| `/materials` | material-service | materials controller | Active |
| `/marketplace` | marketplace-service | marketplace controller | Active |
| `/ai` | ai-service | FastAPI `/api/v1` | Active qua gateway/rewrite |

## Canonical operations theo domain

### Auth

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/auth/register` | Tạo pending registration và gửi OTP; chưa tạo user ngay |
| POST | `/auth/verify-email` | Hoàn tất pending registration |
| POST | `/auth/resend-otp` | Gửi lại OTP |
| POST | `/auth/login` | Có thể trả nhánh yêu cầu 2FA |
| POST | `/auth/refresh` | Refresh hiện tại |
| POST | `/auth/forgot-password` | Bắt đầu reset password |
| POST | `/auth/reset-password` | Hoàn tất reset password |
| POST | `/auth/change-password` | Yêu cầu JWT |
| POST | `/auth/2fa/enable` | Yêu cầu JWT |
| POST | `/auth/2fa/verify` | Xác minh khi bật 2FA |
| POST | `/auth/2fa/verify-login` | Xác minh khi login |
| GET | `/auth/microsoft` | Bắt đầu OAuth |
| GET | `/auth/microsoft/callback` | Callback backend |
| POST | `/auth/logout` | **MISSING**; không được coi là hoạt động trước Giai đoạn 2 |
| GET | `/auth/session` | **MISSING**; dự kiến Giai đoạn 2 |

### User, academics và admin

| Method | Path | Trạng thái |
|---|---|---|
| GET | `/users/me` | Canonical self profile |
| GET | `/users/:id/profile` | Public profile |
| PUT/POST/DELETE | `/users/:id/...` | Legacy mutation; phải chuyển sang strict JWT/ownership ở Giai đoạn 1 |
| GET/POST/PUT/DELETE | `/grades...` | Active |
| GET/POST/PUT/DELETE | `/timetable/events...` | Active |
| GET | `/timetable/free-slots` | **MISSING** |
| GET | `/admin/analytics` | Active |
| GET | `/admin/growth` | Active |
| GET/PUT | `/admin/reports...` | Active |
| GET/PATCH | `/admin/users...` | Active |
| GET | `/users/admin/all` | Legacy duplicate admin listing |
| GET/DELETE | `/posts/admin/...` | Social-service admin content |
| any | `/admin/materials...` | **MISSING** |
| any | `/admin/email-domains...` | **MISSING** |

### Social và chat

| Method | Path | Trạng thái |
|---|---|---|
| GET | `/posts/feed` | Canonical feed |
| GET/POST | `/posts/stories...` | Active |
| POST/PUT/DELETE | `/posts...` | Active; frontend còn compat rewrite |
| GET | `/chat/conversations` | Canonical current-user conversation list |
| POST | `/chat/conversations/from-participants` | Create/get conversation |
| GET/POST | `/chat/messages/:conversationId` | History/send |
| POST | `/chat/messages/:conversationId/read` | Mark read |
| GET/POST/DELETE | `/chat/conversations/:id/pins...` | Active |
| POST | `/chat/calls/livekit/token` | Active |

### Study, material và marketplace

| Method | Path | Trạng thái |
|---|---|---|
| GET/POST | `/study-groups` | Active |
| GET/PUT/DELETE | `/study-groups/:id` | Active |
| POST/GET/PUT | `/study-groups/:id/join-requests...` | Active |
| GET | `/study-groups/my` | **MISSING** |
| GET | `/study-groups/suggestions` | **MISSING** |
| GET/POST/PUT/DELETE | `/events...` | Active |
| GET/POST/PUT/DELETE | `/materials...` | Active |
| GET/POST/PUT/DELETE | `/marketplace...` | Active |
| PUT | `/marketplace/:id/buy` | Active; cần concurrency fix ở Giai đoạn 5 |

## Frontend calls cần sửa sau baseline

| Frontend đang gọi | Controller thực tế / quyết định |
|---|---|
| `/feed` | Dùng trực tiếp `/posts/feed` |
| `/stories` | Dùng `/posts/stories` |
| `/conversations` | Dùng `/chat/conversations` |
| `PUT /notifications/:id/read` | Chốt API self-scoped; hiện interceptor đổi thành POST legacy |
| `/timetable/free-slots` | MISSING; không rewrite sang một endpoint cũng không tồn tại |
| `/admin/posts` | Dùng `/posts/admin/all` và `/posts/admin/:id` |
| `/admin/materials` | MISSING |
| `/admin/email-domains` | MISSING |

Mọi thay đổi controller hoặc frontend client phải cập nhật bảng này trong cùng
pull request cho đến khi OpenAPI-generated client thay thế tài liệu thủ công.
