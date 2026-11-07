# Làng Du Lãm v1.8.8 – Hiệu ứng huyết dạ (KHÔNG VẼ LẠI MAP)

## Yêu cầu đã thực hiện
- **Không vẽ lại map**. Giữ nguyên ảnh gốc `public/game/map.webp` và `public/game/Lang_Du_Lam_Hoang_Tan.webp` (không sửa pixel).
- Trước nửa đêm: hiển thị làng bình thường.
- **Đang bị Liệp Ma tập kích (00:00):** dùng chính map hoang tàn sẵn có, phủ ánh sáng đêm và hiệu ứng Canvas vẽ theo thời gian gồm lửa cháy trên các nóc nhà, cột khói đen bốc lên, tàn lửa bay và vài vệt máu nhỏ.
- Khi người chơi còn trong nhà: có ánh lửa chập chờn/khói nhẹ **qua ô cửa sổ sẵn có**, không che cơ chế vết nứt phá tường hay bóng Liệp Ma.
- **Đúng 06:00 sau khi sống sót:** tắt toàn bộ lửa, khói, tàn lửa động; hiện trở lại chính ảnh map hoang tàn có sẵn dưới ánh sáng buổi sáng.
- Không thay đổi bản đồ va chạm, đường đi, vật cản, dữ liệu lưu, logic nhiệm vụ 1/2 và truyện A Nguyệt.
- Không thêm ảnh hay tài nguyên âm thanh mới. Toàn bộ hiệu ứng được vẽ bằng Canvas, tự giới hạn ở vùng camera để giảm tải điện thoại.

## Tệp được thay đổi
- `public/game/village-raid-fx.js` (mới, mã hiệu ứng)
- `public/game/game.js` (gọi hiệu ứng trên map trong giờ tập kích)
- `public/game/quest2.js` (ánh khói/lửa qua cửa sổ khi trốn trong nhà)
- `public/game/index.html` (tải script hiệu ứng mới)
- `package.json` (version 1.8.8 và bài test mới)
- `tests/village-raid-fx.cjs` (kiểm thử trạng thái ngày/đêm, Canvas, tối ưu vùng camera)

## Kiểm tra
- `npm test`: toàn bộ bộ kiểm thử trong package thành công (gồm test mới).
- JS syntax checks: đạt.
- Không thay đổi byte hai map gốc. SHA256:
  - map.webp: `3eef50b355d34ccaba6cf651fcb394995f8aa158a1f30799af95d0d55664feae`
  - Lang_Du_Lam_Hoang_Tan.webp: `1d2813d5202a582a44ea1f9c214d749a3e4c4a4d04fa9fcb303eff0b0e0728eb`

## Lưu ý
- Cần xem lại vị trí vài ngọn lửa trên từng nóc nhà bằng trình duyệt thật để tinh chỉnh thẩm mỹ; kiểm thử tự động không chứng nhận thẩm mỹ.
- Những vết máu đã có sẵn trong **ảnh map hoang tàn cũ** vẫn giữ nguyên. Chỉ các vệt máu nhỏ **bổ sung** được tạo bằng mã.
