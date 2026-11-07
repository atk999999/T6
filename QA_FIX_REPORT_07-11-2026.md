# Báo cáo sửa lỗi và kiểm thử hồi quy — Làng Du Lãm GGG1g v1.8.2

**Ngày:** 07/11/2026  
**Đầu vào:** `Lang_Du_Lam_GGG1g_AIstudio_Don_Rac.zip`  
**Đầu ra:** `Lang_Du_Lam_GGG1g_v1.8.2_Fix_7_Loi_AIStudio.zip`  
**Phạm vi:** Sửa đủ 7 vấn đề QA-01 đến QA-07 của báo cáo kiểm thử mới nhất; không bỏ nội dung gameplay, nhiệm vụ, ảnh, âm nhạc hoặc NPC dữ liệu.

## Lỗi đã sửa

| ID | Mức độ | Vị trí | Biện pháp khắc phục | Kiểm thử |
|---|---|---|---|---|
| QA-01 | Cao | `public/game/quest2.js` | Cặp `ctx.save()/ctx.restore()` bao bọc hiệu ứng rung HUD, không làm rò phép tịnh tiến sang khung kế tiếp. | Ma trận transform và stack canvas được trả về trạng thái cũ sau 3 lượt vẽ liên tiếp. |
| QA-02 | Nghiêm trọng | `public/game/tieu-pham.js` | Trong `countdown_hide`, bước qua cửa chuyển sang `attack_door_early` trước thao tác `exit`; các hoạt cảnh sinh tồn khác không cho thoát qua cửa bằng va chạm. | Khi di chuyển xuống cửa, trạng thái đổi đúng, nhân vật không teleport ra làng. |
| QA-03 | Trung bình | `public/game/tieu-pham.js` | Thay `p.hp || 100` bằng `p.hp ?? 100` để giá trị 0 được giữ. | HUD hiển thị `Khí Huyết: 0/100 HP`. |
| QA-04 | Thấp | `public/game/game-save.js` | So sánh snapshot không có `savedAt`; giữ thời điểm lưu trong dữ liệu trên đĩa; lưu cưỡng bức vẫn hoạt động. Cache kiểm tra quyền localStorage để tránh ghi thử liên tục. | 2 lần autosave không đổi không ghi thêm `SAVE_KEY`; dữ liệu thay đổi/force save ghi được; sau load không ghi trùng. |
| QA-05 | Cao | `public/game/tieu-pham.js`, `public/game/quest2.js` | Chặn vào nhà nguyên vẹn sau khi làng thành phế tích; tự đưa người chơi ra ngoài khi thành công hoặc tải lại ở tổng kết/đã hoàn thành. | Không vào được cửa cũ; load `completed` và `ruins_explore` đều ở ngoài nhà. |
| QA-06 | Cao khi FPS thấp | `public/game/game.js`, `public/game/quest2.js` | Giữ `dt` giới hạn cho vật lý, truyền thêm `dtReal` tính theo requestAnimationFrame cho đồng hồ 10 giây sinh tồn. | Đếm ngược được kiểm thử ở 15, 20, 30 và 60 FPS. |
| QA-07 | Trung bình | `public/game/npcs.js`, `public/game/game.js` | Sau khi làng bị phá hủy, dừng di chuyển/giao tiếp NPC nhưng tiếp tục cập nhật đồng hồ game; nút “Dân làng” thành “Người xưa”, hiển thị hồi ức; chặn tương tác với NPC đã không còn xuất hiện. | NPC không di chuyển, `talk()` trả false, bảng tưởng niệm và đồng hồ hoạt động. |

## Kết quả xác minh

- `npm test`: **đạt**. Bao gồm 12 bộ test trước đó và tệp hồi quy mới `tests/qa-fixed.cjs`.
- `node tests/qa-fixed.cjs`: **7/7 nhóm lỗi đạt**, với 4 mức FPS cho QA-06.
- `node --check` trên 23 tệp `public/game/*.js` và `vite.config.js`: **đạt**.
- 32 liên kết tài nguyên nội bộ trực tiếp từ `public/game/index.html`: **32/32 tồn tại**; xác nhận bản đồ, ảnh Liệp Ma và âm thanh nền vẫn có mặt.
- Kiểm tra ZIP: thử CRC và đường dẫn trước khi bàn giao.

## Giới hạn kiểm thử

- **Chưa xác nhận thao tác thực tế trên điện thoại Android**. Chromium headless trong môi trường này không chạy được bài test giao diện đầy đủ.
- `npm run build` chưa thực thi thành công do môi trường không cài gói Vite (`vite: not found`). Đây **không phải** lỗi build đã xác định của mã nguồn; hãy cài dependencies và chạy build trong AI Studio hoặc môi trường Node.js đầy đủ.
- Đồng hồ 10 giây theo thời gian thực: nếu ứng dụng bị đưa vào nền hoặc đóng băng trình duyệt, khi chạy trở lại đồng hồ sẽ tính cả khoảng thời gian đã trôi qua; đây là lựa chọn hiện tại của cơ chế deadline sinh tồn.

**Dữ liệu gốc:** Bản ZIP trước sửa không bị ghi đè.
