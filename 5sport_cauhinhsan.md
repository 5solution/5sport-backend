# 5Sport - Cấu hình sân thi đấu

## 1. Acceptance Criteria

### AC1: MÀN HÌNH 1: KHỞI TẠO NHANH (QUICK SETUP)

_Đây là Popup hoặc Step đầu tiên khi vào menu "Quản lý Sân"._

- **Tiêu đề:** "Thiết lập sân bãi cho giải đấu"
- **Input chính:** "Số lượng sân thi đấu:" `[ Input Number: 8 ]`
- **Nút Action:** `[ ⚡ TẠO DANH SÁCH SÂN ]`
- **Logic:**
  - Khi bấm tạo, hệ thống tự động loop từ 1 đến N.
  - Tự sinh tên: "Sân 1", "Sân 2", ..., "Sân 8".
  - Tự gán Status = `ACTIVE`.

### AC2: DANH SÁCH & TÙY CHỈNH (COURT LIST)

#### Mỗi dòng Sân (Court Row) gồm:

1. **Tên Sân (Editable):** Input text cho phép sửa tên.
   - _VD:_ Sửa "Sân 1" thành "Sân Trung Tâm (Live)".
2. **Phân loại (Tagging):** Dropdown Multi-select (Chọn nhiều).
   - _Label:_ "Dành cho hạng mục:"
   - _Data:_ Load danh sách hạng mục (Đôi Nam, Đôi Nữ...).
   - _Mặc định:_ "Tất cả".
   - _Use case:_ BTC muốn Sân 1 chỉ dành cho Đôi Nam Pro để quay Livestream.
3. **Trạng thái (Toggle):** Switch `[ ON / OFF ]`.
   - ON = Active.
   - OFF = Maintenance (Sân hỏng, tạm khóa).
4. **Hành động:**
   1. Nút `[ 🗑️ Xóa ]` (Chỉ xóa được nếu chưa có trận nào đang diễn ra).
   2. Nút `[ 🖨️ QR CODE ]`: Icon mã QR nhỏ bên cạnh tên sân.
5. **Nút Global (Góc trên):**
   - `[ + Thêm Sân ]`
   - `[ 🖨️ IN TOÀN BỘ QR ]`: Nút này để in hàng loạt 8 sân ra 1 file PDF (tiết kiệm giấy).

#### POPUP CHI TIẾT: QUẢN LÝ QR SÂN (INDIVIDUAL QR MODAL)

_Khi Admin bấm vào nút `[ 🖨️ QR CODE ]` ở dòng Sân 1._

- **Tiêu đề:** "Mã truy cập Sân 1"

**Nội dung:**

1. **Hình ảnh QR Code:** Hiển thị to, rõ ở giữa.
2. **Link truy cập:** `https://match.5sport.vn/court/s1...` (Có nút Copy).
3. **Trạng thái mã:** "Đang hoạt động".

**Bộ nút hành động (Footer):**

1. **[ 🖨️ TẢI FILE IN ]**:
   - Tải xuống 1 file ảnh (PNG) hoặc PDF được thiết kế sẵn (có Logo giải, Tên sân, Hướng dẫn) để đem đi in luôn.
2. **[ 🔄 TẠO MÃ MỚI (ROTATE) ]**:
   - _Cảnh báo đỏ:_ "Hành động này sẽ vô hiệu hóa mã QR cũ đang dán ở sân. Trọng tài sẽ bị đăng xuất. Bạn có chắc không?"
   - _Tác dụng:_ Dùng khi mã bị lộ hoặc muốn reset ca trực.

### AC3: LOGIC NGHIỆP VỤ (BUSINESS RULES)

- **Logic Gợi ý Sân (Smart Suggestion) - _Quan trọng cho vận hành_:**
  - Khi điều phối viên cầm 1 trận "Đôi Nam Pro" để ném vào sân.
  - Hệ thống phải check `allowedCategoryIds` của sân đó.
  - Nếu Sân 8 được cấu hình chỉ dành cho "Giao lưu", hệ thống sẽ hiện cảnh báo hoặc làm mờ Sân 8 đi.
- **Logic "Ghost Court" (Sân ảo):**
  - Hệ thống nên có sẵn 1 sân ẩn gọi là "Sân Chờ" (Holding Area) để BTC gán các trận sắp đánh vào đó cho VĐV chuẩn bị, dù chưa có sân thực tế trống.

#### A. Logic Sinh Mã (QR Generation)

- **Trigger:** Khi tạo sân mới hoặc bấm nút "Tạo mã mới".
- **Thuật toán:**
  - Payload = `{ tenantId, tournamentId, courtId, secret: court.accessSecret }`.
  - Token = `JWT.sign(Payload, SERVER_PRIVATE_KEY)`.
  - QR Content = `https://match.5sport.vn/auth/qr?t=${Token}`.

#### B. Logic In ấn (Print Template)

Dev cần làm 1 template HTML/Canvas ẩn để render ra hình ảnh trước khi cho user tải về.

- **Layout:**

```text
-----------------------------------
|  LOGO 5SPORT    LOGO GIẢI ĐẤU   |
|---------------------------------|
|         SÂN SỐ 01               |
|      (CENTER COURT)             |
|                                 |
|      [ HÌNH QR CODE ]           |
|                                 |
|---------------------------------|
|  Quét để nhập điểm / Score Input|
-----------------------------------
```
