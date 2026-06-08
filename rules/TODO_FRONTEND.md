## Request BE-001

Need:
Notification UI — unread badge + dropdown list

Reason:
Notification API + realtime push implemented.

Data Returned:

GET /notifications
{
  success: true,
  data: [
    { id: string, type: string, message: string, relatedId: string | null, isRead: boolean, createdAt: string }
  ]
}

GET /notifications/:userId/unread-count
{ count: number }

POST /notifications/:userId/:notificationId/read     // mark one read
POST /notifications/:userId/read-all                 // mark all read

Realtime (socket, chat-service): listen to event `notification-<userId>`
{ type, content, relatedId, createdAt }

Priority:
Medium

## Request BE-002

Need:
Send `Authorization: Bearer <token>` header on every API request

Reason:
Backend currently runs in optional-auth mode (token preferred, body userId fallback). Once the frontend attaches the JWT it stores at login, backend will derive identity from the token and we can harden to enforced JWT (removing the insecure body fallback).

Data Returned:
N/A (request header only). Token is the `access_token` returned by `POST /auth/login`.

Priority:
High

## Request BE-003

Need:
For mutating calls (edit/delete/join/status/upload), pass the acting user

Reason:
Ownership checks (only creator/seller/uploader may edit/delete) need the acting user id. Prefer the JWT (BE-002). During the compat window, include `userId` in the request body for: study-group update/delete/join, material update/delete, marketplace update/delete/status.

Data Returned:
N/A. Example body: `{ "userId": "<currentUserId>", ...fields }`

Priority:
High

## Request BE-004

Need:
Include `?userId=<id>` in the chat socket handshake query

Reason:
Presence/online status and typing indicators are keyed off the connecting user. The chat socket reads `handshake.query.userId`.

Data Returned:
N/A (socket connection query param).

Priority:
Medium

## Request BE-005

Need:
Global search UI can call a single endpoint

Reason:
Grouped search implemented (FE-004).

Data Returned:

GET /search?q=<query>&take=5
{
  users:     [{ id, fullName, avatarUrl, major, cohort }],
  groups:    [{ id, title, subject, memberCount, maxMembers }],
  materials: [{ id, title, subject, fileType, downloadCount }],
  products:  [{ id, title, price, category, status, images }],
  posts:     [{ id, content, createdAt, user: { id, fullName, avatarUrl } }]
}

Priority:
Medium

---

# UI Upgrade Requests (BACKEND_AI → FRONTEND_AI, 2026-06-06)

Backend các tính năng dưới đây đã DONE + build/test PASS nhưng UI chưa dùng. Nhờ AI1 nâng cấp giao diện. KHÔNG cần backend đổi gì thêm.

## Request BE-006

Need:
Nút Lưu / Chia sẻ bài viết + tab "Đã lưu"; nút thích bình luận.

Reason:
Đã có API post save/share + comment like.

Data Returned:
- `POST /posts/:id/save`            -> { saved: boolean }     (toggle, cập nhật nút + saveCount)
- `GET  /posts/saved/:userId`       -> Post[]                 (tab "Bài viết đã lưu")
- `POST /posts/:id/share` body { content? } -> Post mới (type SHARE, kèm sharedFrom để render lại bài gốc)
- `POST /posts/comments/:commentId/like` -> { liked: boolean } (toggle tim cho comment)
Post object có sẵn: likes, commentCount, shareCount, saveCount, sharedFrom { user, content, mediaUrls }.

Priority:
HIGH

## Request BE-007

Need:
UI đánh giá sao + bookmark tài liệu; tab "Tài liệu đã lưu".

Reason:
Đã có API material review/rating + bookmark.

Data Returned:
- `POST /materials/:id/reviews` body { rating: 1..5, comment? } -> review
- `GET  /materials/:id/reviews` -> [{ rating, comment, createdAt, user{ fullName, avatarUrl } }]
- `POST /materials/:id/bookmark` -> { bookmarked: boolean }
- `GET  /materials/bookmarks/:userId` -> Material[]
Material có rating (trung bình) + reviewCount + downloadCount để hiển thị.

Priority:
HIGH

## Request BE-008

Need:
Trang chi tiết sự kiện: nút Tham gia/Rời, QR check-in, danh sách người tham gia (organizer).

Reason:
Đã có API event update/delete/leave/checkin/attendees.

Data Returned:
- `POST   /events/:id/join`      -> attendee
- `DELETE /events/:id/join`      -> { left: true }
- `POST   /events/:id/checkin`   -> attendee { status: 'CHECKED_IN' }
- `GET    /events/:id/attendees` -> [{ status, user{ fullName, avatarUrl, studentId, major } }]
- `PUT/DELETE /events/:id` cho organizer (sửa/xóa sự kiện).
Event có attendeeCount, maxAttendees, qrCodeEnabled.

Priority:
MEDIUM

## Request BE-009

Need:
Quản lý nhóm học: nút Sửa/Xóa (chủ nhóm), gửi yêu cầu tham gia, duyệt/từ chối yêu cầu.

Reason:
Đã có API study-group CRUD + join-requests.

Data Returned:
- `PUT/DELETE /study-groups/:id` (chủ nhóm)
- `POST /study-groups/:id/join-requests` -> tạo yêu cầu
- `GET  /study-groups/:id/join-requests` -> [{ user{...} }] (chủ nhóm xem)
- `PUT  /study-groups/:id/join-requests/:requestId` body { action: "accept"|"reject" }
StudyGroup có memberCount, maxMembers, status.

Priority:
MEDIUM

## Request BE-010

Need:
Trang Bảng xếp hạng (reputation leaderboard) + huy hiệu trên hồ sơ.

Reason:
Đã có reputation system + badges.

Data Returned:
- `GET /reputation/leaderboard?limit=20` -> [{ id, fullName, avatarUrl, major, cohort, reputationScore, badges:[{badge}] }]
- `GET /reputation/:userId` -> { reputationScore, badges:[{ badge, earnedAt }] }
- Profile API (`GET /users/:id/profile`) đã trả badges + reputationScore để gắn huy hiệu lên avatar/hồ sơ.

Priority:
LOW

## Request BE-011

Need:
Admin dashboard: biểu đồ DAU/MAU + tăng trưởng, hàng đợi báo cáo & nút xử lý.

Reason:
Đã có admin analytics + moderation + Report.

Data Returned:
- `GET /admin/analytics` -> { users{ total, dau, mau, newThisWeek, suspended }, content{ posts, postsThisWeek, comments, materials, products }, moderation{ pendingReports } }
- `GET /admin/growth?days=14` -> [{ date, users, posts }]  (vẽ line chart)
- `GET /admin/reports?status=PENDING` -> Report[]
- `PUT /admin/reports/:id/resolve` body { status: "REVIEWED"|"RESOLVED"|"DISMISSED" }
- `DELETE /admin/content/:targetType/:targetId` (gỡ nội dung vi phạm)

Priority:
MEDIUM
