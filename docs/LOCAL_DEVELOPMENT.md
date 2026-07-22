# Local development baseline

Tài liệu này là nguồn hướng dẫn chính để chạy CampusConnect ở local. Các lệnh
root tự nạp file `.env`; không cần tạo một bản `.env` trong từng service.

## Yêu cầu

- Node.js 20.9 trở lên
- npm 10 trở lên
- Docker Desktop hoặc Docker Engine có Compose v2

## Khởi tạo lần đầu

```powershell
Copy-Item .env.example .env
npm ci
docker compose -f infrastructure/docker-compose.yml --env-file .env up -d
npm run db:push
```

`npm ci` tự chạy `prisma generate`. `db:push` chỉ dành cho local trong khi repo
chưa có lịch sử Prisma migrations; không dùng lệnh này như chiến lược migrate
production.

## Chạy ứng dụng

```powershell
npm run dev
```

| Thành phần | Địa chỉ local |
|---|---|
| Web | `http://localhost:25080` |
| Admin dashboard | `http://localhost:25443` |
| API gateway | `http://localhost:25021` |
| Auth service | `http://localhost:22022` |
| User service | `http://localhost:23306` |
| Social service | `http://localhost:38888` |
| Chat service | `http://localhost:38080` |
| Study service | `http://localhost:38081` |
| Material service | `http://localhost:38082` |
| Marketplace service | `http://localhost:38083` |
| PostgreSQL host port | `25432` |
| Redis host port | `26379` |

Compose dùng project name `cmc-network-dev` cùng container name riêng. Không
đổi database/Redis về `5432`/`6379` nếu máy đang chạy project khác.

## Xử lý xung đột port

`npm run dev` chỉ kiểm tra port. Nó không tự dừng bất kỳ process nào.

- Nếu listener thuộc chính workspace này, chạy `npm run dev:cleanup`, rồi chạy
  lại `npm run dev`.
- Nếu listener thuộc project khác, script sẽ để nguyên. Dừng project đó hoặc đổi
  cấu hình port một cách chủ động.
- Việc nhận diện ownership dựa trên command line có chứa đúng đường dẫn tuyệt
  đối của workspace, bao gồm kiểm tra ranh giới để tránh nhầm thư mục cùng tiền
  tố tên.

## Các lệnh baseline

```powershell
npm run prisma:generate
npm run build
npm run lint
npm test
```

`npm run build` generate Prisma trước khi Turbo build để declaration của
`@campus-connect/database` không bị cache thành `any`.

## Chạy riêng một phần

```powershell
npm run dev:frontend
npm run dev:backend
npm run dev:admin
```

`dev:admin` chạy dashboard Vite tại port `25443`. `npm run dev:web` chạy đồng
thời web client và dashboard. Ownership được ghi tại
[`ADR-001-CANONICAL-ADMIN.md`](./ADR-001-CANONICAL-ADMIN.md).

## Dữ liệu test và upload

Unit test phải mock storage provider, không ghi file vào `apps/*/uploads`.
Runtime upload local là dữ liệu tạm và không được xem như seed/migration data.
