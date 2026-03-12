# 5Sport - Điều hành sự kiện - TOURNAMENT OPERATION CENTER

## 1. Acceptance Criteria

## 1. CẤU TRÚC DỮ LIỆU CỐT LÕI (CORE DATA STRUCTURES)


```typescript
// 1. Trạng thái Trận đấu (State Machine)
enum MatchStatus {
  PENDING = 'PENDING',       // Đang ở hàng chờ (Queue)
  SCHEDULED = 'SCHEDULED',   // Đã gán vào sân (nhưng VĐV chưa ra)
  WARM_UP = 'WARM_UP',       // VĐV đang khởi động trên sân (Optional)
  PLAYING = 'PLAYING',       // Trọng tài đã thổi còi bắt đầu
  COMPLETED = 'COMPLETED',   // Đã có kết quả
  CANCELLED = 'CANCELLED'    // Hủy bỏ
}

// 2. Trạng thái Sân (Court Status)
enum CourtStatus {
  AVAILABLE = 'AVAILABLE',   // Trống
  RESERVED = 'RESERVED',     // Đã gán trận, chờ VĐV
  BUSY = 'BUSY',             // Đang có trận đánh
  MAINTENANCE = 'MAINTENANCE' // Hỏng/Đang sửa
}

// 3. Đối tượng hiển thị trên Dashboard
interface OperationMatch {
  id: string;
  code: string;              // Mã trận (VD: #M01)
  categoryName: string;      // "Đôi Nam 3.5"
  roundName: string;         // "Tứ kết" / "Vòng bảng"
  
  teamA: { name: string; avatar?: string };
  teamB: { name: string; avatar?: string };
  
  courtId?: string;          // ID sân (nếu không phải PENDING)
  status: MatchStatus;
  
  startTime?: Date;          // Thời gian bắt đầu thực tế
  duration?: number;         // Thời gian đã trôi qua (giây)
  currentScore?: string;     // Tỷ số realtime (nếu có)
}
```


_Prompt cho AI Coder:_  
"Define the strict Typescript interfaces for the Operation Dashboard. Focus on the Match Status State Machine."

## 2. BỐ CỤC MÀN HÌNH (UI LAYOUT SPECS)

Màn hình chia làm 3 khu vực (Zones). Yêu cầu thiết kế **Full-width** (Tràn màn hình) để tận dụng không gian.

### ZONE A: THANH TRẠNG THÁI (STATS BAR - TOP)

_Chiều cao: 60px. Cố định trên cùng._

- **KPIs Real-time:**
  - 🕒 **Giờ hiện tại:** 10:45 AM.
  - 📊 **Tiến độ giải:** 35% (Thanh Progress Bar).
  - 🔢 **Thống kê:**
    - Pending: **15** trận.
    - Playing: **8** trận.
    - Completed: **20** trận.
- **Global Actions:**
  - `[ 🔍 Tìm kiếm VĐV/Trận đấu ]`: Input Search.
  - `[ ⚡ Auto-Assign ]`: Nút xếp tự động.

### ZONE B: HÀNG CHỜ (MATCH QUEUE - LEFT SIDEBAR)

_Chiều rộng: 350px - 400px. Có Scroll bar dọc._

- **Filter Bar:**
  - Dropdown chọn Hạng mục (VD: Chỉ hiện Đôi Nam).
  - Toggle: "Ưu tiên trận quan trọng" (Bán kết/CK lên đầu).
- **List Item (Match Card):** Mỗi trận đấu là 1 thẻ có thể nắm kéo được (Draggable).
  - **Visual:** Border màu cam (Pending).
  - **Content:**
    - `#102` - **Tứ kết** (Bold).
    - **Nguyễn A & Trần B** vs **Lê C & Phạm D**.
    - _Badge:_ Sân dự kiến (nếu có).

### ZONE C: SƠ ĐỒ SÂN (LIVE COURTS - MAIN AREA)

_Khu vực chính. Hiển thị Grid các sân đấu (2 cột, 3 cột hoặc 4 cột tùy màn hình)._

- **Court Card (Thẻ Sân):**
  - **Header:** Tên sân (Sân 1) + Trạng thái (Trống/Đang đánh).
  - **Body:**
    - _Nếu Trống:_ Vùng Drop Zone (Hiện chữ "Kéo trận vào đây").
    - _Nếu Có trận:_
      - Hiển thị Tên 2 cặp đấu.
      - Đồng hồ đếm giờ (Timer): `00:15:30`.
      - Tỷ số hiện tại (nếu nhập live).
  - **Footer (Action Buttons):**
    - Nút `[ ▶️ Bắt đầu ]` (Khi ở trạng thái Reserved).
    - Nút `[ 📝 Nhập điểm ]` (Khi ở trạng thái Playing).
    - Nút `[ ↩️ Undo ]` (Gỡ trận ra khỏi sân).

## 3. LOGIC CHỨC NĂNG CHI TIẾT (FUNCTIONAL LOGIC)

### 1. LOGIC KÉO THẢ (DRAG & DROP ASSIGNMENT)

- **Trigger:** User kéo Card từ Zone B -> Thả vào Zone C (Sân X).
- **Validation (Backend Check):**
  1. **Check Status:** Sân X có đang `AVAILABLE` không? Nếu đang `BUSY` -> Chặn.
  2. **Check Category:** Sân X có cho phép hạng mục này đá không? (Dựa vào config `allowedCategoryIds` ở bước Cấu hình sân).
     - _Nếu không hợp lệ:_ Hiện thông báo lỗi "Sân này không dành cho Đôi Nam".
- **Success Action:**
  - Update DB: `Match.courtId = X`, `Match.status = SCHEDULED`.
  - Update UI Sân X: Đổi màu sang **VÀNG (Reserved)**, hiện thông tin trận đấu.
  - Xóa Card khỏi Zone B (Hàng chờ).

### 2. LOGIC ĐIỀU KHIỂN TRẬN ĐẤU (MATCH LIFECYCLE)

Đây là quy trình "Bấm nút" của trọng tài/BTC:

- **Bước 1: Gọi VĐV (Call Players)**
  - Trạng thái: `SCHEDULED` (Màu Vàng).
  - Hành động: BTC loa gọi VĐV. Khi VĐV có mặt -> Bấm **[ ▶️ START WARM-UP ]** (Optional) hoặc **[ ▶️ START MATCH ]**.
- **Bước 2: Thi đấu (Playing)**
  - Trạng thái: `PLAYING` (Màu Đỏ).
  - Hệ thống bắt đầu đếm giờ `duration` (tăng dần 1s).
  - Action: Cho phép bấm vào card để nhập tỷ số Live (ví dụ từng set).
- **Bước 3: Kết thúc (Finishing)**
  - Hành động: Bấm **[ ✅ KẾT THÚC / NHẬP KẾT QUẢ ]**.
  - Mở Popup nhập điểm cuối cùng.

### 3. LOGIC POPUP NHẬP ĐIỂM (SCORE INPUT MODAL)

- **Input:**
  - Tỷ số Set 1, Set 2, Set 3.
  - Checkbox: **Winner** (Hệ thống tự gợi ý dựa trên tỷ số, nhưng User phải confirm).
  - Checkbox: **Bỏ cuộc (Retired/Walkover)** (Nếu có biến).
- **Submit Action:**
  1. Lưu kết quả vào Match History.
  2. **Bracket Engine Trigger:** Đẩy đội thắng vào vòng sau của nhánh đấu. Đội thua rớt xuống nhánh thua (nếu Double Elim) hoặc bị loại.
  3. **Auto-Release Court:** Set trạng thái Sân X về `AVAILABLE` (Màu Xanh) ngay lập tức.

### 4. LOGIC XẾP TỰ ĐỘNG (AUTO-ASSIGN ALGORITHM)

_Dành cho nút "Tia chớp" [⚡]._

- **Thuật toán:**
  1. Lấy danh sách tất cả Sân đang `AVAILABLE`.
  2. Lấy danh sách `PENDING` Matches.
  3. **Sort Priority (Sắp xếp ưu tiên):**
     - Trận có `round` cao hơn xếp trước (Chung kết > Bán kết > Vòng loại).
     - Trận chờ lâu hơn xếp trước (`created_at` cũ hơn).
  4. **Loop Assign:** Gán lần lượt Match vào Court (Check điều kiện Category).
  5. **Output:** Hiển thị Popup:  
     _"Tìm thấy 5 sân trống. Sẽ gán 5 trận sau vào sân... Bạn có đồng ý không?"_ -> User Confirm.

## 4. XỬ LÝ SỰ CỐ (EXCEPTION HANDLING)

1. **Undo Gán Sân (Unassign):**
   - _Tình huống:_ Kéo nhầm trận vào sân, hoặc VĐV đau bụng xin hoãn.
   - _Action:_ Trên Card Sân, bấm nút [X] hoặc "Gỡ bỏ".
   - _Logic:_ Trả trận đấu về lại Hàng chờ (Queue Zone B). Sân trở lại màu Xanh.

2. **Sửa Kết Quả (Correction):**
   - _Tình huống:_ Nhập nhầm tỷ số sau khi đã bấm Kết thúc.
   - _Action:_ Vào Lịch sử trận đấu -> Sửa tỷ số.
   - _Logic:_ **Cực nguy hiểm.** Nếu vòng sau đã xếp lịch rồi thì phải cảnh báo:  
     _"Việc sửa kết quả này sẽ làm thay đổi nhánh đấu vòng sau. Bạn có chắc không?"_.  
     (Thường chỉ cho Admin quyền này).

3. **Đổi Sân (Swap Court):**
   - _Tình huống:_ Sân 1 đang đánh thì hỏng lưới/mưa. Cần chuyển sang Sân 5.
   - _Action:_ Kéo Card từ Sân 1 -> Thả vào Sân 5.
   - _Logic:_ Giữ nguyên thời gian đếm giờ và tỷ số, chỉ đổi `courtId`.

## 5. MÔ TẢ UI CHI TIẾT CHO CÁC CARD TRẠNG THÁI (VISUAL STATES)

1. **CARD SÂN TRỐNG (AVAILABLE)**
   - **Màu nền:** Trắng hoặc Xanh nhạt.
   - **Border:** Xanh lá (Green dashed).
   - **Text giữa:** "SÂN 1 - TRỐNG". Icon: 📥 (Drop here).

2. **CARD ĐÃ GÁN (SCHEDULED)**
   - **Màu nền:** Vàng nhạt (Yellow/Amber).
   - **Nội dung:**
     - Trận #101: Đôi Nam
     - **Tuấn/Hùng** vs **Nam/Bắc**
   - **Nút:** `[ ▶️ BẮT ĐẦU ]`.

3. **CARD ĐANG ĐÁ (PLAYING)**
   - **Màu nền:** Đỏ nhạt (Red) hoặc Trắng viền Đỏ đậm.
   - **Hiệu ứng:** Có chấm đỏ 🔴 nhấp nháy (Recording).
   - **Nội dung:**
     - Đồng hồ: **14:02** (Chạy thời gian thực).
     - Điểm số: **(1) 11-5 | 4-2**.
   - **Nút:** `[ 📝 NHẬP ĐIỂM ]`.
