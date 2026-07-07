# PHASE 4: COMMERCE & EVENTS
## Student Marketplace + Event Management + Club Management

> **Duration:** Tuần 19-22 (28 ngày)
> **Prerequisite:** Phase 3 hoàn thành
> **Goal:** Sinh viên có thể mua bán đồ cũ, đăng ký sự kiện CLB, check-in QR
> **UI Rule:** Tất cả icon dùng inline SVG (Lucide) — KHÔNG dùng emoji.

---

## MỤC LỤC

- [Step 4.1: Marketplace Backend](#step-41-marketplace-backend)
- [Step 4.2: Marketplace Frontend](#step-42-marketplace-frontend)
- [Step 4.3: Event Management Backend](#step-43-event-management-backend)
- [Step 4.4: Event & Club Frontend](#step-44-event--club-frontend)
- [Step 4.5: Integration & Testing](#step-45-integration--testing)

---

## STEP 4.1: MARKETPLACE BACKEND

> **Duration:** 5 ngày | **Assign:** Dev 2
> **Prerequisite:** Phase 3

### Prisma Schema (thêm)

> **⚠️ User model additions (BẮT BUỘC để Prisma compile).**
> Gom toàn bộ relation ngược của Phase 4 (Marketplace + Events + Clubs) vào `model User` (định nghĩa ở Phase 1).
>
> ```prisma
> model User {
>   // ... field & relation từ Phase 1-3 ...
>
>   // --- Marketplace (4.1) ---
>   products         Product[]          // as seller (sellerId)
>   productFavorites ProductFavorite[]
>   sellerReviews    SellerReview[] @relation("sellerReviews")  // review nhận được (as seller)
>   buyerReviews     SellerReview[] @relation("buyerReviews")   // review đã viết (as buyer)
>   productReports   ProductReport[]    // as reporter (reporterId)
>
>   // --- Events & Clubs (4.3) ---
>   clubMembers        ClubMember[]
>   eventsOrganized    Event[]            // as organizer (organizerId)
>   eventRegistrations EventRegistration[]
> }
> ```
>
> *Lưu ý:* `SellerReview` có cả `sellerId` và `buyerId` cùng trỏ tới `User`, đã đặt tên relation phân biệt
> (`"sellerReviews"` / `"buyerReviews"`) ở model con — hai relation ngược trong `model User` phải khớp đúng tên đó.

```prisma
enum ProductCategory {
  TEXTBOOK
  LAPTOP
  ELECTRONICS
  BICYCLE
  ACCESSORIES
  OTHER
}

enum ProductCondition {
  NEW
  LIKE_NEW
  GOOD
  FAIR
  POOR
}

enum ProductStatus {
  AVAILABLE
  SOLD
  RESERVED
  REMOVED
}

model Product {
  id             String           @id @default(uuid())
  sellerId       String           @map("seller_id")
  title          String
  description    String?
  price          Decimal          @db.Decimal(12, 0) // VND, không có decimal
  originalPrice  Decimal?         @map("original_price") @db.Decimal(12, 0)
  category       ProductCategory  @default(OTHER)
  condition      ProductCondition @default(GOOD)
  status         ProductStatus    @default(AVAILABLE)
  location       String?
  viewCount      Int              @default(0) @map("view_count")
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  seller    User               @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  images    ProductImage[]
  favorites ProductFavorite[]
  reviews   SellerReview[]
  reports   ProductReport[]

  @@index([sellerId])
  @@index([category])
  @@index([status])
  @@index([price])
  @@index([createdAt(sort: Desc)])
  @@map("products")
}

model ProductImage {
  id           String   @id @default(uuid())
  productId    String   @map("product_id")
  imageUrl     String   @map("image_url")
  displayOrder Int      @default(0) @map("display_order")
  createdAt    DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model ProductFavorite {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([productId, userId])
  @@map("product_favorites")
}

model SellerReview {
  id        String   @id @default(uuid())
  sellerId  String   @map("seller_id")
  buyerId   String   @map("buyer_id")
  productId String   @map("product_id")
  rating    Int      // 1-5
  comment   String?
  createdAt DateTime @default(now()) @map("created_at")

  seller  User    @relation("sellerReviews", fields: [sellerId], references: [id])
  buyer   User    @relation("buyerReviews", fields: [buyerId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([buyerId, productId])
  @@map("seller_reviews")
}

model ProductReport {
  id          String       @id @default(uuid())
  productId   String       @map("product_id")
  reporterId  String       @map("reporter_id")
  reason      ReportReason
  description String?
  status      ReportStatus @default(PENDING)
  createdAt   DateTime     @default(now()) @map("created_at")

  product  Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  reporter User    @relation(fields: [reporterId], references: [id])

  @@map("product_reports")
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | Danh sách (filter: category, condition, price range, location) |
| `POST` | `/products` | Đăng bán (+ multi images) |
| `GET` | `/products/:id` | Chi tiết (increment view_count) |
| `PUT` | `/products/:id` | Cập nhật |
| `DELETE` | `/products/:id` | Xóa |
| `PATCH` | `/products/:id/status` | Đổi trạng thái (SOLD, RESERVED) |
| `POST` | `/products/:id/favorite` | Yêu thích |
| `DELETE` | `/products/:id/favorite` | Bỏ yêu thích |
| `GET` | `/products/favorites` | Danh sách yêu thích |
| `GET` | `/products/my` | Sản phẩm của tôi |
| `POST` | `/products/:id/report` | Báo cáo vi phạm |
| `POST` | `/products/:id/contact` | Tạo DM với người bán |
| `POST` | `/sellers/:id/review` | Đánh giá người bán |
| `GET` | `/sellers/:id/reviews` | Danh sách đánh giá |
| `GET` | `/products/search` | Tìm kiếm |

### Lưu ý: Không tích hợp thanh toán

- Marketplace chỉ là nền tảng kết nối
- Người bán và người mua trao đổi qua Chat
- Thanh toán trực tiếp ngoài app
- Đánh giá người bán dựa trên trải nghiệm giao dịch

### Checklist Step 4.1

```
[ ] Product CRUD with multi-image upload
[ ] Image validation (type, size, max 10 images per product)
[ ] Category/condition/status filters
[ ] Price range filter
[ ] Search by title
[ ] Favorite/unfavorite
[ ] View count tracking
[ ] Seller review system
[ ] Report product
[ ] Auto-create DM with seller on "contact"
[ ] Product status management (AVAILABLE → SOLD/RESERVED)
[ ] Only seller can edit/delete own products
[ ] Pagination (cursor-based)
[ ] Unit tests
```

---

## STEP 4.2: MARKETPLACE FRONTEND

> **Duration:** 5 ngày | **Assign:** Dev 3
> **Prerequisite:** Step 4.1

### Pages

- `/marketplace` — Browse products (grid + filters)
- `/marketplace/:id` — Product detail (gallery, seller info)
- `/marketplace/sell` — Post new product
- `/marketplace/my` — My products
- `/marketplace/favorites` — Favorited products

### Layout

```
┌────────────────────────────────────────────────────────┐
│ Header                                                  │
├────────┬───────────────────────────────────────────────┤
│Sidebar │  🛒 Chợ Sinh viên                             │
│        │                                                │
│        │  🔍 Tìm kiếm sản phẩm...                     │
│        │                                                │
│        │  [Tất cả] [Giáo trình] [Laptop] [Xe đạp] ... │
│        │                                                │
│        │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│        │  │ 📷      │ │ 📷      │ │ 📷      │         │
│        │  │ Title   │ │ Title   │ │ Title   │         │
│        │  │ 200.000đ│ │ 1.5Mđ   │ │ 50.000đ │         │
│        │  │ ⭐ 4.5  │ │ 🆕 New  │ │ 📍 Q.5  │         │
│        │  │ ♡ Save  │ │ ♡ Save  │ │ ♡ Save  │         │
│        │  └─────────┘ └─────────┘ └─────────┘         │
│        │                                                │
│        │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│        │  │ ...     │ │ ...     │ │ ...     │         │
│        │  └─────────┘ └─────────┘ └─────────┘         │
│        │                                                │
│        │  [+ Đăng bán]                    Load more... │
└────────┴───────────────────────────────────────────────┘
```

### Checklist Step 4.2

```
[ ] Product browse page (responsive grid)
[ ] Category tabs/filter
[ ] Price range slider
[ ] Condition filter
[ ] Sort: newest, price low-high, price high-low
[ ] Product detail page (image gallery, seller info)
[ ] Image carousel/gallery with zoom
[ ] Post product form (multi-image upload, preview)
[ ] Favorite toggle (heart icon)
[ ] "Chat với người bán" button
[ ] My products page (with status management)
[ ] Favorites page
[ ] Report dialog
[ ] Price formatting (VND)
[ ] Empty states
[ ] Mobile responsive
```

---

## STEP 4.3: EVENT MANAGEMENT BACKEND

> **Duration:** 5 ngày | **Assign:** Dev 1
> **Prerequisite:** Phase 3

### Prisma Schema (thêm)

```prisma
enum EventStatus {
  DRAFT
  PUBLISHED
  ONGOING
  COMPLETED
  CANCELLED
}

enum EventCategory {
  ACADEMIC
  SPORTS
  CULTURAL
  TECH
  SOCIAL
  OTHER
}

enum RegistrationStatus {
  REGISTERED
  CHECKED_IN
  CANCELLED
}

enum ClubStatus {
  ACTIVE
  INACTIVE
}

enum ClubMemberRole {
  PRESIDENT
  VICE_PRESIDENT
  MEMBER
}

model Club {
  id          String     @id @default(uuid())
  name        String
  description String?
  logoUrl     String?    @map("logo_url")
  bannerUrl   String?    @map("banner_url")
  presidentId String?    @map("president_id")
  memberCount Int        @default(0) @map("member_count")
  status      ClubStatus @default(ACTIVE)
  createdAt   DateTime   @default(now()) @map("created_at")

  president User?        @relation("clubPresident", fields: [presidentId], references: [id])
  members   ClubMember[]
  events    Event[]

  @@map("clubs")
}

model ClubMember {
  id       String         @id @default(uuid())
  clubId   String         @map("club_id")
  userId   String         @map("user_id")
  role     ClubMemberRole @default(MEMBER)
  joinedAt DateTime       @default(now()) @map("joined_at")

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([clubId, userId])
  @@map("club_members")
}

model Event {
  id                  String        @id @default(uuid())
  organizerId         String        @map("organizer_id")
  clubId              String?       @map("club_id")
  title               String
  description         String?
  location            String?
  bannerUrl           String?       @map("banner_url")
  startTime           DateTime      @map("start_time")
  endTime             DateTime      @map("end_time")
  maxParticipants     Int?          @map("max_participants")
  currentParticipants Int           @default(0) @map("current_participants")
  isFree              Boolean       @default(true) @map("is_free")
  ticketPrice         Decimal       @default(0) @map("ticket_price") @db.Decimal(12, 0)
  status              EventStatus   @default(DRAFT)
  category            EventCategory @default(OTHER)
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  organizer     User                @relation(fields: [organizerId], references: [id])
  club          Club?               @relation(fields: [clubId], references: [id])
  registrations EventRegistration[]

  @@index([startTime])
  @@index([status])
  @@index([category])
  @@map("events")
}

model EventRegistration {
  id           String             @id @default(uuid())
  eventId      String             @map("event_id")
  userId       String             @map("user_id")
  qrCode       String             @unique @map("qr_code")
  status       RegistrationStatus @default(REGISTERED)
  registeredAt DateTime           @default(now()) @map("registered_at")
  checkedInAt  DateTime?          @map("checked_in_at")

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@map("event_registrations")
}
```

### API Endpoints

#### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events` | Danh sách (filter: category, status, date range) |
| `POST` | `/events` | Tạo sự kiện |
| `GET` | `/events/:id` | Chi tiết |
| `PUT` | `/events/:id` | Cập nhật |
| `DELETE` | `/events/:id` | Xóa |
| `POST` | `/events/:id/register` | Đăng ký (generate QR) |
| `DELETE` | `/events/:id/register` | Hủy đăng ký |
| `POST` | `/events/:id/checkin` | Check-in bằng QR code |
| `GET` | `/events/:id/participants` | Danh sách tham gia |
| `GET` | `/events/:id/export` | Xuất Excel (admin/organizer) |
| `GET` | `/events/my-registrations` | Sự kiện đã đăng ký |
| `GET` | `/events/upcoming` | Sự kiện sắp diễn ra |

#### Clubs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/clubs` | Danh sách CLB |
| `POST` | `/clubs` | Tạo CLB |
| `GET` | `/clubs/:id` | Chi tiết |
| `PUT` | `/clubs/:id` | Cập nhật (president only) |
| `POST` | `/clubs/:id/join` | Gia nhập |
| `DELETE` | `/clubs/:id/leave` | Rời |
| `GET` | `/clubs/:id/members` | Danh sách thành viên |
| `GET` | `/clubs/:id/events` | Sự kiện của CLB |
| `GET` | `/clubs/my` | CLB của tôi |

### QR Code Generation

```typescript
// Khi đăng ký sự kiện → generate unique QR code
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

async registerEvent(eventId: string, userId: string) {
  const qrCodeData = `CC-EVENT-${uuidv4()}`;

  const registration = await this.prisma.eventRegistration.create({
    data: {
      eventId,
      userId,
      qrCode: qrCodeData,
    },
  });

  // Generate QR code image
  const qrImageUrl = await QRCode.toDataURL(qrCodeData);

  return { registration, qrImageUrl };
}

// Check-in: scan QR → validate → mark checked_in
async checkin(qrCode: string) {
  const registration = await this.prisma.eventRegistration.findUnique({
    where: { qrCode },
    include: { event: true, user: true },
  });

  if (!registration) throw new NotFoundException('QR không hợp lệ');
  if (registration.status === 'CHECKED_IN') throw new BadRequestException('Đã check-in');
  if (registration.status === 'CANCELLED') throw new BadRequestException('Đã hủy');

  return this.prisma.eventRegistration.update({
    where: { id: registration.id },
    data: { status: 'CHECKED_IN', checkedInAt: new Date() },
  });
}
```

### Excel Export

```typescript
// GET /events/:id/export
// Uses 'exceljs' library
import * as ExcelJS from 'exceljs';

async exportParticipants(eventId: string): Promise<Buffer> {
  const registrations = await this.prisma.eventRegistration.findMany({
    where: { eventId },
    include: {
      user: { select: { fullName: true, email: true, studentId: true, faculty: true } },
    },
    orderBy: { registeredAt: 'asc' },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Participants');

  sheet.columns = [
    { header: 'STT', key: 'stt', width: 5 },
    { header: 'Họ tên', key: 'name', width: 25 },
    { header: 'MSSV', key: 'studentId', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Khoa', key: 'faculty', width: 20 },
    { header: 'Trạng thái', key: 'status', width: 15 },
    { header: 'Thời gian đăng ký', key: 'registeredAt', width: 20 },
    { header: 'Thời gian check-in', key: 'checkedInAt', width: 20 },
  ];

  registrations.forEach((reg, i) => {
    sheet.addRow({
      stt: i + 1,
      name: reg.user.fullName,
      studentId: reg.user.studentId,
      email: reg.user.email,
      faculty: reg.user.faculty?.name,
      status: reg.status === 'CHECKED_IN' ? 'Đã check-in' : 'Đã đăng ký',
      registeredAt: reg.registeredAt,
      checkedInAt: reg.checkedInAt || '',
    });
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}
```

### Checklist Step 4.3

```
[ ] Event CRUD
[ ] Event status lifecycle (DRAFT → PUBLISHED → ONGOING → COMPLETED)
[ ] Event registration (with max participant check)
[ ] QR code generation on registration
[ ] Check-in by QR code
[ ] Excel export (participants list)
[ ] Event categories filter
[ ] Upcoming events
[ ] Club CRUD
[ ] Club membership (join/leave)
[ ] Club events
[ ] Reputation points for event organizing (+15)
[ ] Notifications: event reminders, registration confirmation
[ ] Unit tests
```

---

## STEP 4.4: EVENT & CLUB FRONTEND

> **Duration:** 7 ngày | **Assign:** Dev 3 + Dev 4
> **Prerequisite:** Step 4.3

### Pages

#### Events
- `/events` — Browse (calendar view + list view)
- `/events/:id` — Detail (register, QR display)
- `/events/create` — Create event form
- `/events/my-registrations` — My events (with QR codes)

#### Clubs
- `/clubs` — Browse clubs
- `/clubs/:id` — Club detail (members, events)

### Key Components

```
components/events/
├── EventCard.tsx             # Card sự kiện
├── EventDetail.tsx           # Trang chi tiết
├── EventCalendar.tsx         # Calendar view
├── CreateEventForm.tsx       # Form tạo sự kiện
├── RegistrationButton.tsx    # Đăng ký / Hủy
├── QRDisplay.tsx             # Hiển thị QR code
├── QRScanner.tsx             # Quét QR check-in
├── ParticipantList.tsx       # Danh sách tham gia
├── ExportButton.tsx          # Nút xuất Excel
├── ClubCard.tsx              # Card CLB
└── ClubDetail.tsx            # Chi tiết CLB
```

### Event Page Layout

```
┌────────────────────────────────────────────────────────┐
│ 🎪 Sự kiện                                             │
│                                                        │
│ [📅 Calendar] [📋 List] [📍 Map]                       │
│                                                        │
│ [Tất cả] [Học thuật] [Thể thao] [Văn hóa] [Tech] ... │
│                                                        │
│ ┌──────────────────────┐ ┌──────────────────────┐     │
│ │ 📷 Banner            │ │ 📷 Banner            │     │
│ │ Workshop AI/ML       │ │ Giải bóng đá SV     │     │
│ │ 📅 Jun 20 · 14:00   │ │ 📅 Jun 25 · 08:00   │     │
│ │ 📍 Hội trường A     │ │ 📍 Sân vận động     │     │
│ │ 👥 45/100 tham gia   │ │ 👥 Miễn phí         │     │
│ │ 🏷️ CLB CNTT         │ │ 🏷️ CLB Thể thao    │     │
│ │ [Đăng ký]            │ │ [Đăng ký]            │     │
│ └──────────────────────┘ └──────────────────────┘     │
└────────────────────────────────────────────────────────┘
```

### QR Check-in Flow

```
1. Organizer mở trang check-in → bật camera
2. Scan QR code từ điện thoại/màn hình attendee
3. Hiển thị: ✅ Tên SV + MSSV + Trạng thái
4. Auto-mark CHECKED_IN
5. Counter realtime (đã check-in / tổng đăng ký)
```

### Checklist Step 4.4

```
[ ] Event browse page (list + calendar)
[ ] Event detail page (description, location, register)
[ ] Create event form (date picker, banner upload)
[ ] Registration flow (click → QR generated)
[ ] My registrations page (QR code display)
[ ] QR scanner for check-in (camera-based)
[ ] Check-in success/error feedback
[ ] Participant list (for organizers)
[ ] Export Excel button
[ ] Club browse page
[ ] Club detail page
[ ] Join/leave club
[ ] Event countdown timer
[ ] Responsive design
```

---

## STEP 4.5: INTEGRATION & TESTING

> **Duration:** 3 ngày | **Assign:** Toàn team

### Tasks

```
[ ] Product: post → browse → contact seller → chat → mark sold
[ ] Event: create → publish → register → QR → check-in → export
[ ] Club: create → join → create event → manage
[ ] Cross-module: marketplace contact → opens chat
[ ] Cross-module: club event → event module
[ ] QR scanner works on mobile camera
[ ] Excel export works correctly
[ ] Image gallery performance
[ ] Price formatting correctness
[ ] All pages responsive
[ ] Deploy to staging
```

---

## DEPENDENCIES & PARALLEL WORK

| Dev | Tuần 19-20 | Tuần 21-22 |
|-----|-----------|-----------|
| Dev 1 | 4.3 Event BE | 4.5 Integration |
| Dev 2 | 4.1 Marketplace BE | 4.3 Club BE |
| Dev 3 | 4.2 Marketplace FE | 4.4 Event FE |
| Dev 4 | 4.4 Club FE | 4.4 Event FE |
| Dev 5 | QR library + DevOps | 4.5 Testing |

---

> **Output Phase 4:** Marketplace chạy (không thanh toán), Events + Clubs management, QR check-in.
>
> **Tiếp theo:** [05-PHASE-5-GAMIFICATION.md](./05-PHASE-5-GAMIFICATION.md)
