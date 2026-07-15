# Task Plan: Nâng cấp Club hiện đại

## Mục tiêu

Nâng module Club từ mức cơ bản thành hệ sinh thái cộng đồng hiện đại: khám phá CLB, hồ sơ CLB, duyệt thành viên, quản trị, bài viết, sự kiện, chat, invite, QR, analytics nhỏ.

## Phase 0 — Sửa nền tảng hiện có

### [x] Task C0.1 — Audit API/hook Club

**Mục tiêu:** đảm bảo chức năng hiện tại chạy đúng trước khi thêm tính năng mới.

**Đã làm:**
- Sửa `useClubs.ts`: leave API dùng `DELETE /clubs/:id/join`.
- Chuẩn hóa type frontend có `isJoined`, `isMember`, `myRole`, `type`, `isVerified`, `bannerUrl`.

**Files:**
- `apps/web-client/src/hooks/useClubs.ts`

**Verify:**
- Join/leave invalidate lại list/detail.

---

### [x] Task C0.2 — Fix trạng thái thành viên trong list/detail

**Mục tiêu:** card CLB biết user đã tham gia hay chưa.

**Đã làm:**
- `ClubsService.list()` include `members.userId` và `members.role`.
- `toDto()` trả `isJoined`, `isMember`, `myRole`, `memberCount` đúng theo viewer.
- Không leak raw `members` trong list DTO.

**Files:**
- `apps/user-service/src/clubs/clubs.service.ts`

**Verify:**
- User join CLB, reload list/detail vẫn đúng trạng thái.

---

### [x] Task C0.3 — Định nghĩa Club contract v1

**Fields đề xuất:**
- `id`
- `name`
- `description`
- `type`
- `category`
- `visibility`
- `joinMode`
- `logoUrl`
- `bannerUrl`
- `rules`
- `tags`
- `location`
- `contactEmail`
- `socialLinks`
- `isVerified`
- `featured`
- `status`
- `owner`
- `memberCount`
- `isJoined`
- `myRole`
- `createdAt`
- `updatedAt`

**Đã làm:**
- Contract Club v1 đã được phản ánh vào Prisma schema và service DTO.

---

## Phase 1 — Schema và API nền

### [x] Task C1.1 — Mở rộng Prisma schema Club

**Việc làm:**
- Thêm field nullable vào `Club`: `category`, `visibility`, `joinMode`, `logoUrl`, `bannerUrl`, `rules`, `tags`, `location`, `contactEmail`, `socialLinks`, `featured`, `status`, `verifiedAt`.
- Thêm index: `category`, `type`, `status`, `featured`, `createdAt`.

**Files:**
- `packages/database/prisma/schema.prisma`

**Đã làm:**
- Thêm field nullable/default-safe: `category`, `type`, `visibility`, `joinMode`, `logoUrl`, `bannerUrl`, `rules`, `tags`, `location`, `contactEmail`, `socialLinks`, `featured`, `status`, `verifiedAt`.
- Thêm index: `category`, `type`, `status`, `featured`, `createdAt`.
- Đã chạy `prisma db push` và generate client.

---

### [x] Task C1.2 — Update create/update DTO

**Việc làm:**
- Update DTO create/edit club.
- Validate `name`, `description`, `category`, `joinMode`, `visibility`.
- Sanitize `tags`, `socialLinks`, `contactEmail`.

**Đã làm:**
- `create()` và `update()` nhận/lưu field Club v1.
- Validate enum string: `type`, `visibility`, `joinMode`.
- Sanitize optional string, tags array, socialLinks object.

---

### [x] Task C1.3 — Nâng cấp API list/search

**API:**
- `GET /clubs?search=&category=&type=&joinMode=&sort=&page=&limit=`

**Sort:**
- `newest`
- `memberCount`
- `featured`
- `trending`

**Đã làm:**
- `GET /clubs` nhận `search`, `category`, `type`, `joinMode`, `sort`, `page`, `limit`.
- Mặc định lọc `status=ACTIVE`.
- Hỗ trợ sort `featured`, `name`, mặc định newest.

---

## Phase 2 — UI khám phá CLB

### [ ] Task C2.1 — Nâng cấp `ClubCard`

**UI cần có:**
- Banner, logo, verified badge, category chip, tags, member count.
- CTA: `Tham gia`, `Yêu cầu tham gia`, `Đã tham gia`, `Đang chờ duyệt`.

### [x] Task C2.2 — Nâng cấp `/clubs` dashboard

**Sections:**
- `CLB của tôi`
- `CLB chính thức`
- `Cộng đồng nổi bật`
- `Gợi ý cho bạn`
- `Tất cả CLB`

**Đã làm:**
- Nâng `/clubs` thành dashboard có hero, stats, `CLB của tôi`, `Gợi ý cho bạn`, `CLB chính thức`, `Cộng đồng tự do`.
- Chuyển sang dùng `useClubs()` để thống nhất data contract.

**Files:**
- `apps/web-client/src/app/(main)/clubs/page.tsx`

### [x] Task C2.3 — Tạo `/clubs/discover`

**UI:**
- Hero search, category carousel, sort dropdown, infinite grid, suggested clubs.

**Đã làm:**
- Tạo trang `/clubs/discover` với hero, search, filter category, suggested clubs và grid kết quả.
- Dùng `useClubs()` và `ClubCard` để giữ trạng thái join/leave đồng nhất.

**Files:**
- `apps/web-client/src/app/(main)/clubs/discover/page.tsx`

### [ ] Task C2.4 — Nâng cấp `/clubs/create` thành wizard

**Steps:**
1. Thông tin cơ bản.
2. Nhận diện.
3. Quy định.
4. Liên hệ.

**Đã làm một phần:**
- Thêm category picker.
- Thêm join mode picker.
- Thêm rules textarea.
- Gửi payload sẵn cho backend v1.

**Còn lại:**
- Tách thành wizard 4 bước.
- Upload logo/banner.
- Lưu đầy đủ sau schema Club v1.

**Files:**
- `apps/web-client/src/app/(main)/clubs/create/page.tsx`

---

## Phase 3 — Profile Club hiện đại

### [ ] Task C3.1 — Nâng cấp hero `/clubs/:id`

**UI:** banner, logo, verified badge, owner, tags, member count, CTA sticky mobile.

### [ ] Task C3.2 — Thêm tabs detail

**Tabs:** `Bài viết`, `Thông báo`, `Sự kiện`, `Thành viên`, `Giới thiệu`.

### [ ] Task C3.3 — Members tab

**UI:** avatar, full name, role badge, joined date, search local.

### [ ] Task C3.4 — About tab

**UI:** mô tả, rules, contact, location, social links, owner, created date.

---

## Phase 4 — Join approval và invite

### [x] Task C4.1 — Thêm model `ClubJoinRequest`

**Đã làm:**
- Thêm bảng `club_join_requests` với unique `clubId_userId`.
- Thêm relation `Club.joinRequests` và `User.clubJoinRequests`.

### [x] Task C4.2 — Sửa join flow theo `joinMode`

**Đã làm:**
- `OPEN` tham gia ngay.
- `APPROVAL` tạo request trạng thái `PENDING`.
- `INVITE_ONLY` chặn tham gia trực tiếp.
- UI detail hiện `Chờ duyệt` khi request đang pending.

### [x] Task C4.3 — API duyệt join request

**Đã làm:**
- `GET /clubs/:id/requests`.
- `POST /clubs/:id/requests/:requestId/approve`.
- `POST /clubs/:id/requests/:requestId/reject`.

### [x] Task C4.4 — UI request join

**Đã làm:**
- Trang `/clubs/:id/manage` có nút `Duyệt` và `Từ chối` cho request pending.

### [ ] Task C4.5 — Invite bạn bè

### [ ] Task C4.6 — Notification join/invite

---

## Phase 5 — Quản trị Club

### [x] Task C5.1 — Tạo `/clubs/:id/manage`

**Đã làm:**
- Tạo trang quản trị cơ bản `/clubs/:id/manage`.
- Chặn user không phải `OWNER` hoặc `ADMIN`.
- Hiển thị thông tin cơ bản, tổng quan thành viên, vai trò, loại CLB.

**Files:**
- `apps/web-client/src/app/(main)/clubs/[id]/manage/page.tsx`

### [ ] Task C5.2 — Manage info/settings

### [x] Task C5.3 — Manage members/roles

**Đã làm:**
- Trang quản trị hiển thị danh sách member.
- Đổi role `MEMBER`, `MODERATOR`, `ADMIN`.
- Không cho đổi role `OWNER`.
- Chỉ `OWNER` được cấp/quản lý `ADMIN`.

### [ ] Task C5.4 — Transfer ownership

### [ ] Task C5.5 — Moderation cơ bản

---

## Phase 6 — Nội dung Club

### [x] Task C6.1 — Thêm `Post.clubId`

**Đã làm:**
- Thêm relation `Post.clubId` với `Club.posts`.
- Prisma generate + db push đã chạy thành công.

### [x] Task C6.2 — API club posts

**Đã làm:**
- Thêm `GET /posts/club/:clubId`.
- `POST /posts` nhận `clubId`, kiểm tra thành viên CLB trước khi đăng.
- Smoke test qua proxy `GET /api/posts/club/:clubId?limit=5` trả `200`.

### [x] Task C6.3 — UI club feed/composer

**Đã làm:**
- `/clubs/:id` có composer thật, đăng nội dung + ảnh.
- Hiển thị feed bài viết CLB bằng `PostCard`.
- Quản trị viên CLB sửa logo/banner trực tiếp trên hero.
- Build backend/frontend đã pass.

### [ ] Task C6.4 — Club announcements

### [ ] Task C6.5 — Pin bài quan trọng

### [ ] Task C6.6 — Poll nhỏ trong Club

---

## Phase 7 — Sự kiện Club

### [ ] Task C7.1 — Liên kết Event với Club

### [ ] Task C7.2 — API club events

### [ ] Task C7.3 — UI tab sự kiện

### [ ] Task C7.4 — Attendance/check-in

---

## Phase 8 — Chat và realtime

### [ ] Task C8.1 — Club group chat

### [ ] Task C8.2 — Realtime member/join state

### [ ] Task C8.3 — Club live activity nhỏ

---

## Phase 9 — Micro-features hiện đại

### [ ] Task C9.1 — Favorite/bookmark Club

### [ ] Task C9.2 — QR/link mời Club

### [ ] Task C9.3 — Club badges/achievements

### [x] Task C9.4 — Club analytics nhỏ

**Đã làm:**
- API `GET /clubs/:id/analytics`.
- UI hiển thị members, pending requests, posts, new members 7 ngày, posts 7 ngày.

### [ ] Task C9.5 — Report Club/content

---

## Phase 10 — Security, performance, launch

### [ ] Task C10.1 — Permission hardening

### [ ] Task C10.2 — Pagination/performance

### [ ] Task C10.3 — Mobile QA

### [ ] Task C10.4 — Seed demo data

### [ ] Task C10.5 — Release checklist
