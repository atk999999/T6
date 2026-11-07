# GGG1g – Bản sửa nhiệm vụ 1 và 2 (07/11/2026)

## Phạm vi
Bản nguồn cho React/Vite Google AI Studio, giữ nguyên các sprite/âm thanh và nội dung game; bổ sung đúng 1 file đồ họa lập trình (`public/game/ruins-extension.js`) và 1 bộ kiểm thử hồi quy (`tests/quest-fixes.cjs`).

## Các lỗi đã sửa

| Lỗi | Sửa đổi | Kiểm chứng |
|---|---|---|
| Q2-01: Sai vị trí khi ở trong nhà | `game.js` truyền player thật vào `Quest2.update`, các hệ thống NPC ngoài làng vẫn nhận bản sao worldP | Unit/integration wiring + mô phỏng người chơi sát chum |
| Q2-02: TypeError `pose` chỉ đọc | `TieuPhamHome.wakeForQuest` đặt lại tư thế an toàn, không gán vào getter | VM với TieuPhamHome thật, không lỗi |
| Q2-03: Ngủ nhiệm vụ tự tăng ngày | Bỏ tiến trình ngủ thường trong trạng thái `sleeping_start`, khóa đồng hồ trong cảnh sinh tồn | Trạng thái 00:00, không tăng ngày ngoài ý muốn |
| Q2-04: Save nhiệm vụ thiếu chuyển trạng thái | `transitionTo` lưu ngay các state; xuất `Quest2.saveState` để GameSave dùng | Kiểm tra localStorage khi chọn chum/chạy trốn |
| Q2-05: Kẹt chum | Tách ý định điều khiển khỏi va chạm bằng `handleMovementIntent` | Giả lập bấm di chuyển khi đang ở trong vật cản |
| Q2-06: Tải lại mất nút hoàn thành | `restoreAfterLoad` mở lại victory modal khi trong `ruins_explore`; cảnh bị ngắt quay về checkpoint 00:00 | Tải lại trạng thái thắng / truy đuổi |
| Q1-01: Từ chối vẫn bị tự chuyển tuyển chọn | Chỉ chọn ngày khảo hạch cho người đã đăng ký, theo `registeredDay`; sửa luôn hàm ngủ `Villagers.sleepToNextDay` | Đã từ chối/do dự giữ nguyên; đăng ký hợp lệ đi tiếp |
| Q2-07: Di chuyển nhanh phá hoạt cảnh | Khóa Xóm đông, Bản đồ, Về nhà, +2 giờ, +1 ngày khi nhiệm vụ đang chạy | Đối chiếu source và kiểm tra trong Chromium |
| Q2-08: Ngoài vùng ảnh phế tích không có bản đồ | Giữ ảnh phế tích chính 1536×1024 tại đúng tọa độ, render các lớp bản đồ xóm đông + nam theo tông xám cháy, overlay vật thể đổ nát lên phần mở rộng | Xác nhận đường render và dữ liệu overlay; cần QA thị giác trên thiết bị thật |

**Lưu/tải giữa hoạt cảnh:** chính sách hồi phục là chạy lại cảnh từ 00:00 để tránh mất đồng hồ đếm ngược, hỏng vị trí hoặc trạng thái AI Liệp Ma. Khi đã đến bảng chiến thắng, tải lại sẽ mở lại bảng chiến thắng. Khi đã hoàn thành, tải lại sẽ trở lại bản đồ phế tích.

## Kiểm thử
- `npm test` gồm 11 bộ gốc và bộ hồi quy mới: đạt.
- `npm run lint`: đạt (script chạy kiểm thử Node, không phải ESLint).
- `node --check` cho toàn bộ JavaScript game: đạt.
- Smoke Chromium: khởi động và 00:00, trạng thái khóa điều hướng, khôi phục modal; trong lần chạy kiểm thử thành công không có lỗi `pageerror`. Một lượt thử sau không hoàn thành do giới hạn thời gian môi trường Chromium, chưa xác nhận giao diện phế tích mở rộng trực quan trên Android.
- `npm run build`: chưa thực thi được vì môi trường này không cài Vite/React; nguồn giữ cấu trúc Vite tiêu chuẩn và có thể được Google AI Studio cài dependencies.

## Những gì giữ nguyên
- Không xóa sprite Liệp Ma, nhân vật, quan trắc thạch, nhạc nền, kịch bản nhiệm vụ hay dữ liệu bản đồ gốc.
- Không sửa luồng hội thoại NPC hoặc độ khó/sát thương của Liệp Ma.
