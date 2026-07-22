# ADR-001: Dashboard Vite là admin runtime chính

- Trạng thái: Accepted
- Phạm vi: baseline Giai đoạn 0
- Cập nhật khi đồng bộ remote: 2026-07-22

## Bối cảnh

Repository có cả route `/admin/*` trong `apps/web-client` và ứng dụng Vite độc
lập tại `apps/admin-dashboard`. Hai bề mặt quản trị cùng tồn tại tạo nguy cơ lệch
auth, routing và quy trình deploy.

Trong lúc tích hợp Giai đoạn 0, nhánh remote mới nhất đã nâng cấp trực tiếp
`apps/admin-dashboard`, giữ script `dev:admin` và tiếp tục chạy ứng dụng này bằng
PM2 trên port `25443`. Đây là bằng chứng runtime mới hơn quyết định ban đầu dựa
trên snapshot cũ.

## Quyết định

`apps/admin-dashboard` là dashboard quản trị runtime chính ở thời điểm hiện tại.
Các route `/admin/*` trong Next.js được xem là bề mặt legacy/đang chuyển tiếp và
không được mở rộng song song nếu chưa có quyết định migration riêng.

## Hệ quả

- `npm run dev:admin` chạy `apps/admin-dashboard`.
- `npm run dev:web` chạy cả web client và dashboard quản trị.
- PM2 tiếp tục deploy dashboard trên port `25443`.
- Kiểm tra xung đột port local bao gồm `25443`.
- Giai đoạn 1 phải xác nhận role guard ở cả dashboard và admin API trước khi coi
  luồng quản trị là production-ready.
- Không xóa route admin trong Next.js hoặc dashboard Vite trong thay đổi này;
  việc hợp nhất phải được thực hiện bằng một task migration độc lập.
