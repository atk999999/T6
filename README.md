# Làng Du Lãm v1.8.5 — Sửa FIN-01 và FIN-03

- **FIN-01:** Khôi phục vị trí an toàn khi tải lại lúc Tiểu Phàm đang nằm/ngồi; tương thích dữ liệu lưu cũ; không tự nhảy ngày.
- **FIN-03:** Va chạm tách theo giai đoạn làng nguyên vẹn / hoang tàn. Bỏ vật cản của đồ vật, hàng rào và tán cây đã biến mất; giữ nhà còn đứng, suối, giếng và cây đổ.
- **FIN-02:** Chưa sửa, đúng phạm vi yêu cầu.
- Kiểm thử mới: `npm test`, bộ `tests/final-fin01-fin03.cjs`.

# Làng Du Lãm — GGG1g v1.8.3

**Bản giao diện điện ảnh, không che gameplay.** Nhiệm vụ 2 dùng vết nứt trên vách để báo hiệu 10 giây sinh tử; nhiệm vụ 1 ẩn bảng kết quả linh căn che Quan Trắc Thạch. Toàn bộ cơ chế nhiệm vụ và dữ liệu đã giữ nguyên. Chi tiết xem `UI_IMMERSIVE_CHANGELOG_07-11-2026.md`.

# Làng Du Lãm — AI Studio

Bản web phiên bản 18, commit 9d4c6cd8a72b8fc62ddc5fdfa7d16bca4d0ec76f.

## Chạy
Node.js 20.19+ hoặc 22.12+.
```sh
npm install
npm run dev
```
`npm run build` tạo bản web; `npm test` kiểm tra gameplay.

## Nhập AI Studio
Giải nén, đưa toàn bộ nội dung vào dự án. package.json nằm ngay thư mục gốc. Không đưa riêng tệp ZIP vào thư mục mã nguồn. Không cần API key.

React làm vỏ ứng dụng, iframe cùng nguồn chạy engine Canvas trong public/game. Toàn bộ gameplay và ảnh nằm tại đây, không nhúng website bên ngoài.

## Đã bao gồm
Tiểu Phàm 14 tuổi; 24 NPC; ruộng mùa vụ 7 ngày; hai con trâu; trẻ chơi; vườn hoa và kiến trúc; ánh sáng/ngày đêm; mưa/bão/tuyết; giếng mới và đình; NPC chạy trú mưa, nông dân mặc áo tơi; sửa nền cỏ lặp và đường nối map.

WASD/phím mũi tên hoặc joystick cảm ứng; Shift/nút Chạy. Giao diện tối giản giữ như bản web. Nút thời tiết/thời gian đang ẩn trong style.css. Đã có lưu và khôi phục tiến trình; hoạt cảnh Nhiệm vụ 2 khôi phục tại checkpoint an toàn nếu tải lại. Lữ khách chưa mở khóa.

## Dọn rác an toàn 07/11/2026
- Loại các bản sao âm thanh và màn hình chờ ở `public/`; game vẫn dùng bản gốc trong `public/game/`.
- Loại `public/game/title-screen.webp` vì không có đường dẫn nào tham chiếu và trùng nội dung với ảnh màn hình chờ đang dùng.
- Loại cache ảnh trung gian `.aistudio/artifacts/` và một ảnh chụp màn hình lưu để tham khảo; không ảnh hưởng nội dung runtime. Các tệp đó vẫn có trong bản ZIP gốc.
- Giữ nguyên `liep-ma-sprites.webp`, `liep-ma-preview.gif`, mọi ảnh Quan Trắc Thạch, bản đồ, tài liệu cốt truyện và tests.
- ZIP được đóng ở gốc dự án: mở là thấy `package.json`, không thêm một tầng thư mục.

## Sửa lỗi sinh tồn — v1.8.2 (07/11/2026)
- Sửa 7 lỗi kiểm thử QA-01 đến QA-07 (cửa nhà trong nhiệm vụ 2, rung canvas, HP, autosave, nhà sau phế tích, đồng hồ 10 giây và hành vi dân làng).
- Bộ kiểm thử mới `tests/qa-fixed.cjs` đã được thêm vào `npm test`.
- Xem `QA_FIX_REPORT_07-11-2026.md` để biết chi tiết và các giới hạn kiểm thử.


### 1.8.4 — Khắc phục âm thanh di động
- Không chờ `AudioContext.resume()` trước khi gọi `audio.play()`; khởi phát đồng bộ theo thao tác chạm để tránh trình duyệt chặn.
- Dự phòng OGG → MP3 khi lỗi giải mã hoặc định dạng. Nghe `canplay` thay vì chỉ `canplaythrough` một lần.
- Ghi đúng lựa chọn bật/tắt nhạc, hiển thị trạng thái chờ kích hoạt khi chưa phát.
- Bộ kiểm thử âm thanh chuyên biệt: `node tests/audio-regressions.cjs`.
- Hai bản nhạc nền gốc được giữ nguyên; không phát sinh tệp âm thanh mới.


### v1.8.9 – Hiệu ứng Liệp Ma
Đã thêm tiếng gầm GRR Ogg/MP3, tiếng đánh hơi, bóng đổ theo lửa và bóng Liệp Ma; chuyển cảnh 06:00 không lóe map cũ. Chi tiết: `HIEU_UNG_AM_THANH_LIEP_MA_v1.8.9.md`.
