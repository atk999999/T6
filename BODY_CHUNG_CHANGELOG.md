# Làng Du Lãm v1.8.6 – Nâng cấp body chung

## Triển khai
- Body Tiểu Phàm là chuẩn về hình học, điểm chân, khung Canvas 96×112 và 4 hướng.
- `public/game/body-shared.js` định nghĩa 5 preset: Tiểu Phàm, Trưởng làng, A Huy, A Nguyệt, Lục Nham.
- Tái dùng trực tiếp renderer của Tiểu Phàm, không tải thêm sprite sheet 475 KB. Thay màu, độ rộng/cao hình vẽ, râu, tóc, bụng và vạt áo.
- Trưởng làng được vẽ bằng body chung, giữ thoại và hoạt động của nhiệm vụ khảo nghiệm.
- A Huy chuyển sang body chung dạng mập, giữ trạng thái trúng đòn, thanh HP, lời chế nhạo và khả năng chạm Quan Trắc Thạch.
- Lục Nham chuyển sang body chung, giữ kiếm bay, linh khí và vị trí hoạt ảnh của Quest1.
- Thêm NPC A Nguyệt đứng gần quảng trường, có body nữ và hội thoại đơn giản; ẩn khi đêm tối, trong lễ khảo nghiệm và khi làng hoang tàn. Chưa tích hợp tuyến tình cảm riêng.

## Giữ nguyên
- Giữ nguyên map, tọa độ NPC cũ, va chạm, quy trình nhiệm vụ 1/2 và cấu trúc lưu game.
- Body người chơi không thay đổi về hành vi; các tư thế đấm, ngủ và ngồi dùng renderer cũ đã được kiểm thử.
- Không thêm NPC mới vào `Villagers.list` để tránh đổi quân số/lịch trình 24 NPC hiện có.

## Hạn chế
- Đây là body dùng chung **bằng Canvas**, chưa phải hệ thay đồ/layer WebP độc lập.
- Chưa có hoạt ảnh ngủ/đứng/ngồi riêng cho từng NPC; NPC dùng chung tư thế đứng và đi.
- Mới bổ sung ngoại hình A Nguyệt, chưa có phân cảnh tình cảm sau buổi tuyển chọn.
- Nên kiểm thử trực quan với trình duyệt ở nhiều độ phóng map để cân chỉnh tỉ lệ, che khuất và màu sắc.
