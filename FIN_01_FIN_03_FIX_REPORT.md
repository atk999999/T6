# Báo cáo sửa FIN-01 và FIN-03 — GGG1g v1.8.5

**Nguồn:** GGG1g v1.8.4 sửa âm thanh, ngày 07/11/2026.

## FIN-01 — Tải lại đang nằm / ngồi bị kẹt nội thất
- `public/game/game-save.js`: lưu thêm `homePose` khi trong nhà; `GameSave.load()` gọi `TieuPhamHome.restoreAfterLoad()`.
- `public/game/tieu-pham.js`: thêm `restoreAfterLoad` đưa người chơi về vị trí đứng bên cạnh giường `(532,232)` hoặc bàn `(341,342)`, hoặc tìm điểm gần nhất có thể đi khi gặp dữ liệu lưu cũ / tọa độ lỗi.
- Không khôi phục trạng thái ngủ để tránh chạy lại cơ chế tua ngày. Kịch bản bị ngắt của nhiệm vụ 2 vẫn được `Quest2.restoreAfterLoad()` xử lý riêng.
- Tương thích bản lưu cũ không có `homePose`.

## FIN-03 — Va chạm làng hoang tàn
- `public/game/collision.js`: `canWalk`/`pointBlocked` tự lấy pha phế tích từ `Quest2.isVillageRuined()`; vẫn hỗ trợ tham số boolean để kiểm thử.
- Pha bình thường giữ nguyên mọi va chạm (so sánh **28.050 điểm**, kết quả **0 điểm thay đổi** so với bản v1.8.4).
- Pha phế tích bỏ vật cản từ vườn/rào, tán cây, công trình sinh hoạt và đồ dùng không còn được vẽ; giữ va chạm cấu trúc nhà còn tồn tại và vùng suối. Có thêm va chạm giếng đá và thân cây lớn đổ phù hợp ảnh `Lang_Du_Lam_Hoang_Tan.webp`.
- Trên lưới 12px có 1.631 vị trí trở nên đi được và 89 vị trí được chặn thêm do vật cản mới (so với map trước phá hủy).
- Kiểm tra thông đường tại các tuyến: nhà ban đầu → quảng trường → cầu → xóm đông, và tuyến xuống làng phía nam.
- **Giới hạn:** xóm đông/phía nam dùng lớp hoang tàn phủ đồ họa lên bản đồ mở rộng; cần thử trực quan trên Android để xác nhận mọi rìa va chạm khớp hoàn toàn.

## Kiểm thử
- `npm test`: các bộ kiểm thử gốc + bộ kiểm thử mới.
- Bộ mới: nằm/ngồi sau tải lại với dữ liệu mới và cũ, đồ đạc khác, đổi pha bản đồ, nhà còn đứng, sông/cầu, giếng, thân cây, vật cản bổ sung sau init, đường nối liên khu.
- ZIP kiểm tra CRC sau đóng gói.

**Không chỉnh FIN-02**, UI nhiệm vụ 1 giữ nguyên theo yêu cầu.
