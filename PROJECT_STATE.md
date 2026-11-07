## Cập nhật GGG1g v1.8.5 (07/11/2026)
- FIN-01: Lưu tư thế, khôi phục vị trí đứng hợp lệ khi tải lại ở giường/bàn (cả bản lưu cũ).
- FIN-03: Va chạm theo trạng thái làng nguyên vẹn/phế tích; loại bỏ tường vô hình do props không còn hiển thị, giữ vật cản có thật.
- FIN-02: Không thay đổi.
- Chi tiết: `FIN_01_FIN_03_FIX_REPORT.md`; kiểm thử: `tests/final-fin01-fin03.cjs`.

## Cập nhật GGG1g v1.8.3 (07/11/2026)
- Không còn thanh số đếm 10 giây nhiệm vụ Liệp Ma; thay bằng vết nứt, bóng đen và bụi đất trên vách nhà tăng dần theo thời gian thực.
- Bảng linh căn giữa màn hình được ẩn, giữ nguyên dữ liệu và hội thoại.
- Hội thoại thu nhỏ và chuyển sang phải trên màn hình ngang nhỏ, giảm che Quan Trắc Thạch.
- Có thêm `tests/immersive-ui.cjs`.

## Đã triển khai trong lần cập nhật này

1. **Khắc phục triệt để lỗi màn hình & Tối ưu bố cục Mobile**:
   - **Gỡ bỏ hoàn toàn 4 nút bấm đè lên màn hình**: Đã loại bỏ các nút bấm ảo kích thước lớn từng che lấp cần điều khiển ảo (`#stick`) và nút hành động (`#punch`, `#run`) ở góc dưới màn hình.
   - **Tối ưu vị trí thanh đếm ngược 10 giây sinh tử**: Đưa thanh đếm ngược xuống vị trí `by = Math.max(94, Math.min(125, screenH * 0.15))`, hoàn toàn không che lấp bảng thông số Tiểu Phàm (HP/MP) ở góc trên màn hình.
   - **Bảng chỉ dẫn tương tác nội thất phòng (`In-Room Markers`)**: Chuyển các thẻ định vị (`🏺 Chum Nước`, `🛏️ Gầm Giường`, `🚪 Tủ Quần Áo`, `🏃 Chạy Ra Cửa`) vào trực tiếp không gian tọa độ 2D của căn nhà, gắn trên từng vật thể vật lý, di chuyển và phóng to/thu nhỏ đồng bộ theo góc nhìn người chơi.

2. **Cơ chế Tự Tương Tác Môi Trường (Không dùng bảng chọn tình huống)**:
   - **Tự do điều khiển di chuyển**: Người chơi tự do sử dụng cần gạt joystick / phím điều hướng để di chuyển Tiểu Phàm trong căn phòng.
   - **Nút hành động thông minh (`#punch-label` & `#talk`)**: Tự động chuyển đổi nhãn chức năng theo vị trí đứng của Tiểu Phàm:
     + Gần chum nước: Hiện `NẤP CHUM` (hoặc `🏺 Nấp vào Chum Nước`).
     + Gần gầm giường: Hiện `CHUI GẦM` (hoặc `🛏️ Chui xuống Gầm Giường`).
     + Gần tủ gỗ: Hiện `TRỐN TỦ` (hoặc `🚪 Trốn vào Tủ Quần Áo`).
     + Gần cửa chính: Hiện `RA CỬA` (hoặc `🏃 Chạy vội ra Cửa Chính`).
   - **Ba phương thức tương tác linh hoạt**: Người chơi có thể (1) đi thẳng vào vị trí vật thể, (2) nhấn nút hành động khi đến gần, hoặc (3) chạm trực tiếp vào vật thể trên sàn nhà.
   - **Tương tác tự nhiên sau khi Liệp Ma rời đi (`AFTER_LEAVING_DECISION`)**:
     + Nhìn qua khe nắp chum mờ tối với không khí nghẹt thở.
     + Nếu người chơi di chuyển (hoặc bấm nút `TRÈO RA` / chạm màn hình): Tiểu Phàm lập tức đẩy nắp chum trèo ra sân chạy trốn (kích hoạt Nhánh A rượt đuổi ngoài làng).
     + Nếu người chơi kiên nhẫn ẩn mình 5 giây trong chum: Màn đêm dần chuyển sang bình minh 06:00 sáng an toàn (kích hoạt Nhánh B sinh tồn hoàn thành nhiệm vụ).

3. **Cơ chế Chết Là Chơi Lại Từ Đầu (Permadeath 00:00 Nửa Đêm)**:
   - Khi HP tụt về 0 trong bất kỳ tình huống nào (gầm giường, trong tủ, ra cửa sớm, hết 10 giây chưa trốn, hoặc bị đuổi bắt ngoài làng), nút Game Over hiển thị: `↺ Chơi Lại Từ Đầu (00:00 Nửa Đêm)`.
   - Nhấn chơi lại sẽ khôi phục toàn diện:
     + Đưa mốc thời gian trở về đúng 00:00 lúc tiếng thét xé toạc màn đêm vang lên.
     + Hồi phục toàn bộ 100/100 HP cho Tiểu Phàm (`p.knockedDown = false`).
     + Khôi phục nguyên vẹn giường ngủ và tủ quần áo chưa bị phá vỡ.
     + Không sử dụng checkpoint trung gian, đảm bảo tính căng thẳng và chân thực của thể loại sinh tồn kinh dị.

4. **Kiểm thử tự động & Biên dịch toàn diện**:
   - Bổ sung và cập nhật bộ kiểm thử `tests/quest2.cjs` (11/11 kịch bản PASS 100%, bao gồm kiểm tra permadeath và tương tác tự nhiên).
   - Toàn bộ 11 test suites trong thư mục `tests/*.cjs` đều PASS 100%.
   - Đảm bảo `compile_applet` và `lint_applet` sạch lỗi.

5. **Hệ Thống Nhạc Nền Gốc & Khử Triệt Để Lỗi Vang Rít Hz / Tiếng Hú**:
   - **Tích hợp file âm thanh nền gốc "Một Ngày Bình Yên"**: `01_Lang_Du_Lam_Mot_Ngay_Binh_Yen.ogg` (và `.mp3`) chuyển sang giai điệu Ngũ Cung G-Major thanh bình, trong trẻo, êm dịu của làng quê tuổi thơ Trương Tiểu Phàm.
   - **Triệt tiêu hoàn toàn tiếng hú ma quái**: Đã loại bỏ hoàn toàn bộ dao động tần số LFO pitch-warble và các nốt rên rỉ u tối; sáo trúc và đàn tranh phát tiếng tròn trịa, thanh khiết, ngắt êm tự nhiên.
   - **Khóa đơn luồng chống lặp (Anti-Phaser/Anti-Echo)**: Tự động ngắt bộ tổng hợp nhạc cụ ảo khi file âm thanh đang phát, chống phát chồng 2 luồng.
   - **Tầng lọc âm Master Bus**: High-pass 60Hz cắt tiếng ù sub/nhiễu AC 50-60Hz; Peaking Notch 3000Hz (Q=1.2, -3.5dB) loại bỏ hoàn toàn tần số rít vang kim loại; Low-pass 5000Hz chống xì hạt; Dynamics Compressor chống clipping vỡ tiếng.


