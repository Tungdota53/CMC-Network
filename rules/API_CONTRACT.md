# API Contract (AI1 ⇄ AI2)

Gateway routes by first path segment. All paths below go through the gateway.
Auth: optional-auth mode — token preferred (`Authorization: Bearer`), body `userId`/`creatorId`/`sellerId`/`uploaderId` fallback accepted during compat window.

## Error envelope chuẩn (mọi service — hỗ trợ REQ-FE-POLISH-005 mục 5)
Mọi lỗi (4xx/5xx) trả về CÙNG một shape qua `AllExceptionsFilter`, gateway passthrough nguyên status + body:
{
  statusCode: number,          // 400/401/403/404/409/429/500/503...
  message: string | string[],  // LƯU Ý: có thể là MẢNG (ValidationPipe trả nhiều lỗi field). FE nên: Array.isArray(message) ? message.join(', ') : message
  error: string,               // ví dụ "Bad Request", "Forbidden", "Conflict"
  path: string,
  timestamp: string
}
Gợi ý map status → toast cho FE:
- 400 dữ liệu không hợp lệ (đọc `message`) · 401 phiên hết hạn, đăng nhập lại · 403 không có quyền
- 404 không tìm thấy · 409 trùng/đã tồn tại · 429 thao tác quá nhanh (có header Retry-After)
- 503 dịch vụ tạm gián đoạn (service downstream không reachable) · 5xx khác: lỗi hệ thống
Rate limit headers (mọi response): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Notifications
GET /notifications
Response:
{
  success: true,
  data: [
    { id: string, type: string, message: string, relatedId: string | null, isRead: boolean, createdAt: string }
  ]
}

GET /notifications/:userId/unread-count   -> { count: number }
POST /notifications/:userId/:id/read
POST /notifications/:userId/read-all

## Study Groups (FE-001)
GET    /study-groups
POST   /study-groups
PUT    /study-groups/:id                          (creator only)
DELETE /study-groups/:id                           (creator only)
POST   /study-groups/:id/join-requests             (request to join)
GET    /study-groups/:id/join-requests             (creator only)
PUT    /study-groups/:id/join-requests/:requestId  body: { action: "accept" | "reject" }

## Materials (FE-002)
GET    /materials?subject=
POST   /materials/upload
PUT    /materials/:id          (uploader only)
DELETE /materials/:id          (uploader only)
POST   /materials/:id/download -> { id, downloadCount, s3Url }

## Marketplace (FE-003)
GET    /marketplace?status=
POST   /marketplace
POST   /marketplace/upload     (multipart 'file') -> { url }
PUT    /marketplace/:id         (seller only)
PUT    /marketplace/:id/status  body: { status }  (seller only)
DELETE /marketplace/:id         (seller only)

## Search (FE-004)
GET /search?q=<query>&take=5
Response:
{
  users:     [{ id, fullName, avatarUrl, major, cohort }],
  groups:    [{ id, title, subject, memberCount, maxMembers }],
  materials: [{ id, title, subject, fileType, downloadCount }],
  products:  [{ id, title, price, category, status, images }],
  posts:     [{ id, content, createdAt, user: { id, fullName, avatarUrl } }]
}

## Profile (FE-005)
GET /users/:id/profile   -> core fields + postCount, friendCount, badges, skills
GET /users/:id/posts?limit=
GET /users/:id/friends
GET /users/:id/photos    -> [{ url, postId, createdAt }]
PUT /users/:id/profile
POST /users/:id/avatar    (multipart 'file')
PUT /users/:id/cover      body: { coverPhotoUrl }

## Realtime (socket — chat-service)
Handshake query: ?userId=<id>
Events emitted: notification-<userId>, presence, typing-<conversationId>, messageStatus-<conversationId>

Socket payload `notification-<userId>` (khoá schema, khớp REST `GET /notifications`):
{ type: string, message: string, relatedId?: string, createdAt: string }

## Social interactions (bổ sung 2026-06-06)
POST /posts/:id/save                  -> { saved: boolean }   (toggle bookmark)
GET  /posts/saved/:userId             -> Post[]
POST /posts/:id/share   body { content? } -> shared Post (type SHARE, sharedFrom)
POST /posts/comments/:commentId/like  -> { liked: boolean }   (toggle)

## Materials (bổ sung 2026-06-06)
POST /materials/:id/reviews  body { rating:1..5, comment? } -> review (cập nhật rating tb)
GET  /materials/:id/reviews  -> review[] (kèm user)
POST /materials/:id/bookmark -> { bookmarked: boolean }      (toggle)
GET  /materials/bookmarks/:userId -> Material[]

## Events (bổ sung 2026-06-06)
PUT    /events/:id            (organizer only)
DELETE /events/:id            (organizer only)
DELETE /events/:id/join       (leave event)
POST   /events/:id/checkin    -> attendee status CHECKED_IN
GET    /events/:id/attendees  -> attendee[] (kèm user)

## Portfolio hồ sơ (bổ sung 2026-06-07 — BE-EXT-PORTFOLIO)
Tất cả qua prefix `users`. Đọc công khai theo `:id`. Mutating dùng token-first
(Authorization: Bearer) — fallback body `userId` trong compat window. Xóa/thêm
chỉ cho chủ sở hữu (403 nếu cố sửa của người khác).

GET    /users/:id/portfolio
Response:
{
  skills:       [{ id, skill, level }],
  achievements: [{ id, title, description, earnedAt }],
  certificates: [{ id, name, issuer, issuedAt, credentialUrl }],
  projects:     [{ id, title, description, techStack: string[], githubUrl, demoUrl, createdAt }]
}

POST   /users/:id/skills          body { skill, level? }            -> skill        (409 nếu trùng)
DELETE /users/:id/skills/:skillId
POST   /users/:id/achievements    body { title, description? }      -> achievement
DELETE /users/:id/achievements/:achievementId
POST   /users/:id/certificates    body { name, issuer, issuedAt, credentialUrl? } -> certificate (400 nếu thiếu name/issuer hoặc ngày sai)
DELETE /users/:id/certificates/:certificateId
POST   /users/:id/projects        body { title, description?, techStack?, githubUrl?, demoUrl? } -> project
DELETE /users/:id/projects/:projectId

## Gateway (bổ sung 2026-06-07 — BE-UP-GATEWAY)
- Query string được forward nguyên vẹn (`/search?q=`, `/materials?subject=`, `/marketplace?status=`).
- Status code downstream được passthrough đúng (400/401/403/404/409...). Service không reachable -> 503. Timeout mặc định 15s (`GATEWAY_TIMEOUT_MS`).

## Lưu ý exceptions (2026-06-06)
- Đã thay toàn bộ `throw new Error` bằng Nest HttpException → trả đúng mã:
  403 (không có quyền sửa/xóa post), 400 (nội dung rỗng / tự kết bạn), 409 (đã là bạn / đã có lời mời).

