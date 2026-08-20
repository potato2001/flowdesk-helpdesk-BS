# Flowdesk Helpdesk

Hệ thống Helpdesk nội bộ chạy hoàn toàn local với Next.js, PostgreSQL và Prisma.

## Chạy toàn bộ bằng Docker

Yêu cầu Docker Desktop. Từ thư mục project:

```bash
docker compose up -d --build
```

Sau khi các container sẵn sàng:

- Flowdesk: http://localhost:3000
- Mailpit: http://localhost:8025
- PostgreSQL: localhost:5432

Container ứng dụng tự áp migration và seed dữ liệu khi khởi động.

## Tài khoản local mặc định

Mật khẩu chung trong môi trường phát triển: `Flowdesk@123`.

| Vai trò | Email |
| --- | --- |
| Admin | admin@flowdesk.local |
| Manager | manager@flowdesk.local |
| Agent | agent@flowdesk.local |
| Requester | requester@flowdesk.local |

Hãy đổi `SEED_ADMIN_PASSWORD` và `SESSION_SECRET` trước khi dùng trên mạng nội bộ.

## Chạy ứng dụng trên máy, chỉ chạy dịch vụ bằng Docker

```bash
docker compose up -d postgres mailpit
npm install
npm run db:setup
npm run dev
```

Biến môi trường mẫu nằm trong `.env.example`; `.env` local đã được loại khỏi Git.
File đính kèm được lưu tại `UPLOAD_DIR`, còn metadata và quyền truy cập nằm trong PostgreSQL.

## Khả năng hiện có

- Đăng nhập bằng session local, mật khẩu hash bcrypt.
- Phân quyền Requester, Agent, Manager và Admin ở API.
- Ticket, bình luận, ghi chú nội bộ và lịch sử hoạt động lưu PostgreSQL.
- File đính kèm tối đa 10 MB lưu trên volume local và tải xuống có kiểm tra quyền.
- SLA phản hồi và SLA giải quyết theo mức ưu tiên.
- Dashboard, Kanban, danh sách, chi tiết ticket và cổng Requester responsive.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Kiểm tra trạng thái runtime:

```bash
curl http://localhost:3000/api/health
docker compose ps
```
