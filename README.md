# CMC Network

Nền tảng số dành cho sinh viên Đại học CMC, kết hợp mạng xã hội, học tập, kho tài liệu, trò chuyện thời gian thực, marketplace và trợ lý AI trong một hệ thống microservice.

Website production: [cmcnetwork.io.vn](https://cmcnetwork.io.vn)

## Tính năng

- **Tài khoản và hồ sơ:** đăng ký, xác minh email/OTP, JWT, Microsoft SSO, hồ sơ học tập và thành tích.
- **Mạng xã hội:** bảng tin, bài viết đa phương tiện, bình luận, cảm xúc, chia sẻ, lưu bài và story.
- **Học tập:** nhóm học, sự kiện, lịch học, điểm, giảng viên và kết nối mentor.
- **Kho tài liệu:** tải lên, xem, tải xuống, đánh giá và bookmark tài liệu.
- **AI cho tài liệu:** đọc nội dung PDF, tạo tóm tắt, flashcard và câu hỏi trắc nghiệm có đáp án, giải thích.
- **Chat thời gian thực:** tin nhắn cá nhân/nhóm, trạng thái hiện diện, cuộc gọi và LiveKit/WebRTC.
- **Marketplace:** đăng và tìm sản phẩm dành cho sinh viên.
- **Quản trị:** dashboard, thống kê, quản lý người dùng và báo cáo.

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Web | Next.js 16, React 19, Tailwind CSS 4, TanStack Query, Zustand |
| Admin | Vite, React |
| Backend | NestJS 11, Socket.IO, BullMQ |
| AI | FastAPI, Python, OpenAI-compatible API |
| Dữ liệu | PostgreSQL 15, Prisma 5, Redis 7 |
| Monorepo | npm workspaces, Turborepo |
| Vận hành | Docker Compose, PM2, Nginx |

## Kiến trúc

```text
Web Client / Admin Dashboard
             │
        API Gateway
             │
 ┌───────────┼───────────┬───────────┐
 │           │           │           │
Auth       User        Social       Chat
Study      Material    Marketplace  AI
 │           │                       │
 └──── PostgreSQL / Redis / Upload Storage
```

| Thành phần | Chức năng | Cổng production |
|---|---|---:|
| `web-client` | Giao diện sinh viên | 3000 |
| `admin-dashboard` | Giao diện quản trị | 25443 |
| `api-gateway` | Cổng API và reverse proxy | 3001 |
| `auth-service` | Xác thực và phiên đăng nhập | 3002 |
| `user-service` | Hồ sơ, học vụ, mentor, thông báo | 3003 |
| `social-service` | Feed, bài viết và tương tác | 3004 |
| `chat-service` | Chat, presence và cuộc gọi | 3005 |
| `study-service` | Nhóm học và sự kiện | 3006 |
| `material-service` | Tài liệu và xử lý PDF | 3007 |
| `marketplace-service` | Sản phẩm marketplace | 3008 |
| `ai-service` | Hỏi đáp và sinh nội dung học tập | 8000 |

> Cổng development được cấu hình trong `.env`; không nên ghi cứng cổng service trong mã nguồn.

## Cấu trúc repository

```text
CMC-Network/
├── apps/
│   ├── web-client/
│   ├── admin-dashboard/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── social-service/
│   ├── chat-service/
│   ├── study-service/
│   ├── material-service/
│   ├── marketplace-service/
│   └── ai-service/
├── packages/
│   ├── database/
│   ├── common/
│   ├── cache/
│   ├── logger/
│   └── ui-kit/
├── infrastructure/
├── scripts/
├── ecosystem.config.js
└── turbo.json
```

## Yêu cầu

- Node.js 20+
- npm 10+
- Python 3.10+
- Docker và Docker Compose
- PM2 nếu triển khai trực tiếp trên máy chủ

## Chạy local

### 1. Cài dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Cập nhật tối thiểu kết nối PostgreSQL, Redis, JWT, email và AI trong `.env`. Không commit `.env`, API key hoặc mật khẩu lên Git.

### 3. Khởi động hạ tầng

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

### 4. Chuẩn bị database

```bash
npx --workspace=@campus-connect/database prisma generate
npx --workspace=@campus-connect/database prisma migrate deploy
npm run build --workspace=packages/database
```

Khi phát triển migration mới, dùng `prisma migrate dev` trong môi trường local. Không dùng `prisma db push` làm quy trình deployment production.

### 5. Khởi động ứng dụng

```bash
npm run dev
```

Có thể chạy từng nhóm:

```bash
npm run dev:frontend
npm run dev:backend
npm run dev:admin
npm run dev:web
```

AI service cần môi trường Python riêng và dependencies trong `apps/ai-service/requirements.txt`.

## Các lệnh chính

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy môi trường development |
| `npm run build` | Build toàn bộ workspace |
| `npm run lint` | Kiểm tra lint |
| `npm test` | Chạy test tự động |
| `npm run deploy:healthcheck` | Kiểm tra health sau deployment |

Ví dụ kiểm thử riêng material service:

```bash
npm test --workspace=apps/material-service
npm run build --workspace=apps/material-service
```

## AI đọc tài liệu

Luồng xử lý PDF:

1. `material-service` lưu file vào upload storage và tạo BullMQ job.
2. Worker trích xuất văn bản từ PDF.
3. `ai-service` tạo JSON có cấu trúc gồm tóm tắt, flashcard và quiz.
4. Kết quả được kiểm tra định dạng rồi lưu vào PostgreSQL.
5. Nếu AI tạm thời không hoạt động, tài liệu vẫn sẵn sàng và giao diện sử dụng nội dung fallback an toàn.

Biến môi trường liên quan:

- `AI_SERVICE_BASE_URL`: địa chỉ nội bộ của AI service.
- `AI_MATERIAL_TIMEOUT_MS`: timeout sinh nội dung tài liệu, mặc định 60 giây.
- `OPENAI_API_KEY` hoặc `AI_API_KEY`: khóa nhà cung cấp AI.
- `OPENAI_BASE_URL` hoặc `AI_API_URL`: OpenAI-compatible endpoint tùy chọn.

## Lưu trữ file

Upload không được lưu trong thư mục source của từng service.

- Local mặc định: `.data/uploads`
- Production khuyến nghị: `/var/lib/campus-connect/uploads`
- Docker Compose sử dụng persistent volume cho upload.

Các thư mục upload, log, cache, build output và `.env` đã được loại khỏi Git. Khi đổi máy chủ phải sao lưu cả PostgreSQL và upload storage.

## Triển khai PM2

```bash
npm ci
npx --workspace=@campus-connect/database prisma generate
npm run build
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
npm run deploy:healthcheck
```

Xem thêm [`DEPLOYMENT_STABILITY_CHECKLIST.md`](DEPLOYMENT_STABILITY_CHECKLIST.md) trước khi triển khai production.

## Tài liệu kỹ thuật

- [`API_DESIGN.md`](API_DESIGN.md): thiết kế API.
- [`ERD.md`](ERD.md): mô hình dữ liệu.
- [`DEPLOYMENT_STABILITY_CHECKLIST.md`](DEPLOYMENT_STABILITY_CHECKLIST.md): checklist deployment.
- [`SECURITY_HARDENING_AUDIT.md`](SECURITY_HARDENING_AUDIT.md): ghi chú hardening và bảo mật.

## Quy tắc repository

- Không commit file upload, log, cache, build output hoặc secret.
- Không thêm script reset mật khẩu/tài khoản có dữ liệu viết cứng.
- Giữ các file `*.spec.ts` và e2e test vì đây là kiểm thử hồi quy của sản phẩm.
- Thay đổi schema phải có Prisma migration.
- Chạy test và build liên quan trước khi tạo commit.

## License

Dự án nội bộ phục vụ hệ sinh thái sinh viên Đại học CMC. Việc sử dụng và phân phối tuân theo chính sách của chủ sở hữu repository.
