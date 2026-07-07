# PHASE 2: CORE SOCIAL
## Social Feed + Stories + Friends + Realtime Chat (Messenger-level) + Notifications

> **Duration:** Tuần 7-14 (56 ngày)
> **Prerequisite:** Phase 1 hoàn thành (Auth + Profile)
> **Goal:** Sinh viên có thể đăng bài, đăng story, kết bạn, nhắn tin realtime (giống Messenger), nhận thông báo
> **UI Rule:** KHÔNG sử dụng emoji characters làm icon — tất cả icon dùng inline SVG (Lucide). Xem Icon Mapping Table trong 00-MASTER-PLAN.md.

---

## MỤC LỤC

- [Step 2.1: Social Feed Backend](#step-21-social-feed-backend)
- [Step 2.2: Social Feed Frontend](#step-22-social-feed-frontend)
- [Step 2.2b: Stories System](#step-22b-stories-system)
- [Step 2.3: Friends System](#step-23-friends-system)
- [Step 2.4: Realtime Chat Backend](#step-24-realtime-chat-backend)
- [Step 2.5: Realtime Chat Frontend](#step-25-realtime-chat-frontend)
- [Step 2.6: Notifications System](#step-26-notifications-system)
- [Step 2.7: Integration & Testing](#step-27-integration--testing)

---

## STEP 2.1: SOCIAL FEED BACKEND

> **Duration:** 7 ngày | **Assign:** Dev 1 + Dev 2
> **Prerequisite:** Phase 1 complete

### Prisma Schema (thêm vào schema.prisma)

> **⚠️ User model additions (BẮT BUỘC để Prisma compile).**
> Tất cả model dưới đây tham chiếu ngược tới `User`. Phải bổ sung các relation field sau vào
> `model User` (đã định nghĩa ở Phase 1). Các relation có tên (`@relation("...")`) phải khớp đúng
> tên đã khai ở model con. Toàn bộ relation Phase 2 gom chung ở đây để tránh trùng lặp ở Step 2.2b/2.4/2.6:
>
> ```prisma
> model User {
>   // ... field & relation từ Phase 1 ...
>
>   // --- Feed (2.1) ---
>   posts          Post[]
>   postLikes      PostLike[]
>   comments       Comment[]
>   commentLikes   CommentLike[]
>   savedPosts     SavedPost[]
>   shares         PostShare[]
>   postTags       PostTag[]        // nếu PostTag tham chiếu taggedUserId (xem model PostTag)
>   pollVotes      PollVote[]
>
>   // --- Friends (2.3) ---
>   friendRequestsSent     Friendship[] @relation("requester")
>   friendRequestsReceived Friendship[] @relation("addressee")
>
>   // --- Stories (2.2b) ---
>   stories        Story[]
>   storyViews     StoryViewer[]
>   storyReactions StoryReaction[]
>
>   // --- Chat (2.4) ---
>   conversationsCreated Conversation[]       @relation("conversationCreator")
>   conversationMembers  ConversationMember[]
>   messagesSent         Message[]
>   messageReactions     MessageReaction[]
>   messageSeen          MessageSeen[]
>
>   // --- Notifications (2.6) ---
>   notifications        Notification[] @relation("recipient")
>   notificationsSent    Notification[] @relation("notificationSender")
> }
> ```
>
> *Lưu ý:* nếu `PostTag` dùng để tag user (`taggedUserId`) thì thêm relation `postTags`; nếu chỉ tag hashtag thì bỏ dòng đó.

```prisma
// ==================== SOCIAL ENUMS ====================

enum PostType {
  TEXT
  PHOTO
  VIDEO
  POLL
  DOCUMENT
}

enum PostVisibility {
  PUBLIC
  FRIENDS
  PRIVATE
}

enum MediaType {
  IMAGE
  VIDEO
  FILE
}

enum ReactionType {
  LIKE
  LOVE
  HAHA
  WOW
  SAD
  ANGRY
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  BLOCKED
}

// ==================== SOCIAL MODELS ====================

model Post {
  id           String         @id @default(uuid())
  authorId     String         @map("author_id")
  content      String?
  type         PostType       @default(TEXT)
  visibility   PostVisibility @default(PUBLIC)
  likeCount    Int            @default(0) @map("like_count")
  commentCount Int            @default(0) @map("comment_count")
  shareCount   Int            @default(0) @map("share_count")
  isPinned     Boolean        @default(false) @map("is_pinned")
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  author   User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  media    PostMedia[]
  likes    PostLike[]
  comments Comment[]
  saves    SavedPost[]
  shares   PostShare[]  @relation("originalPost")
  tags     PostTag[]
  poll     Poll?

  @@index([authorId])
  @@index([createdAt(sort: Desc)])
  @@index([authorId, createdAt(sort: Desc)])
  @@map("posts")
}

model PostMedia {
  id           String    @id @default(uuid())
  postId       String    @map("post_id")
  mediaUrl     String    @map("media_url")
  mediaType    MediaType @map("media_type")
  fileName     String?   @map("file_name")
  fileSize     Int?      @map("file_size")
  displayOrder Int       @default(0) @map("display_order")
  createdAt    DateTime  @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("post_media")
}

model PostLike {
  id           String       @id @default(uuid())
  postId       String       @map("post_id")
  userId       String       @map("user_id")
  reactionType ReactionType @default(LIKE) @map("reaction_type")
  createdAt    DateTime     @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("post_likes")
}

model Comment {
  id         String   @id @default(uuid())
  postId     String   @map("post_id")
  userId     String   @map("user_id")
  parentId   String?  @map("parent_id")
  content    String
  likeCount  Int      @default(0) @map("like_count")
  replyCount Int      @default(0) @map("reply_count")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  post    Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  user    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies Comment[] @relation("CommentReplies")
  likes   CommentLike[]

  @@index([postId, createdAt])
  @@index([parentId])
  @@map("comments")
}

model CommentLike {
  id        String   @id @default(uuid())
  commentId String   @map("comment_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId])
  @@map("comment_likes")
}

model SavedPost {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("saved_posts")
}

model PostShare {
  id             String   @id @default(uuid())
  originalPostId String   @map("original_post_id")
  sharedById     String   @map("shared_by_id")
  newPostId      String?  @map("new_post_id")
  createdAt      DateTime @default(now()) @map("created_at")

  originalPost Post @relation("originalPost", fields: [originalPostId], references: [id], onDelete: Cascade)
  sharedBy     User @relation(fields: [sharedById], references: [id], onDelete: Cascade)

  @@map("post_shares")
}

model PostTag {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  tagName   String   @map("tag_name")
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, tagName])
  @@map("post_tags")
}

model Poll {
  id               String    @id @default(uuid())
  postId           String    @unique @map("post_id")
  question         String
  isMultipleChoice Boolean   @default(false) @map("is_multiple_choice")
  expiresAt        DateTime? @map("expires_at")
  createdAt        DateTime  @default(now()) @map("created_at")

  post    Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  options PollOption[]

  @@map("polls")
}

model PollOption {
  id           String   @id @default(uuid())
  pollId       String   @map("poll_id")
  optionText   String   @map("option_text")
  voteCount    Int      @default(0) @map("vote_count")
  displayOrder Int      @default(0) @map("display_order")
  createdAt    DateTime @default(now()) @map("created_at")

  poll  Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes PollVote[]

  @@map("poll_options")
}

model PollVote {
  id           String   @id @default(uuid())
  pollOptionId String   @map("poll_option_id")
  userId       String   @map("user_id")
  createdAt    DateTime @default(now()) @map("created_at")

  option PollOption @relation(fields: [pollOptionId], references: [id], onDelete: Cascade)
  user   User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([pollOptionId, userId])
  @@map("poll_votes")
}

model Friendship {
  id          String           @id @default(uuid())
  requesterId String           @map("requester_id")
  addresseeId String           @map("addressee_id")
  status      FriendshipStatus @default(PENDING)
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  requester User @relation("requester", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee User @relation("addressee", fields: [addresseeId], references: [id], onDelete: Cascade)

  @@unique([requesterId, addresseeId])
  @@index([requesterId, status])
  @@index([addresseeId, status])
  @@map("friendships")
}
```

### Module Structure

```
backend/src/modules/posts/
├── posts.module.ts
├── posts.controller.ts
├── posts.service.ts
├── feed.service.ts              # Feed algorithm
├── comments.controller.ts
├── comments.service.ts
├── polls.service.ts
├── dto/
│   ├── create-post.dto.ts
│   ├── update-post.dto.ts
│   ├── create-comment.dto.ts
│   ├── react-post.dto.ts
│   └── create-poll.dto.ts
└── posts.service.spec.ts
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/feed` | News feed (thuật toán gợi ý) |
| `GET` | `/feed/latest` | Feed mới nhất (chronological) |
| `POST` | `/posts` | Tạo bài viết (+ upload media) |
| `GET` | `/posts/:id` | Chi tiết bài viết |
| `PUT` | `/posts/:id` | Sửa bài viết |
| `DELETE` | `/posts/:id` | Xóa bài viết |
| `POST` | `/posts/:id/react` | Like/React (6 loại) |
| `DELETE` | `/posts/:id/react` | Bỏ react |
| `POST` | `/posts/:id/share` | Chia sẻ |
| `POST` | `/posts/:id/save` | Lưu bài viết |
| `DELETE` | `/posts/:id/save` | Bỏ lưu |
| `GET` | `/posts/saved` | Danh sách đã lưu |
| `GET` | `/posts/:id/comments` | Danh sách comment |
| `POST` | `/posts/:id/comments` | Thêm comment |
| `PUT` | `/comments/:id` | Sửa comment |
| `DELETE` | `/comments/:id` | Xóa comment |
| `POST` | `/comments/:id/like` | Like comment |
| `DELETE` | `/comments/:id/like` | Bỏ like comment |
| `GET` | `/comments/:id/replies` | Danh sách reply |
| `POST` | `/posts/:id/poll/vote` | Bỏ phiếu |
| `GET` | `/posts/:id/poll/results` | Kết quả poll |

### Feed Algorithm

```typescript
// feed.service.ts
async generateFeed(userId: string, page: number, limit: number = 20) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { subjects: { include: { subject: true } } },
  });

  const friendIds = await this.getFriendIds(userId);

  // Score-based feed query
  const posts = await this.prisma.$queryRaw`
    SELECT p.*,
      u.full_name as author_name,
      u.avatar_url as author_avatar,
      u.faculty_id as author_faculty_id,
      -- Relevance Score
      CASE
        WHEN p.author_id = ANY(${friendIds}::uuid[]) THEN 50
        WHEN u.faculty_id = ${user.facultyId}::uuid THEN 30
        ELSE 10
      END
      +
      -- Engagement Score
      (p.like_count * 2 + p.comment_count * 3 + p.share_count * 5)
      +
      -- Recency Score (decay: -1 point per hour, max 100)
      GREATEST(0, 100 - EXTRACT(EPOCH FROM NOW() - p.created_at) / 3600)
      AS total_score
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.visibility = 'PUBLIC'
      OR (p.visibility = 'FRIENDS' AND p.author_id = ANY(${friendIds}::uuid[]))
      OR p.author_id = ${userId}::uuid
    ORDER BY total_score DESC, p.created_at DESC
    LIMIT ${limit}
    OFFSET ${(page - 1) * limit}
  `;

  return posts;
}
```

### Checklist Step 2.1

```
[ ] Posts module created
[ ] Post CRUD (create with media upload, read, update, delete)
[ ] Like/React system (6 reaction types)
[ ] Comment system (nested replies)
[ ] Comment likes
[ ] Share system
[ ] Save/Bookmark post
[ ] Poll system (create, vote, results)
[ ] Tags system
[ ] Feed algorithm (scored ranking)
[ ] Feed latest (chronological)
[ ] Pagination (cursor-based preferred)
[ ] Media upload pipeline (validate → resize → upload)
[ ] Post visibility (Public/Friends/Private)
[ ] Only author can edit/delete own posts
[ ] Denormalized counters (like_count, comment_count) with triggers/events
[ ] Unit tests ≥80%
```

---

## STEP 2.2: SOCIAL FEED FRONTEND

> **Duration:** 10 ngày | **Assign:** Dev 3 + Dev 4
> **Prerequisite:** Step 2.1
> **UI Rule:** Tất cả icon dùng `<Icon name="..." />` — KHÔNG dùng emoji. Xem Icon Mapping Table.

### Components

```
components/feed/
├── FeedPage.tsx               # Page chính — layout 3 cột
├── CreatePost.tsx             # Box tạo bài viết (avatar + input + action buttons)
├── PostCard.tsx               # Card bài viết
├── PostMedia.tsx              # Gallery ảnh/video (grid 1/2/3/4+)
├── PostActions.tsx            # Like/Comment/Share bar (SVG icons)
├── ReactionPicker.tsx         # 6 reaction popup (SVG animated — KHÔNG emoji)
├── ReactionBadge.tsx          # Badge reactions dưới bài viết
├── CommentList.tsx            # Danh sách comments
├── CommentItem.tsx            # Single comment (recursive replies, 2 levels max)
├── CommentInput.tsx           # Input viết comment
├── PollComponent.tsx          # Hiển thị + vote poll
├── ShareDialog.tsx            # Dialog chia sẻ
├── PostSkeleton.tsx           # Skeleton shimmer loading (KHÔNG spinner)
├── PostContextMenu.tsx        # Right-click menu (save, report, hide, copy link)
└── FeedVirtualList.tsx        # Virtual scroll wrapper (react-virtuoso)
```

### Feed Page Layout (KHÔNG emoji — dùng [icon-name] cho icon)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: [logo] CampusConnect  [search]  [home][users][play][store]  │
│                                            [grid] [bell](3) [msg](5) [avatar] │
├──────────┬────────────────────────────────────┬─────────────────────┤
│          │                                    │                     │
│ Sidebar  │  ┌─Stories Carousel──────────────┐ │  ┌───Đoạn chat────┐│
│          │  │ [+Tạo] [S1] [S2] [S3] [S4] ▶ │ │  │ [search] [pen] ││
│ [home]   │  └───────────────────────────────┘ │  │                 ││
│  Feed    │                                    │  │ Tất cả|Chưa đọc││
│ [users]  │  ┌──────────────────────────────┐  │  │                 ││
│  Bạn bè  │  │ [avatar] Bạn đang nghĩ gì?  │  │  │ [ava] Tên      ││
│ [book]   │  │ [image] [video] [chart] [doc]│  │  │ Preview...  2m ││
│  Học tập │  └──────────────────────────────┘  │  │ ● (online)     ││
│ [file]   │                                    │  │                 ││
│  Tài liệu│  ┌──────────────────────────────┐  │  │ [ava] Tên      ││
│ [grad]   │  │ [ava] Nguyễn A · 2 giờ trước │  │  │ Preview...  1h ││
│  Mentor  │  │ Hôm nay mình đã hoàn thành  │  │  │                 ││
│ [shop]   │  │ project Web cuối kỳ!         │  │  │ [ava] OOP K4   ││
│  Chợ     │  │ ┌────────────────────────┐   │  │  │ A: Ai có...30m ││
│ [cal]    │  │ │ [img] Screenshot proj  │   │  │  │ ●●(2)          ││
│  Sự kiện │  │ └────────────────────────┘   │  │  │                 ││
│ [msg]    │  │ [thumb] 45  [comment] 12     │  │  │ Xem tất cả     ││
│  Chat    │  │ [share] 3                    │  │  │ trong Messenger ││
│ [spark]  │  │                              │  │  └─────────────────┘│
│  AI      │  │ [comment] Comments...        │  │                     │
│          │  └──────────────────────────────┘  │  ┌───Liên hệ──────┐│
│ [chev-dn]│                                    │  │ ● Lê Dương      ││
│  Xem thêm│  ┌──────────────────────────────┐  │  │ ● Minh An       ││
│          │  │ Next post... (skeleton)      │  │  │ ○ Quốc Huy 3h  ││
│          │  └──────────────────────────────┘  │  │ ○ Phương Anh 1d ││
│          │                                    │  └─────────────────┘│
└──────────┴────────────────────────────────────┴─────────────────────┘
```

### Right Sidebar: Chat Widget + Contacts (Giống Facebook Web)

```
components/sidebar-right/
├── RightSidebar.tsx              # Container: Chat Widget + Contacts
├── ChatSidebarWidget.tsx         # Widget "Đoạn chat" (compact conversation list)
├── ChatSidebarWidgetHeader.tsx   # Header: "Đoạn chat" + [...] + [search] + [pencil compose]
├── ChatSidebarSearch.tsx         # Ô tìm kiếm trên sidebar
├── ChatSidebarFilter.tsx         # Tabs: Tất cả | Chưa đọc | Nhóm | Cộng đồng
├── ChatSidebarItem.tsx           # 1 conv compact (avatar + online dot + name + preview + time)
├── ContactList.tsx               # Danh sách contacts online/offline (dưới widget)
├── ContactItem.tsx               # 1 contact (avatar + name + online dot CSS)
└── SponsoredContent.tsx          # Quảng cáo/Gợi ý (nếu có)
```

**Wireframe Chat Sidebar Widget (Image 3 — Sidebar phải trên trang Feed / Homepage):**

```
┌──────────────────────────┐
│ Đoạn chat  [...] [Q] [pencil] │  ← Header: more options + search + compose
├──────────────────────────┤
│ [Q] Tìm kiếm trên Mess... │  ← Search bar
├──────────────────────────┤
│ Tất cả | Chưa đọc | Nhóm | CĐ │  ← Filter tabs (giống Image 3)
├──────────────────────────┤
│ [ava●] Logistics CMC         │  ← Conversation list (compact)
│        Nguyen Tien D... 1p   │
│ [ava●] 12A5 - K55 Lê Hoàn   │
│        úi: Sắp ra rồi  22p  │
│ [ava ] Gu gu đắc             │
│        Thanh: phong...  40p  │
│ [ava ] Dev cụt tay            │
│        Cuonng: Sau t... 1 giờ│
│ [ava ] Lê Hải Dương          │
│        Bạn đã gửi... 1 giờ  │
│ [ava ] Nam Lê                │
│        A còn nhớ nk... 2 giờ │
│ [ava ] Ngọc Anh              │
│        Anh đã gửi... 10 giờ │
├──────────────────────────┤
│ [link] Xem tất cả trong     │  ← Click → navigate /chat (Image 2)
│        Messenger             │
└──────────────────────────┘
```

**ChatSidebarWidget behavior:**
- Hiện ở right sidebar trên mọi trang (trừ `/chat`)
- Click conversation → mở MiniChatWindow ở bottom-right (popup nhỏ)
- Link **"Xem tất cả trong Messenger"** → navigate `/chat` (trang full — Image 2)
- Header có 3 nút: [...] more options, [search] tìm kiếm, [pencil] compose tin nhắn mới
- Tabs: Tất cả | Chưa đọc | Nhóm | Cộng đồng
- Mỗi conversation item có: avatar (+ online dot), tên, preview tin nhắn, thời gian
- Hover vào conv item → hiện nút [...] dropdown (Đánh dấu đã đọc, Tắt TBáo, Xóa)
- Realtime update qua Socket.IO (tin nhắn mới → conv nhảy lên đầu)

**ContactList behavior:**
- Hiện danh sách bạn bè, online trước, offline sau
- Online indicator: CSS `::after` pseudo-element (green dot 10px)
- "Hoạt động X phút trước" cho offline users
- Click → mở MiniChatWindow hoặc DM

### Key UX Requirements (Nâng cấp)

- **Virtual scrolling** — dùng `react-virtuoso` cho feed (variable height items)
- **Skeleton shimmer** loading — KHÔNG dùng spinner, dùng CSS shimmer animation
- **Optimistic updates** cho like/save/react
- **Image preview** trước khi upload (multi-image grid)
- **Reaction picker** — hover popup với 6 reaction **SVG animated** (KHÔNG emoji)
- **Comment threading** (nested 2 levels max)
- **Rich text** trong create post (mentions @, hashtags #)
- **Intersection Observer** cho lazy load images, load more posts
- **`useTransition`** cho heavy renders (prevent jank khi scroll)
- **Stories carousel** ở đầu feed (horizontal scroll, snap)

### Performance Requirements

```typescript
// Virtual scroll cho feed
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={posts}
  useWindowScroll              // Scroll cùng window, không tạo scroll riêng
  overscan={500}               // Buffer 500px phía trên/dưới
  endReached={loadMorePosts}   // Infinite scroll
  itemContent={(index, post) => <PostCard post={post} />}
  components={{
    Footer: () => <PostSkeleton count={2} />,  // Skeleton khi loading
  }}
/>

// Skeleton shimmer CSS
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: var(--skeleton-shimmer);
  background-size: 200% 100%;
  animation: shimmer var(--skeleton-animation-duration) infinite;
  border-radius: var(--radius-md);
}
```

### Checklist Step 2.2

```
[ ] Feed page with virtual scroll (react-virtuoso, NOT naive infinite scroll)
[ ] Stories carousel component ở đầu feed (xem Step 2.2b)
[ ] Create post box (text + image + video + poll + file) — icons = SVG
[ ] Post card component (full interactions)
[ ] Reaction picker (6 types — SVG animated, KHÔNG emoji)
[ ] Reaction badge dưới bài viết
[ ] Comment section (expandable, nested replies 2 levels)
[ ] Share dialog
[ ] Save post (bookmark) — icon SVG bookmark outline/filled
[ ] Poll component (vote + results + progress bars)
[ ] Image gallery (grid layout 1/2/3/4+, lightbox viewer)
[ ] Skeleton shimmer loading (KHÔNG spinner)
[ ] Empty state (SVG illustration)
[ ] Error handling + retry
[ ] Mobile responsive
[ ] Optimistic updates (like/react/save)
[ ] Right sidebar: Chat Widget (conversation list compact)
[ ] Right sidebar: Contact list (online/offline, CSS green dot)
[ ] Dark mode support
[ ] Keyboard accessibility (tab navigation, focus-visible)
[ ] Post context menu (right-click)
```

---

## STEP 2.2b: STORIES SYSTEM

> **Duration:** 7 ngày | **Assign:** Dev 3 + Dev 4 (FE) + Dev 2 (BE)
> **Prerequisite:** Step 2.1 (Feed Backend)
> **Tham chiếu UI:** Facebook Stories Web — carousel trên feed, fullscreen viewer

### Prisma Schema (thêm vào schema.prisma)

```prisma
// ==================== STORIES ENUMS ====================

enum StoryType {
  IMAGE
  VIDEO
  TEXT        // Story dạng text với background color
}

// ==================== STORIES MODELS ====================

model Story {
  id            String      @id @default(uuid())
  authorId      String      @map("author_id")
  type          StoryType   @default(IMAGE)
  mediaUrl      String?     @map("media_url")        // URL ảnh/video
  thumbnailUrl  String?     @map("thumbnail_url")     // Thumbnail cho video
  textContent   String?     @map("text_content")      // Nội dung text story
  bgColor       String?     @map("bg_color")          // Background color cho text story
  bgGradient    String?     @map("bg_gradient")       // CSS gradient string
  fontStyle     String?     @default("normal") @map("font_style")  // normal, serif, mono, handwriting
  fontSize      Int?        @default(24) @map("font_size")
  textAlign     String?     @default("center") @map("text_align")  // left, center, right
  duration      Int         @default(5)               // Seconds to display (5 cho image, video length cho video)
  viewCount     Int         @default(0) @map("view_count")
  musicUrl      String?     @map("music_url")         // Background music (optional)
  musicTitle    String?     @map("music_title")
  linkUrl       String?     @map("link_url")          // Swipe-up link (optional)
  isHighlight   Boolean     @default(false) @map("is_highlight")  // Lưu vào highlights (không expire)
  expiresAt     DateTime    @map("expires_at")        // created_at + 24h
  createdAt     DateTime    @default(now()) @map("created_at")

  author    User            @relation(fields: [authorId], references: [id], onDelete: Cascade)
  viewers   StoryViewer[]
  reactions StoryReaction[]

  @@index([authorId, createdAt(sort: Desc)])
  @@index([expiresAt])
  @@map("stories")
}

model StoryViewer {
  id       String   @id @default(uuid())
  storyId  String   @map("story_id")
  userId   String   @map("user_id")
  viewedAt DateTime @default(now()) @map("viewed_at")

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([storyId, userId])
  @@index([storyId, viewedAt(sort: Desc)])
  @@map("story_viewers")
}

model StoryReaction {
  id           String       @id @default(uuid())
  storyId      String       @map("story_id")
  userId       String       @map("user_id")
  reactionType ReactionType @default(LIKE) @map("reaction_type")  // 6 reaction render bằng SVG (KHÔNG ký tự emoji)
  createdAt    DateTime     @default(now()) @map("created_at")

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([storyId, userId])
  @@map("story_reactions")
}
```

### Module Structure

```
backend/src/modules/stories/
├── stories.module.ts
├── stories.controller.ts
├── stories.service.ts
├── stories-cleanup.service.ts       # BullMQ cron job: xóa stories expired
├── dto/
│   ├── create-story.dto.ts
│   └── react-story.dto.ts
└── stories.service.spec.ts
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stories/feed` | Stories của bạn bè (grouped by user, sorted by recency) |
| `GET` | `/stories/my` | Stories của mình (để xem viewers) |
| `POST` | `/stories` | Tạo story (upload media hoặc text) |
| `DELETE` | `/stories/:id` | Xóa story (chỉ author) |
| `POST` | `/stories/:id/view` | Đánh dấu đã xem |
| `GET` | `/stories/:id/viewers` | Danh sách người đã xem (chỉ author) |
| `POST` | `/stories/:id/react` | React/reply to story |
| `GET` | `/stories/archive` | Archive stories đã hết hạn (chỉ author) |

### Stories Feed Response Format

```typescript
// GET /stories/feed
// Group stories theo user, sort by latest story time
interface StoriesFeedResponse {
  users: Array<{
    userId: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
    stories: Array<{
      id: string;
      type: StoryType;
      mediaUrl?: string;
      thumbnailUrl?: string;
      textContent?: string;
      bgColor?: string;
      bgGradient?: string;
      fontStyle?: string;
      duration: number;
      createdAt: string;
      isViewed: boolean;       // Current user đã xem chưa
    }>;
    hasUnviewed: boolean;       // Có story chưa xem → viền gradient
    latestStoryAt: string;      // Sort key
  }>;
}
```

### Frontend Components

```
components/stories/
├── StoryCarousel.tsx            # Horizontal scroll carousel ở đầu feed
├── StoryCard.tsx                # 1 card trong carousel (100x176px, avatar overlay)
├── CreateStoryCard.tsx          # Card "Tạo tin" đầu tiên (avatar + [plus] icon)
├── StoryViewer.tsx              # Fullscreen story viewer overlay
├── StoryProgress.tsx            # Progress bars trên đầu viewer (multi-segment)
├── StoryHeader.tsx              # Avatar + Name + Time + [x] close + [pause] + [volume]
├── StoryCreator.tsx             # Tạo story dialog
├── StoryCreatorPhoto.tsx        # Upload + crop ảnh
├── StoryCreatorText.tsx         # Editor text story (chọn font, bg color/gradient)
├── StoryReactionBar.tsx         # Thanh reaction khi xem story (SVG icons)
├── StoryReplyInput.tsx          # Input reply to story (gửi vào DM)
├── StoryViewersList.tsx         # Danh sách người đã xem + reactions (cho author)
└── StorySkeleton.tsx            # Skeleton loading cho carousel
```

### Story Carousel Layout (trên Feed)

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│  │      │ │      │ │      │ │      │ │      │             │
│  │ YOUR │ │ THUMB│ │ THUMB│ │ THUMB│ │ THUMB│  ▶ (scroll) │
│  │ AVATAR│ │      │ │      │ │      │ │      │             │
│  │      │ │      │ │      │ │      │ │      │             │
│  │ [+]  │ │[ava] │ │[ava] │ │[ava] │ │[ava] │             │
│  │Tạo   │ │ Tên  │ │ Tên  │ │ Tên  │ │ Tên  │             │
│  │tin   │ │ (*)  │ │      │ │ (*)  │ │      │             │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
│  100×176   Viền     Viền     Viền     Viền                 │
│            gradient xám      gradient xám                   │
│           (chưa xem)(đã xem)(chưa xem)(đã xem)             │
└─────────────────────────────────────────────────────────────┘

(*) Viền gradient = chưa xem hết: border-image linear-gradient(135deg, #FF6B35, #FF2D55, #AF52DE)
    Viền xám = đã xem hết: border-color var(--color-border-secondary)
```

### Fullscreen Story Viewer Layout

```
┌─────────────────────────────────────────────────────┐
│ [===-----|------------|----------] ← Progress bars   │
│                                                      │
│ [ava] Tên · 2h trước     [pause] [volume-x] [x]    │
│                                                      │
│                                                      │
│                                                      │
│         ┌──────────────────────┐                    │
│         │                      │                    │
│         │    STORY CONTENT     │                    │
│  [◄]    │    (image/video/     │    [►]             │
│  prev   │     text overlay)    │    next             │
│  user   │                      │    user             │
│         │                      │                    │
│         └──────────────────────┘                    │
│                                                      │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ [reply input...............] [thumb] [heart]   │  │
│  │                              [smile] [send]    │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Story Viewer Interactions (Giống Facebook)

```typescript
// Gesture handling
interface StoryViewerGestures {
  tapLeft:       'previous story of same user';
  tapRight:      'next story of same user';
  tapCenter:     'pause/resume';
  holdDown:      'pause while holding';
  swipeLeft:     'next user';
  swipeRight:    'previous user';
  swipeDown:     'close viewer';
  keyboard: {
    ArrowLeft:   'previous story';
    ArrowRight:  'next story';
    Space:       'pause/resume';
    Escape:      'close';
    'm':         'mute/unmute video';
  };
}
```

### Story Auto-Cleanup (BullMQ)

```typescript
// stories-cleanup.service.ts
// BullMQ repeatable job chạy mỗi 1 giờ
@Processor('stories-cleanup')
export class StoriesCleanupProcessor {
  @Process()
  async cleanup() {
    // 1. Tìm stories đã expired (expiresAt < now)
    const expired = await this.prisma.story.findMany({
      where: { expiresAt: { lt: new Date() }, isHighlight: false },
      select: { id: true, mediaUrl: true },
    });

    // 2. Xóa files trên storage
    for (const story of expired) {
      if (story.mediaUrl) await this.storage.delete(story.mediaUrl);
    }

    // 3. Xóa records từ DB (cascade: viewers, reactions)
    await this.prisma.story.deleteMany({
      where: { id: { in: expired.map(s => s.id) } },
    });
  }
}
```

### Text Story Background Presets

```css
/* Preset backgrounds cho Text Story — giống FB */
.story-bg-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.story-bg-2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.story-bg-3 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.story-bg-4 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.story-bg-5 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.story-bg-6 { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
.story-bg-7 { background: linear-gradient(135deg, #fccb90 0%, #d57eeb 100%); }
.story-bg-8 { background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); }
.story-bg-9 { background: #1B74E4; }   /* Solid blue */
.story-bg-10 { background: #18191A; }  /* Solid dark */
.story-bg-11 { background: #42B72A; }  /* Solid green */
.story-bg-12 { background: #FA383E; }  /* Solid red */
```

### Checklist Step 2.2b

```
[ ] Story Prisma schema (Story, StoryViewer, StoryReaction)
[ ] Stories module (controller, service)
[ ] CRUD API: create, delete, list feed, list my stories
[ ] Story view tracking (POST /stories/:id/view)
[ ] Story viewers list (GET /stories/:id/viewers) — chỉ author
[ ] Story reactions
[ ] BullMQ cleanup job (mỗi 1h, xóa expired stories + files)
[ ] Media upload pipeline (ảnh: resize 1080px, video: max 30s transcode)
[ ] Story carousel component (horizontal scroll, snap-to-card)
[ ] Create Story card ([plus] icon, avatar background)
[ ] Story card (thumbnail, avatar overlay, gradient/gray border)
[ ] Fullscreen story viewer (progress bars, swipe, tap, keyboard)
[ ] Multi-segment progress bar (auto-advance, pause on hold)
[ ] Story creator: photo upload + crop
[ ] Story creator: text editor (font, bg color/gradient presets)
[ ] Story reaction bar (SVG icons, reply input)
[ ] Reply to story → opens DM conversation
[ ] Story viewers list modal (cho author, xem ai đã xem)
[ ] Skeleton loading cho carousel
[ ] Video story: auto-play, mute by default, tap to unmute
[ ] Mobile responsive (fullscreen viewer)
[ ] Dark mode support
[ ] Accessibility (keyboard navigation trong viewer)
```

---

## STEP 2.3: FRIENDS SYSTEM

> **Duration:** 5 ngày | **Assign:** Dev 2 (BE) + Dev 4 (FE)
> **Prerequisite:** Step 2.1

### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/friends` | Danh sách bạn bè |
| `GET` | `/friends/requests/incoming` | Lời mời nhận được |
| `GET` | `/friends/requests/outgoing` | Lời mời đã gửi |
| `GET` | `/friends/suggestions` | Gợi ý kết bạn |
| `POST` | `/friends/request/:userId` | Gửi lời mời |
| `POST` | `/friends/accept/:userId` | Chấp nhận |
| `POST` | `/friends/reject/:userId` | Từ chối |
| `DELETE` | `/friends/:userId` | Hủy kết bạn |
| `POST` | `/friends/block/:userId` | Chặn |
| `DELETE` | `/friends/block/:userId` | Bỏ chặn |
| `GET` | `/friends/mutual/:userId` | Bạn chung |

### Friend Suggestion Algorithm

```typescript
// Gợi ý kết bạn dựa trên:
// 1. Cùng khoa (+40)
// 2. Cùng ngành (+30)
// 3. Cùng khóa (+20)
// 4. Cùng môn học (+15 per subject)
// 5. Có bạn chung (+10 per mutual)
// 6. Loại bỏ: đã là bạn, đã gửi request, đã block
```

### Checklist Step 2.3

```
[ ] Friend request/accept/reject/cancel
[ ] Friend list with search/filter
[ ] Block/unblock
[ ] Mutual friends
[ ] Friend suggestions (algorithm)
[ ] Incoming/outgoing request pages
[ ] Friend count on profile
[ ] Real-time notification khi nhận lời mời (Phase 2.6)
[ ] Mobile responsive
```

---

## STEP 2.4: REALTIME CHAT BACKEND (Messenger-level)

> **Duration:** 10-12 ngày | **Assign:** Dev 1 + Dev 2
> **Prerequisite:** Step 2.1
> **Tham chiếu:** Facebook Messenger Web (messenger.com) — toàn bộ tính năng chính

### Prisma Schema (Chat — Đầy đủ)

```prisma
// ==================== CHAT ENUMS ====================

enum ConversationType {
  DIRECT
  GROUP
}

enum ConversationMemberRole {
  OWNER       // Người tạo nhóm
  ADMIN       // Quản trị viên
  MEMBER
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  VOICE         // Tin nhắn thoại
  VIDEO
  STICKER       // Sticker
  GIF           // GIF (GIPHY)
  LINK_PREVIEW  // Tin nhắn có link preview
  SYSTEM        // "X đã thêm Y vào nhóm"
  FORWARDED     // Tin nhắn được chuyển tiếp
  CALL          // "Cuộc gọi thoại/video - 5 phút 32 giây"
}

enum CallType {
  VOICE
  VIDEO
}

enum CallStatus {
  RINGING       // Đang đổ chuông
  ONGOING       // Đang diễn ra
  ENDED         // Kết thúc bình thường
  MISSED        // Nhỡ (không ai nhấc)
  DECLINED      // Từ chối
  FAILED        // Lỗi kết nối
}

enum MessageStatus {
  SENDING      // Đang gửi (client-side)
  SENT         // Server đã nhận
  DELIVERED    // Đã gửi đến device người nhận
  SEEN         // Đã xem
}

// ==================== CHAT MODELS ====================

model Conversation {
  id              String           @id @default(uuid())
  type            ConversationType @default(DIRECT)
  name            String?                                    // Tên group chat
  avatarUrl       String?          @map("avatar_url")        // Avatar group
  emoji           String?          @default("👍")            // Quick reaction emoji (FB feature)
  themeColor      String?          @default("#0084FF") @map("theme_color")  // Màu chủ đề
  createdById     String?          @map("created_by")
  lastMessageId   String?          @unique @map("last_message_id")
  lastMessageAt   DateTime?        @map("last_message_at")
  isArchived      Boolean          @default(false) @map("is_archived")     // Ẩn khỏi list
  pinnedMessageId String?          @map("pinned_message_id")               // Ghim tin nhắn
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  createdBy      User?                @relation("conversationCreator", fields: [createdById], references: [id])
  lastMessage    Message?             @relation("lastMessage", fields: [lastMessageId], references: [id])
  pinnedMessage  Message?             @relation("pinnedMessage", fields: [pinnedMessageId], references: [id])
  members        ConversationMember[]
  messages       Message[]            @relation("conversationMessages")

  @@index([lastMessageAt(sort: Desc)])
  @@map("conversations")
}

model ConversationMember {
  id             String                 @id @default(uuid())
  conversationId String                 @map("conversation_id")
  userId         String                 @map("user_id")
  role           ConversationMemberRole @default(MEMBER)
  nickname       String?                                     // Biệt danh trong nhóm (FB feature)
  isMuted        Boolean                @default(false) @map("is_muted")
  muteUntil      DateTime?              @map("mute_until")   // Tắt thông báo đến lúc nào
  lastReadAt     DateTime?              @map("last_read_at")
  lastReadMsgId  String?                @map("last_read_msg_id")  // ID tin nhắn cuối đã đọc
  unreadCount    Int                    @default(0) @map("unread_count")
  isHidden       Boolean                @default(false) @map("is_hidden")   // Ẩn cuộc hội thoại
  joinedAt       DateTime               @default(now()) @map("joined_at")
  leftAt         DateTime?              @map("left_at")      // null = vẫn trong nhóm

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@index([userId, lastReadAt])
  @@map("conversation_members")
}

model Message {
  id             String        @id @default(uuid())
  conversationId String        @map("conversation_id")
  senderId       String        @map("sender_id")
  content        String?                                     // Text content
  type           MessageType   @default(TEXT)
  status         MessageStatus @default(SENT)

  // File/Media
  fileUrl        String?       @map("file_url")
  fileName       String?       @map("file_name")
  fileSize       Int?          @map("file_size")
  fileMimeType   String?       @map("file_mime_type")
  thumbnailUrl   String?       @map("thumbnail_url")         // Ảnh thumbnail cho video/file
  mediaDuration  Int?          @map("media_duration")         // Thời lượng voice/video (seconds)
  mediaWidth     Int?          @map("media_width")
  mediaHeight    Int?          @map("media_height")

  // Link Preview (OG meta)
  linkUrl        String?       @map("link_url")
  linkTitle      String?       @map("link_title")
  linkDescription String?     @map("link_description")
  linkImage      String?       @map("link_image")

  // Sticker / GIF
  stickerUrl     String?       @map("sticker_url")
  gifUrl         String?       @map("gif_url")

  // Reply / Forward
  replyToId      String?       @map("reply_to_id")
  forwardedFromId String?      @map("forwarded_from_id")     // Tin nhắn gốc được forward

  // State
  isEdited       Boolean       @default(false) @map("is_edited")
  isUnsent       Boolean       @default(false) @map("is_unsent")   // Thu hồi (FB: "Đã thu hồi tin nhắn")
  deletedForUserIds Json       @default("[]") @map("deleted_for_user_ids")  // Xóa riêng cho mình
  editedAt       DateTime?     @map("edited_at")

  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  conversation          Conversation       @relation("conversationMessages", fields: [conversationId], references: [id], onDelete: Cascade)
  sender                User               @relation(fields: [senderId], references: [id], onDelete: Cascade)
  replyTo               Message?           @relation("MessageReplies", fields: [replyToId], references: [id])
  replies               Message[]          @relation("MessageReplies")
  forwardedFrom         Message?           @relation("MessageForwards", fields: [forwardedFromId], references: [id])
  forwards              Message[]          @relation("MessageForwards")
  reactions             MessageReaction[]
  lastMessageOf         Conversation?      @relation("lastMessage")
  pinnedInConversation  Conversation?      @relation("pinnedMessage")
  seenBy                MessageSeen[]

  @@index([conversationId, createdAt(sort: Desc)])
  @@index([senderId])
  @@index([type])
  @@map("messages")
}

model MessageReaction {
  id           String       @id @default(uuid())
  messageId    String       @map("message_id")
  userId       String       @map("user_id")
  reactionType ReactionType @default(LIKE) @map("reaction_type")  // 6 reaction render bằng SVG (KHÔNG ký tự emoji)
  createdAt    DateTime     @default(now()) @map("created_at")

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId])             // 1 user chỉ 1 reaction per message (đổi thì update)
  @@map("message_reactions")
}

model MessageSeen {
  id        String   @id @default(uuid())
  messageId String   @map("message_id")
  userId    String   @map("user_id")
  seenAt    DateTime @default(now()) @map("seen_at")

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId])
  @@map("message_seen")
}

// ==================== CALL MODELS ====================

model CallHistory {
  id              String         @id @default(uuid())
  conversationId  String         @map("conversation_id")
  callerId        String         @map("caller_id")
  type            CallType       // VOICE | VIDEO
  status          CallStatus     @default(RINGING)
  startedAt       DateTime?      @map("started_at")     // Thời điểm bắt đầu đàm thoại
  endedAt         DateTime?      @map("ended_at")       // Thời điểm kết thúc
  duration        Int?           // Thời lượng cuộc gọi (giây)
  createdAt       DateTime       @default(now()) @map("created_at")

  conversation    Conversation   @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  caller          User           @relation("callsMade", fields: [callerId], references: [id])
  participants    CallParticipant[]

  @@index([conversationId])
  @@index([callerId])
  @@map("call_history")
}

model CallParticipant {
  id        String       @id @default(uuid())
  callId    String       @map("call_id")
  userId    String       @map("user_id")
  joinedAt  DateTime?    @map("joined_at")
  leftAt    DateTime?    @map("left_at")

  call      CallHistory  @relation(fields: [callId], references: [id], onDelete: Cascade)
  user      User         @relation("callsJoined", fields: [userId], references: [id])

  @@unique([callId, userId])
  @@map("call_participants")
}
```

### Module Structure

```
backend/src/modules/chat/
├── chat.module.ts
├── chat.gateway.ts                   # Socket.IO WebSocketGateway (main)
├── conversations.controller.ts       # REST API
├── conversations.service.ts
├── messages.service.ts
├── reactions.service.ts              # Message reactions
├── link-preview.service.ts           # OG meta scraper
├── voice-message.service.ts          # Voice message upload/transcode
├── giphy.service.ts                  # GIPHY API integration (search, trending, GIF by ID)
├── chat-notification.service.ts      # Web Push + in-app notifications
├── call/
│   ├── call.gateway.ts               # Socket.IO signaling cho WebRTC (offer/answer/ICE)
│   ├── call.service.ts               # Quản lý trạng thái cuộc gọi + lưu lịch sử
│   ├── call-history.controller.ts    # REST API lịch sử cuộc gọi
│   └── call.constants.ts             # ICE servers config (STUN/TURN)
├── dto/
│   ├── create-conversation.dto.ts
│   ├── update-conversation.dto.ts
│   ├── send-message.dto.ts
│   ├── react-message.dto.ts
│   ├── forward-message.dto.ts
│   ├── add-member.dto.ts
│   ├── initiate-call.dto.ts          # { conversationId, type: VOICE|VIDEO }
│   └── search-messages.dto.ts
└── chat.service.spec.ts
```

### Socket.IO Events (Đầy đủ — theo Messenger)

```typescript
// ========================
// CLIENT → SERVER
// ========================

// --- Connection ---
'authenticate'            // { token: string }
'heartbeat'               // {} — cập nhật online status mỗi 30s

// --- Messaging ---
'send_message'            // { conversationId, content, type, replyToId?, tempId }
'edit_message'            // { messageId, newContent }
'unsend_message'          // { messageId } — Thu hồi (hiện "Tin nhắn đã bị thu hồi")
'delete_message_for_me'   // { messageId } — Xóa chỉ phía mình
'forward_message'         // { messageId, targetConversationIds[] }

// --- Reactions ---
'react_message'           // { messageId, reactionType }  — Thả reaction (6 loại SVG)
'remove_reaction'         // { messageId }             — Bỏ reaction

// --- Typing ---
'typing_start'            // { conversationId }
'typing_stop'             // { conversationId }

// --- Read ---
'mark_seen'               // { conversationId, messageId }

// --- Conversation ---
'join_conversation'       // { conversationId }
'leave_conversation'      // { conversationId }
'pin_message'             // { conversationId, messageId }
'unpin_message'           // { conversationId }
'set_theme'               // { conversationId, themeColor }
'set_emoji'               // { conversationId, emoji }
'set_nickname'            // { conversationId, targetUserId, nickname }
'archive_conversation'    // { conversationId }
'unarchive_conversation'  // { conversationId }
'mute_conversation'       // { conversationId, duration: 'forever'|'8h'|'24h'|null }

// --- Calls (WebRTC Signaling) ---
'call_initiate'           // { conversationId, type: 'voice'|'video' } — Bắt đầu cuộc gọi
'call_accept'             // { callId } — Nhấc máy
'call_decline'            // { callId } — Từ chối
'call_end'                // { callId } — Kết thúc cuộc gọi
'call_toggle_video'       // { callId, enabled: boolean } — Bật/tắt camera giữa chừng
'call_toggle_audio'       // { callId, enabled: boolean } — Bật/tắt mic
'webrtc_offer'            // { callId, targetUserId, sdp } — SDP offer
'webrtc_answer'           // { callId, targetUserId, sdp } — SDP answer
'webrtc_ice_candidate'    // { callId, targetUserId, candidate } — ICE candidate

// ========================
// SERVER → CLIENT
// ========================

// --- Message events ---
'new_message'             // { message, conversation, senderInfo }
'message_updated'         // { messageId, conversationId, changes }
'message_unsent'          // { messageId, conversationId, senderId }
'message_deleted'         // { messageId, conversationId }

// --- Reaction events ---
'reaction_added'          // { messageId, conversationId, userId, reactionType, userInfo }
'reaction_removed'        // { messageId, conversationId, userId }

// --- Typing events ---
'user_typing'             // { userId, userName, avatarUrl, conversationId }
'user_stop_typing'        // { userId, conversationId }

// --- Seen events ---
'message_seen'            // { conversationId, userId, messageId, userInfo, seenAt }

// --- Presence events ---
'user_online'             // { userId, timestamp }
'user_offline'            // { userId, lastActiveAt }
'user_active_status'      // { userId, isActive, lastActiveAt } (request/response)

// --- Conversation events ---
'conversation_updated'    // { conversationId, changes }
'member_added'            // { conversationId, member, addedBy }
'member_removed'          // { conversationId, userId, removedBy }
'member_left'             // { conversationId, userId }
'message_pinned'          // { conversationId, message, pinnedBy }
'message_unpinned'        // { conversationId, unpinnedBy }
'theme_changed'           // { conversationId, themeColor, changedBy }
'emoji_changed'           // { conversationId, emoji, changedBy }
'nickname_changed'        // { conversationId, targetUserId, nickname, changedBy }

// --- Notification ---
'chat_notification'       // { type, conversation, message, sender }  — cho popup notification

// --- Call events ---
'incoming_call'           // { callId, conversationId, callerId, callerInfo, type }
'call_accepted'           // { callId, userId }
'call_declined'           // { callId, userId }
'call_ended'              // { callId, reason, duration }
'call_participant_joined' // { callId, userId, userInfo }
'call_participant_left'   // { callId, userId }
'call_missed'             // { callId, conversationId, callerId, callerInfo, type }
'webrtc_offer'            // { callId, fromUserId, sdp }
'webrtc_answer'           // { callId, fromUserId, sdp }
'webrtc_ice_candidate'    // { callId, fromUserId, candidate }
```

### REST API (Đầy đủ)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Conversations** | | |
| `GET` | `/conversations` | Danh sách hội thoại (sort by lastMessageAt, filter: all/unread/groups) |
| `POST` | `/conversations` | Tạo hội thoại (DM hoặc Group) |
| `GET` | `/conversations/:id` | Chi tiết hội thoại + members |
| `PUT` | `/conversations/:id` | Cập nhật (tên, avatar, emoji, theme) |
| `DELETE` | `/conversations/:id` | Xóa/ẩn hội thoại |
| `PUT` | `/conversations/:id/archive` | Archive/Unarchive |
| `PUT` | `/conversations/:id/mute` | Mute/Unmute |
| `PUT` | `/conversations/:id/read` | Đánh dấu đã đọc tất cả |
| **Messages** | | |
| `GET` | `/conversations/:id/messages` | Lịch sử tin nhắn (cursor-based, load older) |
| `POST` | `/conversations/:id/messages` | Gửi tin nhắn (REST fallback cho Socket) |
| `PUT` | `/messages/:id` | Sửa tin nhắn |
| `DELETE` | `/messages/:id` | Thu hồi / Xóa |
| `POST` | `/messages/:id/forward` | Chuyển tiếp tin nhắn |
| `GET` | `/conversations/:id/messages/search` | Tìm kiếm trong hội thoại |
| **Reactions** | | |
| `POST` | `/messages/:id/reactions` | Thả reaction |
| `DELETE` | `/messages/:id/reactions` | Bỏ reaction |
| `GET` | `/messages/:id/reactions` | Danh sách reactions (để hiện popup "ai đã react") |
| **Members** | | |
| `POST` | `/conversations/:id/members` | Thêm thành viên |
| `DELETE` | `/conversations/:id/members/:userId` | Kick thành viên |
| `PUT` | `/conversations/:id/members/:userId/role` | Đổi role (Admin/Member) |
| `PUT` | `/conversations/:id/members/:userId/nickname` | Đặt biệt danh |
| `POST` | `/conversations/:id/leave` | Rời nhóm |
| **Media & Files** | | |
| `GET` | `/conversations/:id/media` | Gallery ảnh/video trong conversation |
| `GET` | `/conversations/:id/files` | Danh sách file đã gửi |
| `GET` | `/conversations/:id/links` | Danh sách links đã gửi |
| **Pin** | | |
| `PUT` | `/conversations/:id/pin/:messageId` | Ghim tin nhắn |
| `DELETE` | `/conversations/:id/pin` | Bỏ ghim |
| **Utils** | | |
| `POST` | `/chat/link-preview` | Lấy OG meta của URL |
| `GET` | `/chat/giphy/search?q=...&limit=20` | Tìm GIF (proxy GIPHY API) |
| `GET` | `/chat/giphy/trending?limit=20` | GIF trending |
| `GET` | `/chat/giphy/:id` | Lấy GIF theo ID (để render trong message) |
| `GET` | `/chat/stickers` | Danh sách sticker packs |
| `POST` | `/chat/voice` | Upload voice message |
| **Calls** | | |
| `GET` | `/conversations/:id/calls` | Lịch sử cuộc gọi trong conversation |
| `GET` | `/calls/history` | Lịch sử cuộc gọi của tôi (tất cả conversations) |
| `GET` | `/calls/:id` | Chi tiết 1 cuộc gọi |
| `GET` | `/calls/ice-servers` | Lấy danh sách STUN/TURN servers (config WebRTC) |

### Online Status (Redis — nâng cấp)

```typescript
// Redis key patterns
'presence:{userId}'           // STRING: 'online' | timestamp_last_active (TTL 60s)
'presence:all'                // SORTED SET: userId → lastActiveTimestamp (cleanup mỗi 5m)
'typing:{conversationId}'    // HASH: { userId: timestamp } (TTL 5s per entry)
'unread:{userId}'            // HASH: { conversationId: unreadCount }
'open_chat:{userId}'         // STRING: conversationId đang active (để biết user đang xem chat nào)

// Active status logic (giống FB):
// - Online = có heartbeat trong 30s gần nhất
// - "Hoạt động X phút trước" = có heartbeat trong 24h nhưng > 30s
// - Offline = không có heartbeat > 24h (không hiện last active)
```

### Link Preview Service

```typescript
// link-preview.service.ts
import ogs from 'open-graph-scraper';

@Injectable()
export class LinkPreviewService {
  async getPreview(url: string): Promise<LinkPreview | null> {
    try {
      const { result } = await ogs({ url, timeout: 5000 });
      return {
        url,
        title: result.ogTitle || result.twitterTitle || null,
        description: result.ogDescription || result.twitterDescription || null,
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
        siteName: result.ogSiteName || new URL(url).hostname,
        favicon: result.favicon || null,
      };
    } catch {
      return null;
    }
  }

  // Auto-detect URLs trong content
  extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }
}
```

### Voice Message Pipeline

```typescript
// voice-message.service.ts
// Client ghi âm bằng MediaRecorder API → upload webm/ogg → server transcode nếu cần
// Lưu: fileUrl, mediaDuration (seconds), fileMimeType: 'audio/webm'
// Frontend: custom audio player với waveform visualization
```

### System Messages (Tự động)

```typescript
// System message templates (giống FB Messenger)
const SYSTEM_MESSAGES = {
  MEMBER_ADDED:     '{actor} đã thêm {target} vào nhóm',
  MEMBER_REMOVED:   '{actor} đã xóa {target} khỏi nhóm',
  MEMBER_LEFT:      '{actor} đã rời khỏi nhóm',
  GROUP_CREATED:    '{actor} đã tạo nhóm "{groupName}"',
  GROUP_RENAMED:    '{actor} đã đổi tên nhóm thành "{newName}"',
  AVATAR_CHANGED:   '{actor} đã thay đổi ảnh nhóm',
  THEME_CHANGED:    '{actor} đã đổi chủ đề thành {color}',
  EMOJI_CHANGED:    '{actor} đã đổi biểu tượng cảm xúc nhanh thành {emoji}',
  NICKNAME_SET:     '{actor} đã đặt biệt danh cho {target} là {nickname}',
  MESSAGE_PINNED:   '{actor} đã ghim một tin nhắn',
  ADMIN_PROMOTED:   '{actor} đã chỉ định {target} làm quản trị viên',
};
```

### Performance Optimizations (Học từ Facebook Messenger Architecture)

```typescript
// === 1. BATCH SEEN RECEIPTS ===
// Thay vì emit 'mark_seen' cho từng message, gom lại gửi batch mỗi 2s
// Socket event mới:
'batch_mark_seen'  // { items: [{ conversationId, messageId }] }

// Server handler: update nhiều records 1 query
await prisma.messageSeen.createMany({
  data: items.map(i => ({ messageId: i.messageId, userId, seenAt: new Date() })),
  skipDuplicates: true,
});

// === 2. MESSAGE DELIVERY PIPELINE (BullMQ) ===
// Decouple message processing khỏi Socket handler:
//
// Socket nhận 'send_message':
// 1. Validate input (sync)
// 2. Save message to DB (sync)
// 3. ACK client với real messageId (sync — < 50ms)
// 4. Broadcast 'new_message' to room (sync)
// 5. Queue job: notification fan-out (async — BullMQ)
// 6. Queue job: link preview scraping (async — BullMQ)
// 7. Queue job: media thumbnail generation (async — BullMQ)
//
// Kết quả: Client nhận ACK trong < 50ms, heavy work chạy background

// === 3. ONLINE STATUS & MULTI-TAB TRACKING (Chấm xanh tối ưu) ===
// 1 user có thể mở nhiều tabs → nhiều socket connections
// Redis tracking:
'socket_connections:{userId}'   // SET of socketIds
'socket_user:{socketId}'        // STRING: userId (reverse lookup)

// THUẬT TOÁN ACTIVE STATUS (Chấm xanh) - Tối ưu tài nguyên:
// 1. KHÔNG update DB liên tục. Dùng Redis key có TTL: SETEX `user_online:{userId}` 45s.
// 2. Heartbeat: Client gửi ping mỗi 30s để refresh TTL của Redis key.
// 3. Nếu user đóng tab đột ngột, sau 45s Redis key hết hạn, trigger Redis Keyspace Notification để broadcast trạng thái Offline.
// 4. CHỈ broadcast trạng thái Online/Offline cho: (a) Danh sách Bạn bè đang online, (b) Những người đang có cửa sổ chat mở với user này. KHÔNG broadcast toàn mạng lưới.
// Khi user disconnect → chỉ remove 1 socketId, check SET empty → offline

// === 4. CONNECTION STATE SYNC ===
// Khi client reconnect (mất mạng, refresh):
// 1. Client gửi lastSyncTimestamp
// 2. Server trả về: new messages, updated conversations, unread counts
// 3. Client merge với IndexedDB local cache
// Event: 'sync_state' → response: { messages[], conversations[], unreadCounts }

// === 5. TYPING DEBOUNCE (Server-side) ===
// Throttle typing broadcast: max 1 event / 3s / user / conversation
// Redis key: 'typing_throttle:{convId}:{userId}' TTL 3s
```

### Checklist Step 2.4

```
[ ] Socket.IO Gateway + Redis adapter
[ ] JWT auth trên WebSocket (middleware)
[ ] Conversation CRUD (Direct + Group)
[ ] Message CRUD (send, edit, unsend, delete for me)
[ ] Message types: text, image, file, video, voice, sticker, GIF, link_preview, system, forwarded
[ ] Message reactions (6 reaction SVG — thả/đổi/bỏ)
[ ] Message forwarding (đến 1 hoặc nhiều conversations)
[ ] Reply to message (quote original)
[ ] Typing indicator (emit + broadcast + auto-stop + server-side throttle)
[ ] Seen/Read receipts (per-message, per-user — model MessageSeen)
[ ] Batch seen receipts (gom updates gửi 1 lần, giảm DB writes)
[ ] Online/Offline status (Redis heartbeat)
[ ] Last active timestamp ("Hoạt động 5 phút trước")
[ ] Unread count per conversation
[ ] Pin message trong conversation
[ ] Conversation theme color
[ ] Conversation quick emoji
[ ] Member nickname trong nhóm
[ ] Group admin: add/remove members, promote/demote admin
[ ] Leave group
[ ] Archive/Unarchive conversation
[ ] Mute conversation (forever / 8h / 24h)
[ ] System messages (auto-generate cho mọi sự kiện nhóm)
[ ] Link preview scraper (open-graph-scraper) — async via BullMQ
[ ] GIPHY integration (search + trending + get by ID)
[ ] Voice message upload + transcode
[ ] Media gallery API (ảnh/video/files/links per conversation)
[ ] Search messages trong conversation
[ ] Cursor-based pagination (load older messages)
[ ] File upload pipeline (validate → compress → upload S3/local)
[ ] Chat notification service (emit 'chat_notification' event)
[ ] Web Push notification (service worker, VAPID keys)
[ ] Rate limiting: 30 messages/minute per user
[ ] BullMQ message delivery pipeline (decouple notification/preview/media từ send)
[ ] Multi-tab socket tracking (Redis SET per userId)
[ ] Connection state sync protocol (reconnect → sync missed data)
[ ] Typing throttle server-side (max 1 broadcast / 3s / user / conv)
[ ] Video/Voice Call: WebRTC signaling qua Socket.IO (offer/answer/ICE)
[ ] Video/Voice Call: CallHistory + CallParticipant models
[ ] Video/Voice Call: STUN/TURN server config (ICE servers endpoint)
[ ] Video/Voice Call: Auto-generate CALL message khi cuộc gọi kết thúc
[ ] Video/Voice Call: Missed call notification
[ ] Video/Voice Call: Call timeout (30s không nhấc → MISSED)
[ ] Unit tests ≥80%
```

---

## STEP 2.5: REALTIME CHAT FRONTEND (Messenger-level)

> **Duration:** 12-14 ngày | **Assign:** Dev 3 + Dev 4 + Dev 5
> **Prerequisite:** Step 2.4
> **Tham chiếu UI:** Facebook Messenger Web (messenger.com) — layout, interactions, animations
> **UI Rule:** Tất cả icon dùng `<Icon name="..." />` — KHÔNG dùng emoji. Xem Icon Mapping Table.

### Components (Đầy đủ — KHÔNG emoji trong annotations)

```
components/chat/
├── layout/
│   ├── ChatLayout.tsx                # Layout linh hoạt: 2 hoặc 3 cột tùy Info Panel
│   │   // Khi Info Panel ĐÓNG: Sidebar + Chat (chat area chiếm full width)
│   │   // Khi Info Panel MỞ:  Sidebar + Chat + Info Panel (3 cột)
│   ├── ChatSidebar.tsx               # Sidebar con trong trang /chat
│   └── MobileChatLayout.tsx          # Full-screen cho mobile
│
├── conversations/
│   ├── ConversationList.tsx           # Left panel — danh sách conversations
│   ├── ConversationListHeader.tsx     # Header: "Đoạn chat" + [more-horizontal] + [square-pen]
│   ├── ConversationItem.tsx           # 1 dòng conversation (avatar, name, last msg, time, unread)
│   ├── ConversationItemDropdown.tsx   # Hover [...]: Đã đọc, Tắt TB, Gọi, Video, Lưu trữ, Xóa, Báo cáo, Rời nhóm
│   ├── ConversationSearch.tsx         # Ô tìm kiếm conversation
│   ├── ConversationFilter.tsx         # Tab filter: Tất cả | Chưa đọc | Nhóm | Cộng đồng
│   ├── MessageRequestsList.tsx        # Tin nhắn chờ từ người lạ
│   ├── ArchivedConversations.tsx      # Đoạn chat đã lưu trữ
│   ├── CreateGroupDialog.tsx          # Dialog tạo nhóm
│   └── EmptyConversation.tsx          # "Chọn cuộc trò chuyện để bắt đầu"
│
├── header/
│   │   // Header Chat Area — chỉ 3 nút action (giống FB, KHÔNG có circle-alert):
│   │   // [ava●] Tên · Đang hoạt động        [phone] [video] [info]
│   │   //                                      ↑        ↑       ↑
│   │   //                                   Gọi    Gọi video  Toggle
│   │   //                                   thoại              Info Panel
│   │   //
│   │   // Mỗi nút có nền tròn riêng (40px), màu tương phản:
│   │   //   [phone]  → nền xanh nhạt, icon xanh dương
│   │   //   [video]  → nền tím nhạt, icon tím/hồng
│   │   //   [info]   → nền xanh nhạt, icon xanh dương
│   │   // Click [info] → toggle InfoPanel (mở/đóng cột phải)
│   │
│   ├── ChatHeader.tsx                 # Tên, online status, 3 action buttons
│   ├── ChatHeaderActions.tsx          # [phone] [video] [info] — 3 nút tròn có màu nền riêng
│   └── ConversationInfo.tsx           # Panel bên phải (toggle bởi nút [info])
│
├── messages/
│   ├── MessageArea.tsx                # Container — react-virtuoso reverse scroll
│   ├── MessageBubble.tsx              # Bong bóng tin nhắn (trái/phải, có tail)
│   ├── MessageHoverActions.tsx        # Cạnh tin nhắn khi hover: [smile] React, [reply] Trả lời, [more-vertical] Thêm
│   ├── MessageContent.tsx             # Render content theo type (text, image, file...)
│   ├── MessageStatus.tsx              # [check] Sent / [check][check] Delivered / mini avatar Seen
│   ├── MessageTimestamp.tsx           # "10:30" nhỏ, group by time
│   ├── MessageGroup.tsx              # Nhóm tin nhắn liên tiếp (cách nhau 2px, bo góc thay đổi)
│   ├── SystemMessage.tsx              # "X đã thêm Y vào nhóm"
│   ├── UnsendMessage.tsx              # "Tin nhắn đã bị thu hồi" (italic, xám)
│   ├── SeenAvatars.tsx                # Avatar nhỏ xíu dưới tin nhắn cuối đã đọc (FB style!)
│   ├── DateDivider.tsx                # "Hôm nay", "Hôm qua", "15 tháng 6"
│   └── ScrollToBottom.tsx             # Nút cuộn xuống cuối (khi scroll lên)
│
├── input/
│   │   // Bố cục thanh input (giống hệt Facebook Messenger — Image 2):
│   │   // [+]  [image]  [sticker]  [GIF]  │ Aa input │  [smile]  [thumbs-up]
│   │   //  ↑       ↑         ↑       ↑                     ↑         ↑
│   │   // Attach  Photo   Sticker   GIPHY               Emoji    QuickEmoji
│   │
│   ├── MessageInput.tsx               # Input chính (auto-resize textarea, placeholder "Aa")
│   ├── AttachmentButton.tsx           # Nút [+] (circle-plus) — bấm mở ra menu phụ
│   ├── AttachmentMenu.tsx             # Menu mở rộng: [paperclip] File, [mic] Voice, [map-pin] Vị trí
│   ├── ImageUploadButton.tsx          # Nút [image] — mở file picker ảnh/video
│   ├── StickerButton.tsx              # Nút [sticker] — mở StickerPicker popup
│   ├── GiphyButton.tsx                # Nút [GIF] — mở GiphyPicker popup
│   ├── EmojiPicker.tsx                # Popup emoji (categories, search, recent, skin tones)
│   ├── GiphyPicker.tsx                # GIF search + trending + categories (GIPHY API)
│   ├── StickerPicker.tsx              # Sticker packs (grid, search, favorites)
│   ├── VoiceRecorder.tsx              # Ghi âm: hold to record + waveform preview + send
│   ├── QuickEmojiButton.tsx           # Nút [thumbs-up] SVG (đổi được per conv, mặc định 👍)
│   ├── ReplyPreview.tsx               # Preview tin nhắn đang reply (hiện trên input bar)
│   └── LinkPreviewCard.tsx            # Preview link khi paste URL vào input
│
├── reactions/
│   ├── ReactionPicker.tsx             # Popup 6 reaction khi hover — SVG animated icons
│   ├── ReactionBadge.tsx              # Badge dưới tin nhắn (SVG icon + count)
│   └── ReactionDetailDialog.tsx       # Dialog "Ai đã react gì" (click vào badge)
│
├── media/
│   ├── ImageMessage.tsx               # Hiện ảnh trong bubble (click → lightbox)
│   ├── ImageGrid.tsx                  # Grid nhiều ảnh (2, 3, 4+)
│   ├── VideoMessage.tsx               # Video player inline
│   ├── FileMessage.tsx                # File card (icon, name, size, download)
│   ├── VoiceMessage.tsx               # Waveform audio player
│   ├── LinkPreviewMessage.tsx         # Card link preview (image, title, description)
│   └── MediaGallery.tsx               # Gallery toàn bộ ảnh/video trong conversation
│
├── info-panel/
│   │   // Bố cục Info Panel (giống hệt Facebook Messenger — Image 2):
│   │   // ┌──────────────────────┐
│   │   // │    [avatar lớn]       │
│   │   // │    Tên người / nhóm  │
│   │   // │    ● Đang hoạt động  │
│   │   // │ [bell] Tắt   [search] Tìm  │
│   │   // │  thông báo    kiếm         │
│   │   // ├──────────────────────┤
│   │   // │ ▸ Thông tin về đoạn chat    │
│   │   // │ ▸ Tùy chỉnh đoạn chat      │
│   │   // │ ▸ Thành viên trong đoạn chat│
│   │   // │ ▾ File PT, file và liên kết │
│   │   // │   [image] File phương tiện  │
│   │   // │   [file] File               │
│   │   // │   [link] Liên kết           │
│   │   // │ ▸ Quyền riêng tư và hỗ trợ │
│   │   // └──────────────────────┘
│   │
│   ├── InfoPanel.tsx                  # Panel phải (mở khi click [info])
│   ├── InfoPanelHeader.tsx            # Avatar lớn + tên + trạng thái online
│   ├── InfoPanelQuickActions.tsx      # 2 nút tròn: [bell] Tắt TBáo + [search] Tìm kiếm
│   ├── InfoPanelAbout.tsx             # Accordion: Thông tin về đoạn chat (tên nhóm, ngày tạo, mô tả)
│   ├── InfoPanelCustomize.tsx         # Accordion: Tùy chỉnh (đổi chủ đề, emoji, biệt danh)
│   ├── InfoPanelMembers.tsx           # Accordion: Thành viên (vai trò, thêm/xóa, promote)
│   ├── InfoPanelMediaGroup.tsx        # Accordion: File phương tiện, file và liên kết
│   ├── InfoPanelMedia.tsx             #   └─ Sub-tab: File phương tiện (ảnh/video grid)
│   ├── InfoPanelFiles.tsx             #   └─ Sub-tab: File (danh sách file đã gửi)
│   ├── InfoPanelLinks.tsx             #   └─ Sub-tab: Liên kết (danh sách links)
│   ├── InfoPanelPrivacy.tsx           # Accordion: Quyền riêng tư & hỗ trợ (chặn, báo cáo, rời nhóm)
│   └── InfoPanelPinnedMessage.tsx     # Banner tin nhắn đã ghim (hiện trên cùng chat area)
│
├── notification/
│   ├── ChatNotificationPopup.tsx      # Popup thông báo tin nhắn mới (góc phải dưới)
│   ├── ChatNotificationSound.tsx      # Âm thanh tin nhắn mới
│   └── ChatBubble.tsx                 # Mini chat bubble popup (góc phải dưới — giống FB!)
│
├── mini-chat/
│   ├── MiniChatContainer.tsx          # Container quản lý nhiều mini chat windows
│   ├── MiniChatWindow.tsx             # 1 cửa sổ chat nhỏ (góc phải dưới — signature FB!)
│   └── MiniChatHeader.tsx             # Header mini chat (close, minimize, pop out)
│
├── call/
│   ├── CallOverlay.tsx                # Overlay toàn màn hình khi đang gọi video
│   ├── IncomingCallDialog.tsx         # Dialog "User A đang gọi cho bạn" (ringtone + Accept/Decline)
│   ├── CallControls.tsx               # Thanh điều khiển: Mic, Camera, Chia sẻ MH, Kết thúc
│   ├── CallTimer.tsx                  # Bộ đếm thời gian cuộc gọi (00:05:32)
│   ├── CallParticipantVideo.tsx       # Khung video của 1 người tham gia
│   ├── CallParticipantGrid.tsx        # Grid layout nhiều người (group call)
│   ├── CallMinimized.tsx              # Mini floating window khi thu nhỏ cuộc gọi (PiP)
│   ├── CallHistory.tsx                # Trang lịch sử cuộc gọi (trong InfoPanel hoặc riêng)
│   └── CallMessageBubble.tsx          # Bubble tin nhắn "Cuộc gọi video - 5:32" (trong chat)
│
└── shared/
    ├── TypingIndicator.tsx            # "User đang nhập..." với dot animation (●●●)
    ├── OnlineStatus.tsx               # CSS ::after green dot / "5 phút trước"
    ├── ChatAvatar.tsx                 # Avatar (group = multi-avatar stack, online dot)
    └── ForwardDialog.tsx              # Dialog chọn conversation để forward
```

### Chat Page Layout (Desktop — Lucide icon names)

**STATE A: Info Panel MỞ (click [info] lần 1)**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [C] CampusConnect  [search]                  [grid] [msg](5) [bell](3) [ava]│
├────────┬───────────────┬──────────────────────────────────┬──────────────────┤
│        │ Đoạn chat     │ [ava●] Gu gu đắc                │      Info Panel  │
│Sidebar │ [...] [pen]   │ Đang hoạt động                   │  ┌────────────┐ │
│        │               │            [phone] [video] [ⓘ]  │  │  [ava lớn] │ │
│ [home] │ [Q] Tìm kiếm  │                                  │  │  Gu gu đắc │ │
│  Feed  │ trên Mess...  │  ── Hôm nay ──                   │  │ ● Online   │ │
│ [users]│               │                                  │  └────────────┘ │
│  Bạn bè│ Tất cả|Chưa   │  Duc                             │                  │
│ [book] │ đọc|Nhóm|CĐ  │  [ava] Dơn                       │ [bell]   [search]│
│  Học   │               │                                  │ Tắt TB   Tìm    │
│ [file] │ ┌───────────┐ │  Danh                            │ kiếm            │
│  Docs  │ │[ava●] 12A5│ │  [ava] Học đi b ơi               │                  │
│ [grad] │ │ Ngo: Hình..│ │                                  │ ▸ Thông tin     │
│  Ment  │ │ 3 phút     │ │  Duc                            │ ▸ Tùy chỉnh     │
│ [shop] │ └───────────┘ │  Ok b ơi                         │ ▸ Thành viên    │
│  Chợ   │ ┌───────────┐ │  Dhs ngủ bọn vcl                │ ▾ File PT, file  │
│ [cal]  │ │[ava●] Logi│ │                                  │   và liên kết   │
│  SK    │ │ Nguyen..   │ │  Thanh                          │  [image] File PT│
│ [msg]  │ │ 11 phút    │ │  đ ai hỏi                      │  [file]  File   │
│  Chat  │ └───────────┘ │                                  │  [link]  Liên kết│
│ [spark]│ ┌───────────┐ │  [ava] phóng bạt mạng đến đi    │                  │
│  AI    │ │[ava ] Gu gu│ │     [ava][ava][ava] ← seen      │ ▸ Quyền riêng   │
│        │ │ Thanh:phong│ │                                  │   tư và hỗ trợ │
│        │ │ 51 phút    │ │ ┌──────────────────────────────┐│                  │
│        │ └───────────┘ │ │[⊕][🖼][☻][GIF]  Aa    [☺][👍] ││                  │
│        │               │ └──────────────────────────────┘│                  │
└────────┴───────────────┴──────────────────────────────────┴──────────────────┘
```

**STATE B: Info Panel ĐÓNG (click [info] lần 2) — Chat area chiếm full width**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [C] CampusConnect  [search]                  [grid] [msg](5) [bell](3) [ava]│
├────────┬───────────────┬────────────────────────────────────────────────────┤
│        │ Đoạn chat     │ [ava●] Gu gu đắc                                   │
│Sidebar │ [...] [pen]   │ Đang hoạt động               [phone] [video] [ⓘ]  │
│        │               │                                                    │
│ [home] │ [Q] Tìm kiếm  │  ── Hôm nay ──                                     │
│  Feed  │ trên Mess...  │                                                    │
│ [users]│               │  Duc                                                │
│  Bạn bè│ Tất cả|Chưa   │  [ava] Dơn                                         │
│ [book] │ đọc|Nhóm|CĐ  │                                                    │
│  Học   │               │  Danh                                              │
│ [file] │ ┌───────────┐ │  [ava] Học đi b ơi                                 │
│  Docs  │ │[ava●] 12A5│ │                                                    │
│ [grad] │ │ Ngo: Hình..│ │  Duc                                              │
│  Ment  │ │ 3 phút     │ │  Ok b ơi                                          │
│ [shop] │ └───────────┘ │  Dhs ngủ bọn vcl                                   │
│  Chợ   │ ┌───────────┐ │                          [sparkles] ← hover action │
│ [cal]  │ │[ava●] Logi│ │  Thanh                                             │
│  SK    │ │ Nguyen..   │ │  đ ai hỏi                                         │
│ [msg]  │ │ 11 phút    │ │                                                    │
│  Chat  │ └───────────┘ │  [ava] phóng bạt mạng đến đi                       │
│ [spark]│ ┌───────────┐ │     [ava][ava][ava] ← seen avatars                 │
│  AI    │ │[ava ] Gu gu│ │                                                    │
│        │ │ Thanh:phong│ │ ┌────────────────────────────────────────────────┐ │
│        │ │ 51 phút    │ │ │[⊕][🖼][☻][GIF]  Aa                   [☺][👍] │ │
│        │ └───────────┘ │ └────────────────────────────────────────────────┘ │
└────────┴───────────────┴────────────────────────────────────────────────────┘
```

// Mini Chat Popups (góc phải dưới — khi ở trang KHÁC, không phải /chat)
// Dimensions: var(--mini-chat-width) × var(--mini-chat-height)
// Cửa sổ chat hiển thị tối đa 5 tab, nếu dư sẽ gộp vào Overflow Bubble (+N)
                                    ┌─────┐ ┌──────────────┐  ┌──────────────┐
                                    │ [ava] │ │[ava] Minh [─][x]│ │[ava] An  [─][x]│
                                    │  +2   │ │────────────────│  │────────────────│
                                    └─────┘ │ Messages...    │  │ Messages...    │
                                            │ (virtuoso)     │  │ (virtuoso)     │
                                            │                │  │                │
                                            │[Nhập tin nhắn] │  │[Nhập tin nhắn] │
                                            │[img][clip][snd]│  │[img][clip][snd]│
                                            └──────────────┘  └──────────────┘
```

### Mini Chat Windows (Giống Facebook Web - Tối đa 5 Popups & Bóng chat tràn)

```typescript
// Khi user ở trang KHÁC (feed, profile, etc.) mà nhận tin nhắn hoặc click vào chat icon:
// → Mở Mini Chat Window ở góc phải dưới (max 5 windows xếp ngang, stack from right)
// → Nếu màn hình nhỏ không đủ chỗ hoặc mở > 5 cửa sổ, các cửa sổ cũ nhất sẽ thu gọn thành "Overflow Bubble" (Bóng chat +N hình tròn xếp chồng).
// → Click vào Overflow Bubble hiện danh sách các cuộc trò chuyện bị ẩn để chọn mở lại.
// → Nút "Mở trong Messenger" để chuyển sang trang /chat full

interface MiniChatState {
  openWindows: Array<{
    conversationId: string;
    isMinimized: boolean;     // Thu nhỏ thành icon
    position: number;         // 0, 1, 2, 3, 4 (from right)
  }>;
  overflowBubbles: string[];  // Danh sách ID các chat bị đẩy vào ô Overflow (+N)
  maxWindows: 5;              // Giới hạn 5 cửa sổ
}
```

### Chat Notification System (Web)

```typescript
// 1. IN-APP POPUP (giống FB notification toast)
// Khi nhận tin nhắn mới mà KHÔNG đang xem conversation đó:
// → Hiện popup toast ở góc trên-phải hoặc góc dưới-phải
// → Avatar + Tên + Preview tin nhắn + "x phút trước"
// → Click → mở mini chat hoặc navigate đến /chat
// → Auto dismiss sau 5s (hoặc click X)

// 2. BROWSER TAB TITLE (giống FB)
// Khi có tin nhắn chưa đọc: title = "(5) CampusConnect" 
// Khi đang gõ: title flash "Lê Dương đang nhập..."

// 3. BROWSER NOTIFICATION (Web Push API)
// Nếu tab không active (user đang ở tab khác):
// → Gửi Browser Notification (cần permission)
// → Icon: avatar người gửi
// → Title: "Lê Dương"
// → Body: "Bạn: Ok, mình sẽ nộp sớm!"
// → Click → focus tab CampusConnect + mở conversation

// 4. SOUND
// Âm thanh "ting" khi nhận tin nhắn mới (có setting tắt/bật)
// Không phát âm nếu conversation đang muted

// Service Worker for Web Push
// backend: dùng 'web-push' package + VAPID keys
// frontend: đăng ký service worker + request notification permission
```

```typescript
// frontend: hooks/useChatNotification.ts

export function useChatNotification() {
  const { activeConversation } = useChatStore();

  useEffect(() => {
    // Lắng nghe event 'chat_notification' từ Socket.IO
    socket.on('chat_notification', (data) => {
      // Nếu đang xem đúng conversation đó → không thông báo
      if (data.conversationId === activeConversation) return;

      // 1. Hiện toast popup
      showChatToast({
        avatar: data.sender.avatarUrl,
        name: data.sender.fullName,
        preview: truncate(data.message.content, 50),
        conversationId: data.conversationId,
      });

      // 2. Phát âm thanh
      if (!isConversationMuted(data.conversationId)) {
        playNotificationSound();
      }

      // 3. Cập nhật tab title
      updateUnreadTitle(getTotalUnread() + 1);

      // 4. Browser notification (nếu tab không active)
      if (document.hidden) {
        sendBrowserNotification({
          title: data.sender.fullName,
          body: data.message.content,
          icon: data.sender.avatarUrl,
          tag: data.conversationId,
        });
      }
    });
  }, [activeConversation]);
}
### Virtual Scrolling cho Messages (react-virtuoso)

```typescript
// MessageArea.tsx — Dùng react-virtuoso cho reverse infinite scroll
import { Virtuoso } from 'react-virtuoso';

export function MessageArea({ conversationId }: { conversationId: string }) {
  const { messages, loadOlderMessages } = useChatStore();
  const msgs = messages[conversationId] || [];

  return (
    <Virtuoso
      data={msgs}
      firstItemIndex={INITIAL_INDEX - msgs.length}  // Reverse scroll
      initialTopMostItemIndex={msgs.length - 1}      // Start at bottom
      followOutput="smooth"                          // Auto-scroll khi có tin mới
      overscan={200}                                  // Buffer 200px
      alignToBottom                                   // Chat layout
      startReached={() => loadOlderMessages(conversationId)}  // Load more khi scroll lên
      itemContent={(index, msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isGrouped={shouldGroup(msg, msgs[index - 1])}
          showAvatar={shouldShowAvatar(msg, msgs[index + 1])}
        />
      )}
      components={{
        Header: () => <MessageSkeleton />,           // Loading older messages
      }}
    />
  );
}

// Lợi ích:
// 1. Chỉ render ~20 messages trong viewport → mượt với 10K+ messages
// 2. Reverse scroll tự động (chat mới nhất ở dưới)
// 3. followOutput auto-scroll khi nhận tin mới
// 4. startReached trigger load older messages khi scroll lên top
// 5. DOM recycling → giảm memory footprint
```

### IndexedDB Offline Cache (Dexie.js)

```typescript
// lib/chat-db.ts — Local cache cho messages và conversations
import Dexie, { Table } from 'dexie';

class ChatDatabase extends Dexie {
  messages!: Table<CachedMessage>;
  conversations!: Table<CachedConversation>;
  syncState!: Table<SyncState>;

  constructor() {
    super('CampusConnectChat');
    this.version(1).stores({
      messages: 'id, conversationId, createdAt, [conversationId+createdAt]',
      conversations: 'id, lastMessageAt',
      syncState: 'key',  // lastSyncTimestamp per conversation
    });
  }
}

export const chatDB = new ChatDatabase();

// Usage trong Chat Store:
// 1. Khi mở conversation:
//    → Load từ IndexedDB trước (instant render)
//    → Fetch server (chỉ messages mới hơn lastSync)
//    → Merge + cập nhật IndexedDB
//
// 2. Khi gửi message:
//    → Save temp message vào IndexedDB (status: SENDING)
//    → Emit socket → nhận ACK → update IndexedDB (status: SENT)
//
// 3. Khi offline:
//    → Queue messages trong IndexedDB
//    → Khi reconnect → sync all queued messages
//
// 4. Khi nhận message từ socket:
//    → Save vào IndexedDB + Zustand store đồng thời

// Sync protocol khi reconnect:
async function syncOnReconnect() {
  const lastSync = await chatDB.syncState.get('lastSync');
  socket.emit('sync_state', { since: lastSync?.timestamp });
  socket.on('sync_response', async (data) => {
    await chatDB.messages.bulkPut(data.messages);
    await chatDB.conversations.bulkPut(data.conversations);
    await chatDB.syncState.put({ key: 'lastSync', timestamp: new Date() });
    // Update Zustand store
    useChatStore.getState().mergeServerData(data);
  });
}
```

### Optimistic Message Send

```typescript
// hooks/useSendMessage.ts
export function useSendMessage() {
  const { addMessage, updateMessage, removeMessage } = useChatStore();

  return async (conversationId: string, content: string, type: MessageType) => {
    // 1. Tạo temp message (hiện ngay trên UI)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      content,
      type,
      status: 'SENDING',      // Hiện icon loading nhỏ
      createdAt: new Date().toISOString(),
      _isOptimistic: true,     // Flag để phân biệt
    };

    // 2. Thêm vào UI ngay lập tức (< 1ms)
    addMessage(conversationId, tempMessage);
    await chatDB.messages.add(tempMessage);  // Cache offline

    // 3. Gửi qua socket
    try {
      const realMessage = await emitWithAck('send_message', {
        conversationId, content, type, tempId,
      });

      // 4. Thay temp bằng real message
      updateMessage(conversationId, tempId, {
        ...realMessage,
        status: 'SENT',
        _isOptimistic: false,
      });
      await chatDB.messages.delete(tempId);
      await chatDB.messages.add(realMessage);
    } catch (error) {
      // 5. Nếu fail → hiện nút retry
      updateMessage(conversationId, tempId, {
        status: 'FAILED',
        _error: error.message,
      });
    }
  };
}
```

### Batch Seen Receipts (Client-side)

```typescript
// hooks/useSeenBatcher.ts
// Gom nhiều 'mark_seen' events gửi 1 lần mỗi 2 giây
export function useSeenBatcher() {
  const seenBuffer = useRef(new Map<string, string>());  // convId → messageId

  useEffect(() => {
    const interval = setInterval(() => {
      if (seenBuffer.current.size > 0) {
        const items = Array.from(seenBuffer.current.entries()).map(
          ([conversationId, messageId]) => ({ conversationId, messageId })
        );
        socket.emit('batch_mark_seen', { items });
        seenBuffer.current.clear();
      }
    }, 2000);  // Flush mỗi 2 giây

    return () => clearInterval(interval);
  }, []);

  // Gọi hàm này khi user scroll qua message
  const markSeen = (conversationId: string, messageId: string) => {
    seenBuffer.current.set(conversationId, messageId);  // Chỉ giữ latest per conv
  };

  return { markSeen };
}
```

### Chat Store (Zustand — nâng cấp)

```typescript
interface ChatState {
  // Data
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Record<string, Message[]>;      // conversationId → messages
  typingUsers: Record<string, TypingUser[]>; // conversationId → [{userId, name, avatar}]
  onlineUsers: Map<string, { isOnline: boolean; lastActiveAt?: Date }>;
  unreadCounts: Record<string, number>;

  // Mini Chat (FB-style)
  miniChatWindows: MiniChatWindow[];
  isChatPage: boolean;                       // Đang ở /chat hay trang khác?

  // Info Panel
  infoPanelOpen: boolean;
  infoPanelTab: 'info' | 'media' | 'files' | 'links' | 'members';

  // Reply/Forward state
  replyingTo: Message | null;
  forwardingMessage: Message | null;

  // Actions
  setActiveConversation: (id: string) => void;
  addMessage: (convId: string, message: Message) => void;
  updateMessage: (convId: string, messageId: string, changes: Partial<Message>) => void;
  unsendMessage: (convId: string, messageId: string) => void;
  markAsSeen: (convId: string, messageId: string) => void;
  addReaction: (convId: string, messageId: string, userId: string, reactionType: ReactionType) => void;
  removeReaction: (convId: string, messageId: string, userId: string) => void;
  setTyping: (convId: string, user: TypingUser, isTyping: boolean) => void;
  setOnline: (userId: string, isOnline: boolean, lastActiveAt?: Date) => void;

  // Mini chat
  openMiniChat: (conversationId: string) => void;
  closeMiniChat: (conversationId: string) => void;
  minimizeMiniChat: (conversationId: string) => void;

  // Notification
  totalUnread: number;
  updateTotalUnread: () => void;
}
```

### Key UX Requirements (Giống Messenger)

| Feature | Mô tả chi tiết |
|---------|----------------|
| **Message Bubbles** | Bong bóng bo tròn, màu xanh (gửi) / xám (nhận). Tin nhắn liên tiếp cùng người → gộp (không hiện avatar lặp), chỉ hiện avatar ở tin cuối cùng của nhóm |
| **Seen Avatars** | Avatar nhỏ (16px) hiện ở bên phải dưới tin nhắn cuối cùng mà người đó đã đọc (signature FB!) |
| **Typing Indicator** | 3 chấm nhảy ●●● trong bubble giả, hiện tên + avatar người đang gõ |
| **Quick Emoji** | Nút 👍 ở cuối input bar, nhấn → gửi ngay emoji đó (có thể đổi trong settings) |
| **Reactions** | Hover tin nhắn → hiện mini toolbar (❤️ 😆 😮 😢 😡 👍 + ⋯). Click → thả reaction. Reactions hiện dưới bubble dạng badge nhỏ |
| **Reply** | Swipe phải (mobile) hoặc click "Trả lời" → hiện preview trên input. Tin nhắn reply có quote nhỏ bên trên |
| **Unsend** | Long press / right click → "Thu hồi". Hiện "Tin nhắn đã bị thu hồi" (italic, màu nhạt) cho cả 2 bên |
| **Forward** | Click "Chuyển tiếp" → dialog chọn conversation(s) → gửi kèm label "Đã chuyển tiếp" |
| **Link Preview** | Paste URL → auto detect → hiện card preview (ảnh, title, description) bên dưới input trước khi gửi |
| **Image Grid** | 1 ảnh: full width. 2 ảnh: 2 cột. 3 ảnh: 1 lớn + 2 nhỏ. 4+ ảnh: grid 2×2 với "+N" overlay |
| **Voice Message** | Nhấn giữ 🎤 → ghi âm → hiện waveform + thời lượng → thả để gửi. Có nút play inline |
| **Conversation Info** | Click ℹ️ → slide panel từ phải: customize (theme, emoji, nickname), media gallery, files, links, members |
| **Theme Colors** | Đổi màu chủ đề conversation (bubble gửi đổi theo) — palette 15 màu giống FB |
| **Mini Chat** | Ở trang khác (không phải /chat): click chat icon → mở mini window góc dưới-phải (max 3) |
| **Notification Toast** | Tin nhắn mới: popup toast (avatar + name + preview) → click mở conversation |
| **Tab Title** | Unread: "(5) CampusConnect". Chat active: flash tên người đang nhập |
| **Sound** | Âm thanh "ting" cho tin nhắn mới (configurable) |
| **Browser Push** | Nếu tab không active → Browser Notification (cần user permission) |
| **Infinite Scroll** | Scroll lên → load older messages. Intersection Observer |
| **Pin Message** | Ghim 1 tin nhắn → hiện banner phía trên chat area. Click → scroll đến tin nhắn đó |
| **Search in Chat** | Tìm kiếm text trong conversation → highlight kết quả, navigate giữa các match |

### CSS Theme Colors (Messenger Palette)

```css
/* Conversation theme colors — giống FB Messenger */
:root {
  --chat-theme-default:   #0084FF;  /* Messenger Blue */
  --chat-theme-scarlet:   #FF2D55;
  --chat-theme-orange:    #FF6B35;
  --chat-theme-yellow:    #FFD60A;
  --chat-theme-green:     #34C759;
  --chat-theme-teal:      #00C7BE;
  --chat-theme-cyan:      #32ADE6;
  --chat-theme-blue:      #007AFF;
  --chat-theme-indigo:    #5856D6;
  --chat-theme-purple:    #AF52DE;
  --chat-theme-pink:      #FF2D55;
  --chat-theme-lavender:  #7B68EE;
  --chat-theme-berry:     #8E4585;
  --chat-theme-hotpink:   #FF69B4;
  --chat-theme-aqua:      #00CED1;
}
```

### Checklist Step 2.5

```
[ ] Chat page layout (conversation list + message area + info panel — 3 cột)
[ ] Conversation list header: "Đoạn chat" + [...] more options + [pencil] compose
[ ] Conversation list with search + filter (Tất cả | Chưa đọc | Nhóm | Cộng đồng)
[ ] Conversation item (avatar, name, last msg preview, time, unread badge, online dot)
[ ] Conversation item dropdown: Đã đọc, Tắt TB, Gọi thoại/video, Lưu trữ, Xóa, Báo cáo, Rời nhóm
[ ] Message requests list (tin nhắn chờ từ người lạ)
[ ] Archived conversations list (đoạn chat đã lưu trữ)
[ ] Group avatar (stacked multi-avatar)
[ ] Online status indicators (CSS green dot + "Hoạt động X phút trước")
[ ] Message bubbles (sent=right/theme-color, received=left/gray, grouped, rounded tails)
[ ] Message grouping (liên tiếp cách 2px + đổi border-radius, cách thời gian > 3p thì tách 16px)
[ ] Date dividers ("Hôm nay", "Hôm qua", "15 tháng 6")
[ ] Seen avatars (tiny 16px avatar dưới tin nhắn cuối — FB signature)
[ ] Message status ([check] Sent / [check][check] Delivered / mini-avatar Seen)
[ ] Message hover actions (hiện cạnh bubble): [smile] React, [reply] Trả lời, [more-vertical] Thêm
[ ] Reaction picker (hover → popup 6 SVG animated icons — KHÔNG emoji)
[ ] Reaction badges dưới tin nhắn (SVG icon + count)
[ ] Reaction detail dialog (click badge → xem ai react gì)
[ ] Reply to message (quote preview + scroll to original)
[ ] Edit message
[ ] Unsend message ("Tin nhắn đã bị thu hồi")
[ ] Delete for me only
[ ] Forward message dialog (chọn conversations)
[ ] Link preview card (auto-detect URL, show OG meta)
[ ] Image message (inline + click → lightbox)
[ ] Image grid (1/2/3/4+ layout)
[ ] Video message (inline player)
[ ] Voice message ([mic] record + waveform player)
[ ] File message card ([file] icon + name + size + [download])
[ ] Input bar layout: [+] [image] [sticker] [GIF] | Aa input | [smile] [thumbs-up]
[ ] Attachment button [+] → expand menu (File, Voice, Location)
[ ] Image upload button [image] — direct photo/video picker
[ ] Sticker button + StickerPicker (packs, grid, search, favorites)
[ ] GIF button + GiphyPicker (GIPHY search + trending + categories)
[ ] Quick emoji button ([thumbs-up] SVG, configurable per conv)
[ ] Emoji picker (full, categories, search, recent, skin tones)
[ ] Typing indicator (CSS ●●● dot animation in bubble)
[ ] Create group dialog (search members, set name/avatar)
[ ] Chat header: 3 nút tròn [phone] [video] [info] — [info] toggle bật/tắt Info Panel
[ ] Info panel: Header (avatar lớn + tên + trạng thái online)
[ ] Info panel: Quick actions (2 nút tròn: [bell] Tắt TBáo + [search] Tìm kiếm)
[ ] Info panel: Accordion "Thông tin về đoạn chat" (tên nhóm, ngày tạo, mô tả)
[ ] Info panel: Accordion "Tùy chỉnh đoạn chat" (chủ đề, emoji, biệt danh)
[ ] Info panel: Accordion "Thành viên trong đoạn chat" (vai trò, thêm/xóa, promote)
[ ] Info panel: Accordion "File PT, file và liên kết" (3 sub-tabs: PT/File/Link)
[ ] Info panel: Accordion "Quyền riêng tư và hỗ trợ" (chặn, báo cáo, rời nhóm)
[ ] Pin message (banner + click to scroll)
[ ] Search in conversation (highlight + navigate matches)
[ ] Archive conversation
[ ] Mute conversation (forever / 8h / 24h)
[ ] Leave group
[ ] Mini chat windows (max 5, bottom-right — FB-style, 328×455px)
[ ] Mini chat: minimize (avatar bubble) / close / "Mở trong Messenger"
[ ] Chat sidebar widget (right sidebar trên Feed + other pages)
[ ] Contact list (online dot CSS, click → open mini chat)
[ ] Notification toast popup (avatar + name + preview, 5s auto-dismiss)
[ ] Notification sound (configurable)
[ ] Browser tab title update "(N) CampusConnect"
[ ] Browser Web Push notification (khi tab inactive)
[ ] Virtual scrolling messages (react-virtuoso, reverse scroll)
[ ] IndexedDB offline cache (Dexie.js — instant load + offline queue)
[ ] Optimistic message send (temp → ACK → replace, retry on fail)
[ ] Batch seen receipts (client-side buffer, flush mỗi 2s)
[ ] Connection state sync (reconnect → fetch missed data → merge)
[ ] Scroll-to-bottom button ([chevron-down] icon, khi scroll lên)
[ ] Message context menu (right-click: reply, forward, copy, unsend, delete, pin, react)
[ ] Keyboard shortcuts (Enter=send, Shift+Enter=newline, Esc=close)
[ ] Mobile responsive (full-screen chat, swipe gestures)
[ ] Dark mode support
[ ] Skeleton shimmer loading (KHÔNG spinner)
[ ] Empty states (SVG illustrations)
[ ] Error handling + retry
[ ] Accessibility (focus-visible, aria-labels, keyboard navigation)
[ ] Video/Voice Call: IncomingCallDialog (ringtone + avatar + Accept/Decline)
[ ] Video/Voice Call: CallOverlay (full-screen video layout)
[ ] Video/Voice Call: CallControls (mic, camera, share screen, end call)
[ ] Video/Voice Call: CallTimer (bộ đếm thời gian)
[ ] Video/Voice Call: CallParticipantGrid (grid layout cho group call)
[ ] Video/Voice Call: CallMinimized (PiP floating mini window)
[ ] Video/Voice Call: CallHistory (lịch sử cuộc gọi)
[ ] Video/Voice Call: CallMessageBubble ("Cuộc gọi video - 5:32" trong chat)
[ ] Video/Voice Call: Ringtone sound + vibration
```

---

## STEP 2.6: NOTIFICATIONS SYSTEM

> **Duration:** 5 ngày | **Assign:** Dev 2 (BE) + Dev 5 (FE)
> **Prerequisite:** Step 2.1, 2.3

### Prisma Schema (thêm)

```prisma
enum NotificationType {
  FRIEND_REQUEST
  FRIEND_ACCEPTED
  LIKE
  COMMENT
  REPLY
  MENTION
  SHARE
  STORY_REACTION
  STORY_REPLY
  STUDY_GROUP
  EVENT
  CHAT
  SYSTEM
}

model Notification {
  id            String           @id @default(uuid())
  userId        String           @map("user_id")
  senderId      String?          @map("sender_id")
  type          NotificationType
  title         String
  content       String?
  actionUrl     String?          @map("action_url")
  referenceId   String?          @map("reference_id")
  referenceType String?          @map("reference_type")
  isRead        Boolean          @default(false) @map("is_read")
  createdAt     DateTime         @default(now()) @map("created_at")

  user   User  @relation("recipient", fields: [userId], references: [id], onDelete: Cascade)
  sender User? @relation("notificationSender", fields: [senderId], references: [id], onDelete: SetNull)

  @@index([userId, isRead, createdAt(sort: Desc)])
  @@map("notifications")
}
```

### Notification Events (tự động trigger)

| Event | Notification |
|-------|-------------|
| Friend request sent | "X đã gửi lời mời kết bạn" |
| Friend request accepted | "X đã chấp nhận lời mời kết bạn" |
| Post liked | "X đã thích bài viết của bạn" |
| Post commented | "X đã bình luận bài viết của bạn" |
| Comment replied | "X đã trả lời bình luận của bạn" |
| Post shared | "X đã chia sẻ bài viết của bạn" |
| Mentioned in post/comment | "X đã nhắc đến bạn" |
| Story reacted | "X đã react story của bạn" |
| Story replied | "X đã trả lời story của bạn" |

### Delivery Channels

1. **In-app** (Socket.IO real-time) — bắt buộc
2. **Push notification** (Browser Web Push) — tùy chọn
3. **Email digest** (BullMQ worker, daily/weekly) — Phase sau

### Checklist Step 2.6

```
[ ] Notification model + service
[ ] Auto-create notifications on events (like, comment, friend, story react, etc.)
[ ] Real-time delivery via Socket.IO
[ ] REST API: list, mark read, mark all read, delete
[ ] Unread count endpoint
[ ] Notification dropdown component (header [bell] icon)
[ ] Notification page (full list)
[ ] Mark as read on click
[ ] Group similar notifications ("X và 5 người khác đã thích...")
[ ] BullMQ worker for async notification creation
[ ] Notification icons: SVG (KHÔNG emoji)
[ ] Mobile responsive
```

---

## STEP 2.7: INTEGRATION & TESTING

> **Duration:** 3 ngày | **Assign:** Toàn team
> **Prerequisite:** Step 2.1 - 2.6

### Tasks

```
[ ] Full social flow: create post → like → comment → share
[ ] Story flow: create story → view → react → reply → expire (24h)
[ ] Chat flow: DM → group → file → typing → read receipt → mini chat
[ ] Friend flow: request → accept → mutual → unfriend
[ ] Notification flow: action → notification → mark read
[ ] Feed algorithm correctness check
[ ] Socket.IO reconnection + state sync handling
[ ] Emoji audit: ZERO emoji characters used as UI icons (grep check)
[ ] Virtual scroll: feed 500+ posts và chat 5000+ messages smooth
[ ] Performance: feed load < 1.5s (first paint)
[ ] Performance: chat message delivery < 200ms
[ ] Performance: story viewer open < 500ms
[ ] Responsive: all pages on mobile/tablet/desktop
[ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
[ ] Dark mode: all components consistent
[ ] Unit test coverage ≥75%
[ ] Deploy staging trên VPS
[ ] Load test: 100 concurrent users
```

---

## DEPENDENCIES

```
Step 2.1 (Feed BE) ──→ Step 2.2 (Feed FE)
     │                        │
     │                  Step 2.2b (Stories)
     │
     ├──→ Step 2.3 (Friends) ──→ Step 2.6 (Notifications)
     │
     └──→ Step 2.4 (Chat BE) ──→ Step 2.5 (Chat FE)
                                         │
                              Step 2.6 ───┘
                                    │
                              Step 2.7 (Integration)
```

### Parallel Work

| Dev | Tuần 7-8 | Tuần 9-10 | Tuần 11-12 | Tuần 13-14 |
|-----|----------|-----------|------------|------------|
| Dev 1 | 2.1 Feed BE | 2.4 Chat BE | 2.4 Chat BE (perf) | Code review |
| Dev 2 | 2.1 Feed BE | 2.2b Stories BE | 2.3 Friends BE | 2.6 Notification BE |
| Dev 3 | 2.2 Feed FE | 2.2b Stories FE | 2.5 Chat FE | 2.7 Integration |
| Dev 4 | 2.2 Feed FE | 2.3 Friends FE | 2.5 Chat FE | 2.6 Notification FE |
| Dev 5 | DevOps + hỗ trợ | 2.5 Chat FE | 2.5 Mini Chat | 2.7 Testing |

---

> **Output Phase 2:** Mạng xã hội hoàn chỉnh: feed với stories carousel, post interactions (reactions SVG), messenger-level chat (virtual scroll, offline cache, mini chat windows), friends, notifications. Toàn bộ UI icons dùng SVG/CSS — KHÔNG emoji.
>
> **Tiếp theo:** [03-PHASE-3-EDUCATION.md](./03-PHASE-3-EDUCATION.md)
