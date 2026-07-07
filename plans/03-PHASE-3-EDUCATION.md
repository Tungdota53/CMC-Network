# PHASE 3: EDUCATION
## Study Matching + Material Hub + Mentor Connect + AI Assistant

> **Duration:** Tuần 13-18 (42 ngày)
> **Prerequisite:** Phase 2 hoàn thành (Social + Chat)
> **Goal:** Sinh viên có thể tìm nhóm học, chia sẻ tài liệu, tìm mentor, sử dụng AI
> **UI Rule:** Tất cả icon dùng inline SVG (Lucide) — KHÔNG dùng emoji. Xem Icon Mapping Table.

---

## MỤC LỤC

- [Step 3.1: Study Matching Backend](#step-31-study-matching-backend)
- [Step 3.2: Study Matching Frontend](#step-32-study-matching-frontend)
- [Step 3.3: Material Hub Backend](#step-33-material-hub-backend)
- [Step 3.4: Material Hub Frontend](#step-34-material-hub-frontend)
- [Step 3.5: AI Integration](#step-35-ai-integration)
- [Step 3.6: Mentor Connect Backend](#step-36-mentor-connect-backend)
- [Step 3.7: Mentor Connect Frontend](#step-37-mentor-connect-frontend)
- [Step 3.8: Integration & Testing](#step-38-integration--testing)

---

## STEP 3.1: STUDY MATCHING BACKEND

> **Duration:** 5 ngày | **Assign:** Dev 2
> **Prerequisite:** Phase 2

### Prisma Schema (thêm)

> **⚠️ User model additions (BẮT BUỘC để Prisma compile).**
> Gom toàn bộ relation ngược của Phase 3 (Study + Material + AI + Mentor) vào `model User` (định nghĩa ở Phase 1).
> Relation có tên phải khớp đúng tên khai ở model con.
>
> ```prisma
> model User {
>   // ... field & relation từ Phase 1 + Phase 2 ...
>
>   // --- Study Matching (3.1) ---
>   studyGroupsCreated StudyGroup[]
>   studyGroupMembers  StudyGroupMember[]
>   studyRequests      StudyRequest[]
>
>   // --- Material Hub (3.3) ---
>   materials          Material[]
>   materialRatings    MaterialRating[]
>   materialComments   MaterialComment[]
>   materialBookmarks  MaterialBookmark[]
>
>   // --- AI (3.5) ---
>   aiConversations    AiConversation[]
>
>   // --- Mentor Connect (3.6) ---
>   mentorProfile      MentorProfile?
>   mentorSessions     MentorSession[]   @relation                // as mentee (menteeId)
>   reviewsGiven       MentorReview[]    @relation("reviewer")
>   reviewsReceived    MentorReview[]    @relation("reviewed")
> }
> ```
>
> *Lưu ý:* `StudyGroup.subjectId`, `Material.subjectId`/`facultyId` tham chiếu `Subject`/`Faculty` (Phase 1) —
> phải thêm relation ngược tương ứng vào `Subject`/`Faculty` nếu chưa có.

```prisma
enum StudyGroupType {
  STUDY
  PROJECT
  RESEARCH
  EXAM_PREP
}

enum StudyGroupStatus {
  OPEN
  FULL
  CLOSED
  COMPLETED
}

enum GroupMemberRole {
  LEADER
  MEMBER
}

enum GroupMemberStatus {
  PENDING
  ACCEPTED
  REJECTED
  LEFT
}

enum StudyRequestType {
  FIND_PARTNER
  FIND_GROUP
  FIND_TUTOR
}

enum RequestStatus {
  ACTIVE
  MATCHED
  CLOSED
}

model StudyGroup {
  id             String           @id @default(uuid())
  creatorId      String           @map("creator_id")
  title          String
  description    String?
  subjectId      String?          @map("subject_id")
  type           StudyGroupType   @default(STUDY)
  location       String?
  maxMembers     Int              @default(10) @map("max_members")
  currentMembers Int              @default(1) @map("current_members")
  status         StudyGroupStatus @default(OPEN)
  schedule       Json             @default("{}") // { days: [], time: "18:00-20:00" }
  startDate      DateTime?        @map("start_date")
  endDate        DateTime?        @map("end_date")
  conversationId String?          @unique @map("conversation_id") // Auto-created group chat
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  creator  User               @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  subject  Subject?           @relation(fields: [subjectId], references: [id])
  members  StudyGroupMember[]

  @@index([subjectId])
  @@index([status])
  @@index([creatorId])
  @@map("study_groups")
}

model StudyGroupMember {
  id        String            @id @default(uuid())
  groupId   String            @map("group_id")
  userId    String            @map("user_id")
  role      GroupMemberRole   @default(MEMBER)
  status    GroupMemberStatus @default(PENDING)
  joinedAt  DateTime?         @map("joined_at")
  createdAt DateTime          @default(now()) @map("created_at")

  group StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("study_group_members")
}

model StudyRequest {
  id                String           @id @default(uuid())
  userId            String           @map("user_id")
  title             String
  description       String?
  subjectId         String?          @map("subject_id")
  type              StudyRequestType @default(FIND_PARTNER)
  preferredTime     String?          @map("preferred_time")
  preferredLocation String?          @map("preferred_location")
  status            RequestStatus    @default(ACTIVE)
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subject Subject? @relation(fields: [subjectId], references: [id])

  @@index([subjectId])
  @@index([status])
  @@map("study_requests")
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/study-groups` | Danh sách (filter: subject, type, status) |
| `POST` | `/study-groups` | Tạo nhóm (auto-create group chat) |
| `GET` | `/study-groups/:id` | Chi tiết nhóm |
| `PUT` | `/study-groups/:id` | Cập nhật |
| `DELETE` | `/study-groups/:id` | Xóa |
| `POST` | `/study-groups/:id/join` | Xin vào |
| `POST` | `/study-groups/:id/approve/:userId` | Duyệt |
| `POST` | `/study-groups/:id/reject/:userId` | Từ chối |
| `DELETE` | `/study-groups/:id/leave` | Rời nhóm |
| `GET` | `/study-groups/my` | Nhóm của tôi |
| `GET` | `/study-groups/suggestions` | Gợi ý nhóm phù hợp |
| `GET` | `/study-requests` | Danh sách yêu cầu |
| `POST` | `/study-requests` | Tạo yêu cầu |
| `PUT` | `/study-requests/:id` | Cập nhật |
| `DELETE` | `/study-requests/:id` | Xóa |
| `GET` | `/study-requests/matches` | Gợi ý người phù hợp |

### Matching Algorithm

```typescript
// Scoring criteria
const MATCH_WEIGHTS = {
  SAME_SUBJECT: 80,         // Cùng môn học
  SAME_FACULTY: 20,         // Cùng khoa
  SAME_ACADEMIC_YEAR: 15,   // Cùng khóa
  SIMILAR_SKILLS: 10,       // Kỹ năng tương tự (per skill)
  MUTUAL_FRIENDS: 5,        // Bạn chung (per friend)
  TIME_OVERLAP: 25,         // Khung giờ trùng
  LOCATION_MATCH: 15,       // Địa điểm phù hợp
};
```

### Tích hợp Chat

Khi tạo Study Group → tự động tạo Group Chat (Conversation type=GROUP) cho tất cả members.

### Checklist Step 3.1

```
[ ] StudyGroup CRUD
[ ] StudyGroupMember management (join/approve/reject/leave/kick)
[ ] Auto-create group chat khi tạo nhóm
[ ] Study request CRUD
[ ] Matching algorithm (score-based)
[ ] Group suggestions
[ ] Filter: by subject, type, status, location
[ ] Pagination
[ ] Only creator/leader can approve members
[ ] Auto-update currentMembers count
[ ] Auto-set status to FULL when max reached
[ ] Unit tests
```

---

## STEP 3.2: STUDY MATCHING FRONTEND

> **Duration:** 5 ngày | **Assign:** Dev 4
> **Prerequisite:** Step 3.1

### Pages

- `/study` — Landing: tabs [Nhóm học | Tìm bạn học]
- `/study/groups` — Danh sách nhóm (filter + search)
- `/study/groups/:id` — Chi tiết nhóm (members, schedule, chat)
- `/study/groups/create` — Tạo nhóm
- `/study/requests` — Yêu cầu tìm bạn
- `/study/requests/create` — Tạo yêu cầu

### Key Components

```
components/study/
├── StudyGroupCard.tsx        # Card nhóm học
├── StudyRequestCard.tsx      # Card yêu cầu
├── MatchSuggestion.tsx       # Card gợi ý
├── GroupMemberList.tsx       # Danh sách thành viên
├── CreateGroupForm.tsx       # Form tạo nhóm
├── SchedulePicker.tsx        # Chọn lịch học
└── SubjectFilter.tsx         # Filter theo môn
```

### Checklist Step 3.2

```
[ ] Study landing page
[ ] Study group list with filters
[ ] Study group detail page
[ ] Create study group form (with schedule picker)
[ ] Join/leave group
[ ] Member management (for leaders)
[ ] Study request list
[ ] Create study request form
[ ] Match suggestions display
[ ] Link to group chat
[ ] Empty states
[ ] Mobile responsive
```

---

## STEP 3.3: MATERIAL HUB BACKEND

> **Duration:** 5 ngày | **Assign:** Dev 1
> **Prerequisite:** Phase 2

### Prisma Schema (thêm)

```prisma
enum MaterialType {
  PDF
  DOCX
  PPTX
  ZIP
  OTHER
}

enum ContentStatus {
  PENDING
  APPROVED
  REJECTED
}

model Material {
  id             String        @id @default(uuid())
  uploaderId     String        @map("uploader_id")
  title          String
  description    String?
  subjectId      String?       @map("subject_id")
  facultyId      String?       @map("faculty_id")
  semester       String?
  type           MaterialType  @default(PDF)
  fileUrl        String        @map("file_url")
  fileName       String        @map("file_name")
  fileSize       Int           @map("file_size")
  downloadCount  Int           @default(0) @map("download_count")
  avgRating      Float         @default(0) @map("avg_rating")
  ratingCount    Int           @default(0) @map("rating_count")
  status         ContentStatus @default(PENDING)
  aiSummary      String?       @map("ai_summary")
  aiFlashcards   Json?         @map("ai_flashcards")
  aiQuizQuestions Json?        @map("ai_quiz_questions")
  aiOutline      String?       @map("ai_outline")
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  uploader  User              @relation(fields: [uploaderId], references: [id], onDelete: Cascade)
  subject   Subject?          @relation(fields: [subjectId], references: [id])
  faculty   Faculty?          @relation(fields: [facultyId], references: [id])
  ratings   MaterialRating[]
  comments  MaterialComment[]
  bookmarks MaterialBookmark[]

  @@index([subjectId])
  @@index([facultyId])
  @@index([status])
  @@index([avgRating(sort: Desc)])
  @@map("materials")
}

model MaterialRating {
  id         String   @id @default(uuid())
  materialId String   @map("material_id")
  userId     String   @map("user_id")
  rating     Int      // 1-5
  review     String?
  createdAt  DateTime @default(now()) @map("created_at")

  material Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([materialId, userId])
  @@map("material_ratings")
}

model MaterialComment {
  id         String   @id @default(uuid())
  materialId String   @map("material_id")
  userId     String   @map("user_id")
  parentId   String?  @map("parent_id")
  content    String
  createdAt  DateTime @default(now()) @map("created_at")

  material Material         @relation(fields: [materialId], references: [id], onDelete: Cascade)
  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent   MaterialComment? @relation("MaterialCommentReplies", fields: [parentId], references: [id])
  replies  MaterialComment[] @relation("MaterialCommentReplies")

  @@map("material_comments")
}

model MaterialBookmark {
  id         String   @id @default(uuid())
  materialId String   @map("material_id")
  userId     String   @map("user_id")
  createdAt  DateTime @default(now()) @map("created_at")

  material Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([materialId, userId])
  @@map("material_bookmarks")
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/materials` | Danh sách (filter: subject, faculty, semester, type) |
| `POST` | `/materials` | Upload tài liệu |
| `GET` | `/materials/:id` | Chi tiết |
| `PUT` | `/materials/:id` | Cập nhật |
| `DELETE` | `/materials/:id` | Xóa |
| `GET` | `/materials/:id/download` | Download (increment count) |
| `POST` | `/materials/:id/rate` | Đánh giá (1-5) |
| `GET` | `/materials/:id/ratings` | Danh sách đánh giá |
| `GET` | `/materials/:id/comments` | Bình luận |
| `POST` | `/materials/:id/comments` | Thêm bình luận |
| `POST` | `/materials/:id/bookmark` | Bookmark |
| `DELETE` | `/materials/:id/bookmark` | Bỏ bookmark |
| `GET` | `/materials/bookmarks` | Danh sách bookmark |
| `GET` | `/materials/my` | Tài liệu của tôi |
| `GET` | `/materials/search` | Tìm kiếm (full-text) |

### File Upload Pipeline

```typescript
// Upload flow:
// 1. Frontend: chọn file → validate (type + size ≤ 50MB)
// 2. Backend: POST /materials (multipart/form-data)
//    a. Validate MIME type (magic bytes)
//    b. Generate unique filename: {uuid}.{ext}
//    c. Upload qua StorageService (dev: local disk, prod: MinIO/S3)
//    d. Create Material record (status = PENDING)
//    e. Queue AI processing job (BullMQ — đã chốt thay RabbitMQ ở Master Plan §3)
// 3. Worker: Process AI tasks (async, BullMQ consumer)
//    a. Extract text from PDF/DOCX/PPTX
//    b. Generate AI summary
//    c. Generate flashcards
//    d. Generate quiz questions
//    e. Update Material record

const ALLOWED_MATERIAL_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/zip': 'ZIP',
};
const MAX_MATERIAL_SIZE = 50 * 1024 * 1024; // 50MB
```

### Checklist Step 3.3

```
[ ] Material CRUD with file upload
[ ] File validation (type, size, magic bytes)
[ ] Upload via StorageService (dev: local disk, prod: MinIO/S3)
[ ] Download with count increment
[ ] Rating system (1-5 stars, avg calculation)
[ ] Comment system (nested)
[ ] Bookmark system
[ ] Filter: by subject, faculty, semester, type
[ ] Search: by title (full-text)
[ ] Status management (PENDING → APPROVED by mod/admin)
[ ] BullMQ job for AI processing
[ ] Reputation points on upload (+10)
[ ] Unit tests
```

---

## STEP 3.4: MATERIAL HUB FRONTEND

> **Duration:** 5 ngày | **Assign:** Dev 3
> **Prerequisite:** Step 3.3

### Pages

- `/materials` — Browse (card grid + filters)
- `/materials/:id` — Detail (preview, download, rate, AI tools)
- `/materials/upload` — Upload form
- `/materials/bookmarks` — Bookmarked materials

### Key Components

```
components/materials/
├── MaterialCard.tsx          # Card tài liệu
├── MaterialDetail.tsx        # Trang chi tiết
├── MaterialUploadForm.tsx    # Form upload
├── RatingStars.tsx           # Component đánh giá
├── MaterialFilter.tsx        # Filter sidebar
├── FlashcardViewer.tsx       # Xem flashcard (flip animation)
├── QuizViewer.tsx            # Làm quiz (interactive)
├── AISummary.tsx             # Hiển thị tóm tắt AI
└── FileTypeIcon.tsx          # Icon theo loại file
```

### Checklist Step 3.4

```
[ ] Material browse page (card grid)
[ ] Filter sidebar (subject, faculty, semester, type)
[ ] Search bar
[ ] Material detail page
[ ] Upload form (drag & drop)
[ ] Star rating component
[ ] Comments section
[ ] Bookmark toggle
[ ] Download button with count
[ ] AI summary display
[ ] Flashcard viewer (flip animation)
[ ] Quiz viewer (interactive Q&A)
[ ] Skeleton loading
[ ] Empty states
[ ] Mobile responsive
```

---

## STEP 3.5: AI INTEGRATION

> **Duration:** 7 ngày | **Assign:** Dev 1
> **Prerequisite:** Step 3.3

### Module Structure

```
backend/src/modules/ai/
├── ai.module.ts
├── ai.controller.ts
├── ai.service.ts
├── ai-prompts.ts              # Prompt templates
├── material-ai.service.ts     # Material-specific AI
├── material-ai.processor.ts   # BullMQ consumer
├── dto/
│   ├── ai-message.dto.ts
│   ├── ai-summarize.dto.ts
│   └── ai-study-plan.dto.ts
└── ai.service.spec.ts
```

### AI Features

#### 1. Tóm tắt tài liệu

```typescript
// POST /materials/:id/ai/summarize
const SUMMARIZE_PROMPT = `
Bạn là trợ lý học tập. Hãy tóm tắt tài liệu sau bằng tiếng Việt.
Tóm tắt phải:
- Ngắn gọn (tối đa 500 từ)
- Nêu bật các ý chính
- Có cấu trúc rõ ràng (bullet points)
- Phù hợp cho sinh viên ôn tập

Nội dung tài liệu:
{document_content}
`;
```

#### 2. Sinh Flashcard

```typescript
// POST /materials/:id/ai/flashcards
const FLASHCARD_PROMPT = `
Tạo 10-15 flashcard từ nội dung sau. Mỗi flashcard gồm:
- front: câu hỏi ngắn gọn
- back: câu trả lời ngắn gọn
Output JSON: [{"front": "...", "back": "..."}, ...]

Nội dung: {document_content}
`;
```

#### 3. Sinh Quiz

```typescript
// POST /materials/:id/ai/quiz
const QUIZ_PROMPT = `
Tạo 10 câu hỏi trắc nghiệm từ nội dung sau.
Mỗi câu gồm:
- question: câu hỏi
- options: 4 đáp án (A, B, C, D)
- correct: đáp án đúng
- explanation: giải thích ngắn
Output JSON: [{"question": "...", "options": [...], "correct": "A", "explanation": "..."}, ...]

Nội dung: {document_content}
`;
```

#### 4. AI Chat Assistant

```typescript
// POST /ai/conversations/:id/messages (Server-Sent Events)
// Streaming response

const AI_SYSTEM_PROMPT = `
Bạn là CampusBot, trợ lý học tập AI của CampusConnect.
Nhiệm vụ:
- Trả lời câu hỏi học tập bằng tiếng Việt
- Giải thích khái niệm rõ ràng, dễ hiểu
- Gợi ý phương pháp học tập
- Hỗ trợ lập kế hoạch học
- Không trả lời các câu hỏi không liên quan đến học tập

Quy tắc:
- Luôn trả lời bằng tiếng Việt (trừ thuật ngữ kỹ thuật)
- Sử dụng ví dụ cụ thể
- Khuyến khích sinh viên tự tìm hiểu thêm
- Trích dẫn nguồn khi cần
`;
```

### Prisma Schema (thêm)

```prisma
enum AiRole {
  USER
  ASSISTANT
}

model AiConversation {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  title     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages AiMessage[]

  @@index([userId])
  @@map("ai_conversations")
}

model AiMessage {
  id             String   @id @default(uuid())
  conversationId String   @map("conversation_id")
  role           AiRole
  content        String
  tokensUsed     Int      @default(0) @map("tokens_used")
  createdAt      DateTime @default(now()) @map("created_at")

  conversation AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("ai_messages")
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/conversations` | Danh sách hội thoại AI |
| `POST` | `/ai/conversations` | Tạo mới |
| `GET` | `/ai/conversations/:id` | Chi tiết + messages |
| `DELETE` | `/ai/conversations/:id` | Xóa |
| `POST` | `/ai/conversations/:id/messages` | Gửi tin nhắn (SSE stream) |
| `POST` | `/ai/summarize` | Tóm tắt text bất kỳ |
| `POST` | `/ai/study-plan` | Lập kế hoạch học tập |
| `POST` | `/materials/:id/ai/summarize` | Tóm tắt tài liệu |
| `POST` | `/materials/:id/ai/flashcards` | Sinh flashcard |
| `POST` | `/materials/:id/ai/quiz` | Sinh quiz |
| `POST` | `/materials/:id/ai/outline` | Sinh đề cương |

### Rate Limiting (AI costly)

```
ai/*: 5 requests/minute per user
materials/*/ai/*: 3 requests/hour per material per user
```

### Checklist Step 3.5

```
[ ] OpenAI service wrapper
[ ] Material AI: summarize
[ ] Material AI: generate flashcards (JSON output)
[ ] Material AI: generate quiz (JSON output)
[ ] Material AI: generate outline
[ ] BullMQ worker for async AI processing
[ ] AI Chat: conversation CRUD
[ ] AI Chat: SSE streaming response
[ ] AI Chat: context management (last N messages)
[ ] AI Study Plan generator
[ ] Rate limiting on AI endpoints
[ ] Token usage tracking
[ ] Error handling (API limits, timeouts)
[ ] Frontend: AI chat page
[ ] Frontend: Flashcard viewer (flip animation)
[ ] Frontend: Quiz viewer (interactive, score)
[ ] Frontend: AI summary display
```

---

## STEP 3.6: MENTOR CONNECT BACKEND

> **Duration:** 5 ngày | **Assign:** Dev 2
> **Prerequisite:** Phase 2

### Prisma Schema (thêm)

```prisma
enum MentorStatus {
  ACTIVE
  INACTIVE
  VERIFIED
}

enum SessionStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum MeetingType {
  ONLINE
  OFFLINE
}

model MentorProfile {
  id               String       @id @default(uuid())
  userId           String       @unique @map("user_id")
  bio              String?
  specializations  Json         @default("[]") // ["Java", "AI/ML", "Web Dev"]
  availableSchedule Json        @default("{}") // { mon: ["09:00-11:00"], tue: [...] }
  avgRating        Float        @default(0) @map("avg_rating")
  totalSessions    Int          @default(0) @map("total_sessions")
  totalMentees     Int          @default(0) @map("total_mentees")
  status           MentorStatus @default(ACTIVE)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions MentorSession[]

  @@index([status])
  @@index([avgRating(sort: Desc)])
  @@map("mentor_profiles")
}

model MentorSession {
  id              String        @id @default(uuid())
  mentorId        String        @map("mentor_id")
  menteeId        String        @map("mentee_id")
  topic           String
  description     String?
  scheduledAt     DateTime      @map("scheduled_at")
  durationMinutes Int           @default(60) @map("duration_minutes")
  status          SessionStatus @default(PENDING)
  meetingType     MeetingType   @default(ONLINE) @map("meeting_type")
  meetingLink     String?       @map("meeting_link")
  location        String?
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  mentor  MentorProfile  @relation(fields: [mentorId], references: [id], onDelete: Cascade)
  mentee  User           @relation(fields: [menteeId], references: [id], onDelete: Cascade)
  reviews MentorReview[]

  @@index([mentorId])
  @@index([menteeId])
  @@index([scheduledAt])
  @@map("mentor_sessions")
}

model MentorReview {
  id         String   @id @default(uuid())
  sessionId  String   @map("session_id")
  reviewerId String   @map("reviewer_id")
  reviewedId String   @map("reviewed_id")
  rating     Int      // 1-5
  comment    String?
  createdAt  DateTime @default(now()) @map("created_at")

  session  MentorSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  reviewer User          @relation("reviewer", fields: [reviewerId], references: [id])
  reviewed User          @relation("reviewed", fields: [reviewedId], references: [id])

  @@unique([sessionId, reviewerId])
  @@map("mentor_reviews")
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mentors` | Danh sách mentor (filter, sort by rating) |
| `GET` | `/mentors/:id` | Chi tiết mentor profile |
| `POST` | `/mentors/register` | Đăng ký làm mentor |
| `PUT` | `/mentors/me` | Cập nhật profile mentor |
| `GET` | `/mentors/me/sessions` | Sessions của tôi (as mentor) |
| `POST` | `/mentors/:id/book` | Đặt lịch (as mentee) |
| `PUT` | `/mentor-sessions/:id/confirm` | Xác nhận session |
| `PUT` | `/mentor-sessions/:id/cancel` | Hủy session |
| `PUT` | `/mentor-sessions/:id/complete` | Hoàn thành |
| `POST` | `/mentor-sessions/:id/review` | Đánh giá |
| `GET` | `/mentors/top` | Top mentors |
| `GET` | `/mentors/search` | Tìm theo chuyên môn |
| `GET` | `/my-sessions` | Sessions của tôi (as mentee) |

### Checklist Step 3.6

```
[ ] Mentor profile CRUD
[ ] Register as mentor (set specializations + schedule)
[ ] Session booking flow (mentee books → mentor confirms)
[ ] Session lifecycle (PENDING → CONFIRMED → COMPLETED)
[ ] Cancel session (both sides)
[ ] Review system (after session completed)
[ ] Rating average calculation
[ ] Available time slots (based on schedule - booked)
[ ] Auto-create DM conversation on booking
[ ] Search mentors by specialization
[ ] Top mentors ranking
[ ] Reputation points for mentor sessions (+30)
[ ] Notifications: booking, confirm, cancel, review
[ ] Unit tests
```

---

## STEP 3.7: MENTOR CONNECT FRONTEND

> **Duration:** 5 ngày | **Assign:** Dev 4
> **Prerequisite:** Step 3.6

### Pages

- `/mentors` — Browse mentors (card grid + filters)
- `/mentors/:id` — Mentor profile (reviews, schedule, book)
- `/mentors/register` — Register as mentor
- `/mentors/my-sessions` — My sessions (as mentor/mentee)

### Key Components

```
components/mentor/
├── MentorCard.tsx            # Card mentor
├── MentorProfile.tsx         # Full profile
├── BookingForm.tsx           # Đặt lịch
├── SessionCard.tsx           # Card session
├── SchedulePicker.tsx        # Chọn slot
├── ReviewForm.tsx            # Form đánh giá
├── SpecializationTags.tsx    # Tags chuyên môn
└── MentorRanking.tsx         # Bảng xếp hạng
```

### Checklist Step 3.7

```
[ ] Mentor browse page
[ ] Mentor detail page (bio, reviews, schedule, stats)
[ ] Booking form (pick date/time, topic, description)
[ ] Register as mentor page
[ ] My sessions page (tabs: as mentor / as mentee)
[ ] Session card with status badges
[ ] Review form (stars + comment)
[ ] Available slots calendar view
[ ] Top mentors section
[ ] Filter by specialization
[ ] Mobile responsive
```

---

## STEP 3.8: INTEGRATION & TESTING

> **Duration:** 3 ngày | **Assign:** Toàn team

### Tasks

```
[ ] Study group: create → join → chat → complete
[ ] Material: upload → AI process → download → rate
[ ] Mentor: register → book → confirm → complete → review
[ ] AI: chat → summarize → flashcard → quiz
[ ] Cross-module: study group links to chat
[ ] Cross-module: material linked to subjects
[ ] Performance: AI responses < 10s (streaming)
[ ] Performance: file upload < 5s (50MB)
[ ] All pages responsive
[ ] Unit tests ≥75%
[ ] Deploy to staging
```

---

## DEPENDENCIES

```
Step 3.1 (Study BE) ──→ Step 3.2 (Study FE) ──┐
Step 3.3 (Material BE) ──→ Step 3.4 (Material FE) ──┤──→ Step 3.8
Step 3.5 (AI) ─────────────────────────────────┤
Step 3.6 (Mentor BE) ──→ Step 3.7 (Mentor FE) ──┘
```

### Parallel Work

| Dev | Tuần 13-14 | Tuần 15-16 | Tuần 17-18 |
|-----|-----------|-----------|-----------|
| Dev 1 | 3.3 Material BE | 3.5 AI Integration | Code review |
| Dev 2 | 3.1 Study BE | 3.6 Mentor BE | 3.8 |
| Dev 3 | 3.4 Material FE | 3.5 AI FE | 3.8 |
| Dev 4 | 3.2 Study FE | 3.7 Mentor FE | 3.8 |
| Dev 5 | DevOps + StorageService | AI worker setup | 3.8 |

---

> **Output Phase 3:** Sinh viên có thể tìm nhóm học, chia sẻ tài liệu với AI hỗ trợ, và tìm mentor.
>
> **Tiếp theo:** [04-PHASE-4-COMMERCE.md](./04-PHASE-4-COMMERCE.md)
