# Kết quả kiểm thử – Nâng body chung v1.8.6

- Đã chạy `npm test`: toàn bộ test gốc và test mới `body-shared.cjs` đạt.
- Đã chạy `npm run lint`: các bài kiểm thử cấu hình lint đều đạt.
- Body dùng renderer Canvas 96×112 của Tiểu Phàm; 5 preset (Tiểu Phàm, Trưởng làng, A Huy, A Nguyệt, Lục Nham).
- Không đổi hitbox hoặc vị trí đứng của NPC cũ.
- Kiểm tra vẽ 4 hướng, trạng thái Canvas save/restore cân bằng, chuyển màu NPC không làm mất màu áo người chơi, A Nguyệt có thoại và ẩn khi làng đổ nát.
- Đã kiểm tra vị trí A Nguyệt (872,700) hợp lệ với Collision.canWalk trong thế giới đã khởi tạo.
- Cần kiểm thử trực quan trong trình duyệt thực tế vì chưa thể chạy kiểm thử ảnh chụp tự động ở môi trường này.
- Chưa chạy `vite build` vì không có dependency Vite được cài trong môi trường kiểm thử; tệp ZIP là mã nguồn để AI Studio cài dependency và build.
