# BÁO CÁO CẬP NHẬT GIAO DIỆN KHÔNG CHE GAMEPLAY

**Dự án:** Làng Du Lãm / GGG1g
**Phiên bản:** 1.8.3
**Ngày:** 07/11/2026
**Đầu vào:** GGG1g v1.8.2 (đã sửa 7 lỗi QA)

## Nội dung thay đổi

### Nhiệm vụ 2 — Liệp Ma phá vách nhà

- Bỏ thanh đỏ và con số đếm ngược 10 giây trên màn hình HUD.
- Giữ nguyên thời hạn 10 giây *thực tế* và các nhánh trốn/chết cũ.
- Trong 10 giây, lớp vách nhà tại khu cửa sổ trung tâm xuất hiện các vết nứt tăng dần: vết nứt nhỏ → phân nhánh → mở rộng → ánh đỏ từ khe nứt.
- Thêm bóng Liệp Ma cùng mắt đỏ dần rõ qua cửa sổ, bụi đất rơi và 3 đợt tiếng móng cào/rung khi áp lực tăng.
- Khi hết thời gian chưa ẩn nấp, chuyển sang `attack_timeout` như trước, phá vỡ tường và để Liệp Ma xông vào.
- Các nhãn chữ lớn trên vị trí trốn được thay bằng ba dấu hiệu rất nhẹ không có chữ; logic va chạm và lựa chọn vẫn giữ nguyên.
- Bỏ cả con số chờ 5 giây trên HUD khi đã ẩn an toàn trong chum; chỉ giữ lời dẫn ngắn.

### Nhiệm vụ 1 — Khảo nghiệm linh căn

- Ẩn card `quest-result-card` giữa màn hình tại cả hai lần khảo nghiệm.
- Không xóa thông tin linh căn: JS vẫn cập nhật tên, hệ linh căn, phẩm chất và lưu kết quả. Lục Nham tiếp tục đọc kết quả trong hội thoại.
- Trên màn hình ngang tối đa 960px, thu gọn khung thoại và đưa sang cạnh phải để không che Quan Trắc Thạch tại trung tâm.
- CSS có lớp ẩn bảo hiểm để các lần gọi hiển thị card cũ không thể che viên đá.

## File được sửa

- `public/game/quest2.js`: cảnh vách nứt, bóng Liệp Ma, nhịp âm thanh, loại HUD số.
- `public/game/quest1.js`: ẩn bảng kết quả nhưng giữ dữ liệu/hội thoại.
- `public/game/style.css`: ẩn card linh căn, bố trí khung hội thoại màn ngang.
- `public/game/index.html`: đổi phiên bản query của CSS và hai script để tải lại mã mới trong AI Studio.
- `package.json`: phiên bản 1.8.3; bổ sung kiểm thử hồi quy `immersive-ui.cjs`.
- `tests/immersive-ui.cjs`: kiểm thử hiển thị và chuyển trạng thái.

## Kiểm thử tự động

- `npm test`: toàn bộ bộ test gốc, test sửa lỗi QA và `immersive-ui.cjs` đều đạt.
- Các kiểm thử mới xác nhận vết nứt tăng số đoạn từ 0 lên 22 rồi 48 theo thời gian 0/3/7 giây, và timeout vẫn kích hoạt phá tường.
- Kiểm tra không có chuỗi đếm số còn vẽ trên HUD khi trốn.
- Kiểm tra `save` / `restore` canvas cân bằng, không làm lệch tọa độ về sau.
- Kiểm tra card linh căn luôn ẩn nhưng dữ liệu linh căn vẫn được cập nhật.
- Kiểm tra cú pháp bằng `node --check`.

## Giới hạn kiểm thử

- Môi trường này không có Vite và không chụp được ảnh từ Chromium trực tiếp, nên chưa xác nhận tương tác/hiển thị trên Android thực tế. Không tuyên bố các kiểm thử này thay thế kiểm thử người chơi trên thiết bị.
- Tài nguyên đồ họa gốc và bản đồ không bị thay đổi.
