# CampusConnect - RESTful API Design

## Base URL
- Development: `http://localhost:3001/api/v1`
- Production: `https://api.campusconnect.vn/api/v1`

## Authentication

### POST /auth/register
Register a new student account with email verification.
```json
Request:
{
  "email": "student@cmc.edu.vn",
  "password": "securePassword123!",
  "fullName": "Nguyen Van A",
  "studentId": "CMC2023001",
  "department": "Khoa CNTT",
  "major": "Kỹ thuật phần mềm",
  "cohort": "K15"
}
Response: 201 { "message": "OTP sent to email", "userId": "uuid" }
```

### POST /auth/verify-otp
Verify OTP code sent to email.
```json
Request: { "userId": "uuid", "otp": "123456" }
Response: 200 { "accessToken": "jwt", "refreshToken": "jwt", "user": {...} }
```

### POST /auth/login
Login with email + password.
```json
Request: { "email": "student@cmc.edu.vn", "password": "securePassword123!" }
Response: 200 { "accessToken": "jwt", "refreshToken": "jwt", "user": {...} }
```

### POST /auth/login/google
Login with Google OAuth.
```json
Request: { "idToken": "google-id-token" }
Response: 200 { "accessToken": "jwt", "refreshToken": "jwt", "user": {...} }
```

### POST /auth/login/microsoft
Login with Microsoft OAuth.
```json
Request: { "idToken": "microsoft-id-token" }
Response: 200 { "accessToken": "jwt", "refreshToken": "jwt", "user": {...} }
```

### POST /auth/refresh
Refresh access token.
```json
Request: { "refreshToken": "jwt" }
Response: 200 { "accessToken": "jwt", "refreshToken": "jwt" }
```

### POST /auth/logout
Revoke refresh token.
```json
Request: { "refreshToken": "jwt" }
Response: 200 { "message": "Logged out" }
```

### POST /auth/2fa/enable
Enable two-factor authentication.
```json
Request: { "userId": "uuid" }
Response: 200 { "secret": "base32", "qrCode": "data:image/png;base64,..." }
```

---

## Student Profile

### GET /users/:id
Get user profile.
```
Response: 200 {
  "id": "uuid", "email": "...", "fullName": "...",
  "studentId": "...", "department": "...", "major": "...",
  "cohort": "...", "bio": "...", "avatarUrl": "...",
  "reputationScore": 1250, "badges": [...], "skills": [...],
  "achievements": [...], "certificates": [...], "projects": [...]
}
```

### PUT /users/:id
Update user profile. (Authenticated)
```json
Request: { "bio": "...", "avatarUrl": "..." }
Response: 200 { ...updated user }
```

### POST /users/:id/avatar
Upload avatar. (Multipart form-data)
```
Response: 200 { "avatarUrl": "/avatars/userId-timestamp.png" }
```

### GET /users/:id/skills
Get user skills.
### POST /users/:id/skills
Add skill. `Request: { "skill": "React", "level": "advanced" }`
### DELETE /users/:id/skills/:skillId
Remove skill.

---

## Social Network

### GET /posts/feed
Get paginated feed posts. (Authenticated)
```
Query: ?page=1&limit=20&subject=CS&sortBy=relevance
Response: 200 { "posts": [...], "hasMore": true }
```

### POST /posts
Create a new post. (Authenticated)
```json
Request: {
  "content": "Hello world!",
  "type": "TEXT",
  "mediaUrls": [],
  "visibility": "PUBLIC"
}
Response: 201 { ...created post }
```

### POST /posts/:id/like
Toggle like on a post.
### POST /posts/:id/comment
Add comment. `Request: { "content": "...", "parentId": "uuid?" }`
### POST /posts/:id/share
Share a post. `Request: { "content": "..." }`
### POST /posts/:id/save
Save/bookmark a post.
### POST /posts/:id/poll/vote
Vote on poll. `Request: { "optionIndex": 0 }`

### GET /posts/:id/comments
Get paginated comments.
### POST /comments/:id/like
Toggle like on comment.

---

## Study Groups

### GET /groups
Get study groups with filters.
```
Query: ?subject=AI&status=open&page=1&limit=20
```

### POST /groups
Create study group. (Authenticated)
```json
Request: {
  "title": "Tìm người học Java",
  "subject": "Lập trình Web",
  "description": "...",
  "location": "Thư viện P.201",
  "maxMembers": 5,
  "scheduledTime": "2025-06-20T18:00:00Z",
  "schedule": "T3, T5 - 18:00"
}
```

### GET /groups/:id
Get group details with members.
### POST /groups/:id/join
Request to join group.
### POST /groups/:id/join/:requestId/approve
Approve join request. (Creator only)
### POST /groups/:id/join/:requestId/reject
Reject join request.
### POST /groups/:id/leave
Leave group.

---

## Material Hub

### GET /materials
Get materials with filters.
```
Query: ?subject=CS&fileType=PDF&sort=downloads&page=1&limit=20
```

### POST /materials
Upload material. (Multipart form-data + metadata)
```json
Request: {
  "title": "...", "subject": "...", "semester": "HK1",
  "description": "...", "tags": ["CTDL", "Giải thuật"]
}
```

### GET /materials/:id
Get material details + reviews.
### POST /materials/:id/download
Track download (increments counter).
### POST /materials/:id/bookmark
Bookmark material.
### POST /materials/:id/review
Review material. `Request: { "rating": 5, "comment": "..." }`
### GET /materials/:id/ai-summary
Get AI-generated summary. (Requires AI service)

---

## Mentor Connect

### GET /mentors
Get available mentors.
```
Query: ?expertise=React&available=true
```

### POST /mentors/profile
Create mentor profile. (Authenticated)
```json
Request: {
  "bio": "...", "expertise": ["React", "NestJS"],
  "gpa": 3.9, "schedule": [{ "day": "T3", "time": "18:00-20:00" }]
}
```

### GET /mentors/:id
Get mentor details + reviews.
### POST /mentors/:id/book
Book a mentor session.
```json
Request: { "scheduledAt": "2025-06-20T18:00:00Z", "topic": "React Hooks" }
```

### GET /mentors/bookings
Get my bookings (as mentee).
### GET /mentors/bookings/mentor
Get my bookings (as mentor).
### POST /mentors/bookings/:id/status
Update booking status. `Request: { "status": "CONFIRMED" }`
### POST /mentors/bookings/:id/review
Review mentor after session. `Request: { "rating": 5, "comment": "..." }`

---

## Marketplace

### GET /marketplace
Get products with filters.
```
Query: ?category=Laptop&status=available&page=1&limit=20
```

### POST /marketplace
Create product listing. (Authenticated)
```json
Request: {
  "title": "Laptop Dell XPS 13",
  "description": "...",
  "price": 12500000,
  "category": "Laptop",
  "condition": "Đã dùng 1 năm",
  "location": "Ký túc xá A"
}
```

### GET /marketplace/:id
Get product details.
### PUT /marketplace/:id
Update product. (Seller only)
### POST /marketplace/:id/buy
Mark as sold. `Request: { "buyerId": "uuid" }`
### DELETE /marketplace/:id
Remove product. (Seller only)

---

## Events

### GET /events
Get events.
```
Query: ?type=Workshop&status=PUBLISHED&page=1&limit=20
```

### POST /events
Create event. (Club leader or Admin)
```json
Request: {
  "title": "Workshop React 19",
  "description": "...",
  "type": "Workshop",
  "location": "Hội trường A",
  "startDate": "2025-06-15T14:00:00Z",
  "endDate": "2025-06-15T17:00:00Z",
  "maxAttendees": 200
}
```

### GET /events/:id
Get event details.
### POST /events/:id/register
Register for event.
### POST /events/:id/checkin
Check-in with QR code. `Request: { "qrCode": "..." }`
### GET /events/:id/attendees
Get attendee list.
### GET /events/:id/export
Export attendees to Excel.

---

## Chat

### GET /chat/conversations
Get user's conversations.
### POST /chat/conversations
Create conversation (direct or group).
```json
Request: { "type": "DIRECT", "memberIds": ["uuid"] }
```

### GET /chat/conversations/:id/messages
Get messages in conversation.
### POST /chat/conversations/:id/messages
Send message.
```json
Request: { "content": "Hello!", "messageType": "text" }
```

### PUT /chat/conversations/:id/messages/:msgId/read
Mark message as read.

---

## AI Assistant

### POST /ai/summarize
Summarize a document.
```json
Request: { "text": "..." } or { "materialId": "uuid" }
Response: 200 { "summary": "..." }
```

### POST /ai/generate-outline
Generate study outline.
```json
Request: { "subject": "Xác suất thống kê", "examDate": "2025-07-01" }
Response: 200 { "outline": "..." }
```

### POST /ai/generate-flashcards
Generate flashcards.
```json
Request: { "topic": "Sorting Algorithms", "count": 10 }
Response: 200 { "flashcards": [{ "front": "...", "back": "..." }] }
```

### POST /ai/generate-questions
Generate quiz questions.
```json
Request: { "topic": "Binary Search Tree", "count": 10, "difficulty": "medium" }
Response: 200 { "questions": [{ "question": "...", "options": [...], "answer": "..." }] }
```

### POST /ai/study-plan
Generate study plan.
```json
Request: {
  "subjects": ["CTDL", "XSTK"],
  "startDate": "2025-06-15",
  "endDate": "2025-07-01",
  "hoursPerDay": 3
}
Response: 200 { "plan": [...] }
```

### POST /ai/course-recommendations
Recommend courses.
```json
Request: { "goal": "Frontend Developer", "currentLevel": "intermediate" }
Response: 200 { "courses": [...] }
```

---

## Reputation

### GET /reputation/:userId
Get user reputation details.
```
Response: 200 {
  "score": 1250, "badges": [...], "history": [...]
}
```

### POST /reputation/award
Award reputation points (internal, not user-facing).
```json
Request: { "userId": "uuid", "action": "MATERIAL_UPLOADED", "points": 10 }
```

---

## Admin

### GET /admin/dashboard
Get dashboard statistics. (Admin only)
```
Response: 200 {
  "totalUsers": 12847, "dau": 3456, "mau": 8901,
  "totalPosts": 45678, "totalMaterials": 1234,
  "totalEvents": 56, "userGrowth": [...],
  "retentionRate": 0.72
}
```

### GET /admin/users
List all users with filters.
### POST /admin/users/:id/suspend
Suspend user.
### POST /admin/users/:id/unsuspend
Unsuspend user.
### GET /admin/reports
Get reported content.
### POST /admin/reports/:id/resolve
Resolve report.

---

## Rate Limiting

| Endpoint | Limit |
|---|---|
| /auth/* | 10 req/min per IP |
| /posts/* | 60 req/min per user |
| /chat/* | 120 req/min per user |
| /ai/* | 20 req/min per user |
| All others | 100 req/min per user |
