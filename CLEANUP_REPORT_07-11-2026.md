# Kiểm tra và dọn rác GGG1g — 07/11/2026

## Phạm vi
Bản nguồn gốc: `Lang_Du_Lam_GGG1g_Sua_Loi_Nhiem_Vu.zip` (116 tệp, 9.162.681 byte khi giải nén).

- **Không xóa/đổi tên các file đang được engine game tham chiếu.**
- **Không rút gọn NPC, lời thoại, nhiệm vụ, bản đồ, nhạc hoặc hoạt ảnh gameplay.**
- Các cache/tệp tham khảo loại khỏi bản tối ưu vẫn còn trong ZIP gốc.

## Tệp/tập dữ liệu đã loại khỏi bản tối ưu

| Đường dẫn | Số tệp | Dung lượng không nén | Lý do |
|---|---:|---:|---|
| `.aistudio` | 29 | 1,683,675 byte | Cache biên tập không được runtime đọc |
| `public/assets/aistudio/Screenshot_20261107_104246_d44c7402.jpg` | 1 | 331,568 byte | Trùng với file runtime; hoặc ảnh chụp tham khảo không được runtime gọi |
| `public/01_Lang_Du_Lam_Mot_Ngay_Binh_Yen.mp3` | 1 | 854,352 byte | Trùng với file runtime; hoặc ảnh chụp tham khảo không được runtime gọi |
| `public/01_Lang_Du_Lam_Mot_Ngay_Binh_Yen.ogg` | 1 | 182,283 byte | Trùng với file runtime; hoặc ảnh chụp tham khảo không được runtime gọi |
| `public/Lang_Du_Lam_Man_Hinh_Cho_Khong_Nut(1).webp` | 1 | 455,976 byte | Trùng với file runtime; hoặc ảnh chụp tham khảo không được runtime gọi |
| `public/game/title-screen.webp` | 1 | 455,976 byte | Trùng với file runtime; hoặc ảnh chụp tham khảo không được runtime gọi |

## Mã nguồn thay đổi
- `public/game/music.js`: danh sách nguồn nhạc giữ hai địa chỉ chuẩn tương đối (OGG/MP3 trong `public/game`) thay vì thử các bản sao ở `/` và `../`.
- `README.md`: sửa hướng dẫn lưu tiến trình đã lỗi thời và bổ sung ghi chú dọn rác.
- `.gitignore`: tránh commit tệp phụ thuộc/build/cache.
- `public/game/index.html` và 22 tệp JavaScript gameplay còn lại giữ nguyên byte.

## Không coi là rác
- `public/game/liep-ma/preview.html`, `liep-ma-preview.gif`, `monster.json`, `animations.json`: bộ preview/phát triển Liệp Ma, được giữ.
- `tests/`: bộ kiểm thử hồi quy, được giữ để tránh tái xuất hiện lỗi.
- `public/assets/aistudio/*.txt`: tài liệu cốt truyện nhiệm vụ 2, được giữ.
- CSS nhiều selector: có ghi đè phục vụ responsive, không tự ý gộp.

## Giới hạn
- `npm test` xác nhận logic script; không thay thế kiểm thử trình duyệt Android.
- Không chạy production build nếu không có node_modules/Vite trong môi trường.
