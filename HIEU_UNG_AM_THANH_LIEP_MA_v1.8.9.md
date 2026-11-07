# Làng Du Lãm – v1.8.9 | Liệp Ma: hoạt ảnh, bóng đổ và tiếng GRR

Nguồn cập nhật: v1.8.8 `Lang_Du_Lam_GGG1g_v1.8.8_Hieu_Ung_Chay_Khoi_MapGoc_AIStudio.zip`.

## Thay đổi

- `public/game/liep-ma-sfx.js`: phát file SFX offline, gắn với nút BẮT ĐẦU, tôn trọng trạng thái tắt âm thanh; giới hạn phát lặp; codec Ogg/Opus và MP3 dự phòng.
- `public/game/liep-ma/sfx/grr-distant.*`: tiếng gầm xa khi thức dậy và thấy bóng Liệp Ma ngoài cửa sổ.
- `public/game/liep-ma/sfx/grr-near.*`: tiếng gầm sát người khi quái áp sát chum, tấn công và truy đuổi.
- `public/game/liep-ma/sfx/sniff.*`: tiếng hít hà lúc đánh hơi trong nhà.
- `public/game/liep-ma/sfx/ominous-rumble.*`: âm trầm dự trữ cho hoạt cảnh sau (không tự phát trong gameplay hiện tại).
- `public/game/village-raid-fx.js`: bóng đổ mái nhà theo lửa chập chờn, khói cuộn trôi, tàn lửa, ánh sáng hắt vào nhà. Giữ nguyên các vệt máu nhỏ.
- `public/game/quest2.js`: bóng tiếp đất của Liệp Ma (đứng, đi, chạy, đánh hơi), các vị trí trigger SFX; tắt âm thanh khi sáng hoặc chơi lại.
- `public/game/game.js`: khởi động audio trong tương tác nút BẮT ĐẦU; tách trạng thái map huyết dạ và trạng thái cháy thực sự để chuyển sang 06:00 không lóe map nguyên vẹn.

## Quy tắc cảnh

- **00:00–trước 06:00:** dùng nguyên map hoang tàn gốc với lớp phủ đêm và lửa/khói/tàn lửa/bóng đổ động; Liệp Ma phát âm theo từng phân cảnh.
- **06:00 trở đi:** không vẽ lửa, khói động hoặc bóng lửa; ngừng SFX; giữ map hoang tàn gốc.
- **Ảnh gốc:** `map.webp` và `Lang_Du_Lam_Hoang_Tan.webp` *không hề thay đổi byte* (SHA-256 đối chiếu bản v1.8.8).
- **Cốt truyện:** giữ nguyên Nhiệm vụ 1/2, A Nguyệt và cơ chế save/di chuyển/va chạm.

## Kiểm thử

- `npm test`: chạy bộ kiểm thử logic, âm thanh, hiệu ứng raid, body NPC, cốt truyện và lưu game.
- Tệp `.ogg`/`.mp3`: phát trực tiếp từ máy chủ tĩnh (HTTP 200), có cả hai bản mã hóa tương thích.
- Chưa xác nhận được chất lượng hình ảnh/chất lượng phát âm thanh trên thiết bị Android thực tế; cần chạy thực nghiệm trên AI Studio hoặc điện thoại.

## Ghi chú

Tiếng GRR là **hiệu ứng âm thanh tổng hợp riêng** (từ nhiễu, dao động tần thấp và xử lý âm sắc), không phải bản thu tiếng thú thật. Kích thước tài nguyên nhỏ để giữ tổng ZIP gần bản gốc.
