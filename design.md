| **Version** | v1.0 |
| **Create date** | 2026-1-15 |
| **EPIC** |  |
| **UserStory** |  |
| **Status** | DONE |
| **Changes** |  |
| **Content** |  |

## Who’s it for?
- Admin của ban tổ chức/ được phân quyền tạo  
- Chủ sân / được phân quyền tạo  

## Why should we build it?
Xây dựng hệ thống cho Admin của ban tổ chức các giải thể thao

## Status của sự kiện 

| Trạng thái | Ý nghĩa & Logic vận hành | Tác động hệ thống |
| --- | --- | --- |
| **Nháp (Draft)** | Sự kiện đang trong quá trình khai báo, chưa hoàn thiện các trường bắt buộc. | Ẩn hoàn toàn khỏi trang Public. Chỉ ORG có quyền xem và sửa. |
| **Đã xuất bản (Published)** | Giải đấu đã khai báo đủ thông tin và sẵn sàng bán vé. | Hiển thị trên nền tảng 5Ticket/5Arena. VĐV có thể xem thông tin nhưng chỉ mua được khi tới giờ mở bán. |
| **Đang diễn ra (Live)** | Thời gian hiện tại nằm trong khoảng `Event Start Time` và `Event Closing Time`. | Ưu tiên hiển thị trên Dashboard. Kích hoạt tính năng Check-in và nhập kết quả trận đấu (Match Management). |
| **Đã đóng (Closed)** | Thời gian hiện tại đã vượt quá `Event Closing Time`. | Ngừng toàn bộ hoạt động Đăng ký, Chuyển nhượng và Check-in. Chuyển sang chế độ xem báo cáo. |
| **Đã hủy (Void/Cancelled)** | BTC chủ động hủy giải đấu do các lý do bất khả kháng. | Ẩn sự kiện khỏi trang chủ. Toàn bộ vé đã bán chuyển sang trạng thái chờ xử lý hoàn tiền (Refund). |

### Logic chuyển đổi trạng thái (State Transition Logic)

Để tránh sai sót thủ công, Dev cần code các Trigger tự động chuyển trạng thái dựa trên **Mốc thời gian (Timeline)** mà Danny vừa cấu hình:

1. **Draft -> Published:** Do BTC chủ động nhấn nút "Xuất bản sự kiện" sau khi hệ thống xác nhận đã điền đủ các AC bắt buộc  
2. **Published -> Live:** Tự động chuyển khi `Current Time >= Event Start Time`.  
3. **Live -> Closed:** Tự động chuyển khi `Current Time > Event Closing Time`.  
4. **Hủy giải:** Chỉ được thực hiện khi giải ở trạng thái `Published` hoặc `Live` (Trước khi `Closed`).  

## Mockups
Update soon

## Requirements

## 1. Acceptance Criteria

Người dùng vào danh sách sự kiện click [Tạo mới sự kiện] hệ thống đưa người dùng tới trang tạo mới sự kiện

### AC1: TRANG THÔNG TIN TỔNG QUAN (GENERAL INFORMATION)

**Mô tả:** Thiết lập bộ nhận diện, địa điểm và các cấu hình chặn/lọc người dùng.

| Trường dữ liệu | Loại | Ràng buộc | Logic xử lý & Mapping |
| --- | --- | --- | --- |
| **Tên sự kiện** | Text | x | Tối đa 256 ký tự. Hiển thị làm Title trên trang sự kiện. |
| **Thương hiệu** | Text | Không | Thông tin các nhà tài trợ chính. |
| **Loại hình** | Option | x | Option  <br> * Pickeball  <br> * Cầu lông  <br> * Tennis - tạm chưa support |
| **Blacklist** | Area | Không | Nhập Email/SĐT cách nhau bởi dấu `Enter` hoặc `Space`. Hệ thống quét và chặn các User này ở mọi luồng: Mua vé, Ghi danh, Check-in. |
| **Hotline** | SĐT | x | Hiển thị nút gọi hỗ trợ cho VĐV trên trang Public. |
| **Địa điểm** | Text/Map | x | Địa chỉ chi tiết (Sân số..., Đường...). |
| **Tỉnh/Thành** | List | x | Load danh sách 64 tỉnh thành. |
| **Phường/Xã** | List | x | Load động theo Tỉnh/Thành đã chọn. |
| **Mã tiền tố** | Text | x | Tối đa 6 ký tự. **Auto Uppercase**. VD: Nhập `pkb` -> DB lưu `PKB`. Dùng làm Prefix cho mã vé/BIB. |
| **Slug sự kiện** | URL | Tự động | Sinh ra từ Tên sự kiện (không dấu, gạch ngang). Cho phép ORG sửa tay. |
| **Cho phép chuyển nhượng** | Boolen | Không | Default - True. Người dùng bật tắt tính năng chuyển nhượng bằng button này |
| **Thời gian diễn ra sự kiện** | Datepicker | x | Thời gian bắt đầu sự kiện |
| **Thời gian kết thúc sự kiện** | Datepicker | x | Thời gian dự kiến bế mạc sự kiện. Không được phép nhỏ hơn ngày diễn ra |
| **Cho phép chỉnh sửa thông tin** | Datepicker | x | Thời gian bắt đầu cho phép người dùng chỉnh sửa thông tin |
| **Đóng chỉnh sửa thông tin** | Datepicker | x | Thời gian đóng chỉnh sửa thông tin vận động viên |
| **Cho phép chuyển nhượng** | Datepicker | x | Hiển thị trường này khi cờ **Cho phép chuyển nhượng là true**. Trường hợp cờ = false ẩn trường này và không bắt buộc điền |
| **Đóng chuyển nhượng** | Datepicker | x | Hiển thị trường này khi cờ **Cho phép chuyển nhượng là true**. Trường hợp cờ = false ẩn trường này và không bắt buộc điền |
| **Mở check-in** | Datepicker | x | Thời gian mở checkin sự kiện |
| **Đóng check-in** | Datepicker | x | Thời gian đóng checkin sự kiện |
| **Cấu hình phương thức thanh toán** |  | x | Cho phép chọn các phương thức thanh toán  <br> * VNPAY QR  <br> * Thẻ quốc tế  <br> * Thẻ nội địa  <br> * QR PAYX  <br> * Thẻ nội địa PAYX |

#### 2. Testcase & Corner Case:

| ID | Kịch bản kiểm thử (Test Scenario) | Kết quả mong đợi |
| --- | --- | --- |
| **TC 1.1** | Nhập mã tiền tố "pkb2026" (7 ký tự) | Hệ thống báo lỗi "Mã sự kiện tối đa 6 ký tự". |
| **TC 1.2** | Nhập thời gian Đóng đăng ký sau thời gian Diễn ra sự kiện | Hệ thống báo lỗi "Thời gian đóng cổng phải nằm trước thời gian diễn ra". |
| **TC 1.3** | Chọn tỉnh thành nhưng chưa chọn Phường/Xã và nhấn Lưu | Hệ thống báo lỗi "Vui lòng chọn Phường/Xã". |
| **Corner 1.1** | User thuộc Blacklist cố tình quét mã QR để Check-in tại sân | Hệ thống báo lỗi "Bạn bị từ chối tham gia sự kiện này" và không cho Check-in. |
| **Corner 1.2** | Hai mốc thời gian trùng nhau chính xác tới từng giây | Hệ thống chấp nhận nếu logic Start <= End, ngược lại báo lỗi. |

### AC2: HÌNH ẢNH & MÔ TẢ SỰ KIỆN (MEDIA & DESCRIPTION)

#### 1. Đặc tả trường dữ liệu (Field Specifications):

- **Logo sự kiện:** PNG/JPEG/JPG. Max 2MB. Kích thước tối thiểu  
- **Wallpaper (Ảnh bìa):** Max 3MB. Kích thước tối ưu  
- **Ảnh nội dung Email:** Tương tự Wallpaper, dùng để chèn vào mail xác nhận vé.  
- **Mô tả sự kiện:** Rich Text Editor.  
  - Cho phép tạo nhiều mô tả  

### AC3: SUẤT THI ĐẤU & HẠNG VÉ (SESSIONS & TICKETS)

**Mô tả:** Cấu hình các ca thi đấu (Nội dung thi đấu) và các loại vé tương ứng.

#### 1. Đặc tả trường dữ liệu (Field Specifications):

#### Hạng mục thi đấu

Trường hợp chưa có hạng mục thi đấu hệ thống hiển thị [Thêm mới hạng mục thi đấu]  
Trường hợp có hạng mục thi đấu hệ thống hiển thị [Thêm mới hạng mục thi đấu khác] đồng thời khi người dùng click vào hệ thống clone hạng mục phía trên để cho phép người dùng sửa thông tin nhanh chóng

| Tên trường | Bắt buộc | Mô tả |
| --- | --- | --- |
| Tên hạng mục thi đấu | x | Tên hạng mục thi đấu. Ví dụ “Thi đấu đơn nam trình độ >5.0” |
| Thể thức thi đấu | x | Chọn: `Đơn (Singles)` hoặc `Đôi (Doubles)`. |
| **Yêu cầu Partner** | Toggle | (Chỉ hiện khi chọn Đôi)  <br> * **ON:** Bắt buộc có Partner mới được hoàn tất thanh toán.  <br> * **OFF:** Cho phép đăng ký lẻ, BTC sẽ ghép sau. |
| Thời gian bắt đầu nội dung | x | Thời gian bắt đầu dự kiến cần các VDV có mặt để làm thủ tục |
| Thời gian kết thúc dự kiến | x | Thời gian dự kiến kết thúc của nội dung |
| Mã vé | x | Mã UNIQUE của vé để thực hiện gen random. Giới hạn 3 ký tự |
| Hình vé |  |  |
| Bật kiểm tra rating |  | Mặc định = false. Trường hợp true hệ thống hiển thị thêm các trường bên dưới |
| Nguồn tham chiếu | x | Cho phép chọn nhiều  <br> * Điểm Verified Manual - Điểm của cá nhân tự khai báo  <br> * 5Rating - Điểm của hệ thống tính toán  <br> * Điểm này tích lũy dựa trên kết quả các giải đấu hoặc do Admin của 5Sport chỉnh sửa  <br> * Nếu môn thể thao là cầu lông thì dùng điểm cầu lông để check  <br> * Nếu môn thể thao là pickerball thì dùng điểm pickerball để check  <br> * DUPR - Điểm từ kết nối DUPR (trong trường hợp 5SPORT kết nối được)  <br> * Hoặc verified khi người dùng đính kèm ID DUPR của người dùng trong profile  <br> Trường hợp chọn Điểm 5Rating hoặc DUPR hệ thống sẽ ưu tiên verified theo thứ tự DUPR → 5Rating → Manual để cho phép VDV đăng ký |
| Ngưỡng điểm tối thiểu | x | Ngưỡng điểm tối thiểu để đăng ký hạng mục thi đấu |
| Ngưỡng điểm tối đa | x | Ngưỡng điểm tối đa để đăng ký hạng mục thi đấu |

#### Logic xử lý khi VĐV đăng ký:

1. VĐV nhấn chọn Hạng mục thi đấu  
2. Hệ thống kiểm tra `User_ID` -> Trường hợp chọn Điểm 5Rating hoặc DUPR hệ thống sẽ ưu tiên verified theo thứ tự DUPR → 5Rating → Manual để cho phép VDV đăng ký  
3. **So khớp (Validation):**
   - **Hợp lệ:** Rating nằm trong Range -> Cho phép chọn hạng mục  
   - **Không hợp lệ:** Rating cao hơn/thấp hơn Range -> Hiển thị thông báo lỗi: "Trình độ của bạn không phù hợp với nội dung này"

#### Loại vé ứng với hạng mục thi đấu

Hệ thống cho phép tạo các giai đoạn vé tùy theo thời gian mở bán logic như 5BIB (Super Early Bird, Standard, Late etc …)  
Người dùng click Thêm loại vé hệ thống hiển thị bản ghi

| Tên trường | Bắt buộc | Mô tả |
| --- | --- | --- |
| Tên loại vé | x | Tên hạng vé/ hạng mục |
| Giá vé | x | Tickbox “Free” để lựa chọn khi vé miễn phí. Hệ thống sẽ Deactive trường giá vé. Trường hợp không tích hệ thống hiển thị trường giá vé theo định dạng VND `xxx.xxx.xxx` |
| Tổng số lượng vé | x | Tổng số lượng vé bán |
| Số lượng vé tối thiểu | x | Số lượng vé tối thiểu của 1 đơn hàng với loại vé này |
| Số lượng vé tối đa | x | Số lượng vé tối đa của 1 đơn hàng với loại vé này |
| Hiển thị giai đoạn vé |  | Mặc định “true”. Cờ này để ẩn hiện giai đoạn vé này trên UI. Set False thì giai đoạn vé này sẽ ẩn đi trên UI của người mua |
| Ngày bắt đầu bán | x | Ngày mở bán vé của loại vé |
| Ngày ngưng bán | x | Ngày đóng bán vé của loại vé |

**LƯU Ý**

- Mỗi một bản ghi hạng mục thi đấu sẽ đi kèm nhiều loại vé  
- Trong 1 sự kiện sẽ có nhiều hạng mục thi đấu và nhiều loại vé kèm theo hạng mục thi đấu tương ứng  

### AC4: LẤY THÔNG TIN NGƯỜI THAM GIA (CUSTOM FIELDS & DB MAPPING) 

**Mô tả:** Thiết lập form đăng ký và ánh xạ dữ liệu vào CSDL  
Các trường dữ liệu này sẽ lấy khi người dùng đăng ký tham dự sự kiện

- Hiển thị danh sách các câu hỏi đã tạo.  
- Mỗi câu hỏi là một **block (accordion)** có thể mở để chỉnh sửa.
  - Ở trạng thái thu gọn hệ thống hiển thị Title của câu hỏi
    - Trạng thái ẩn hiện của câu hỏi
  - Ở trạng thái mở rộng hệ thống hiển thị bao gồm các trường:
    - **Label trường thông tin**
      - Định dạng text  
      - Bắt buộc  
      - Cái này để hiển thị trên UI về title của câu hỏi  
    - **Tên trường thông tin**
      - Định dạng text  
      - Bắt buộc  
      - Cái này để hiển thị trong báo cáo  
    - **Mô tả ngắn**
      - Text  
      - Mô tả về câu hỏi tối đa 250 ký tự  
    - **Loại câu hỏi**
      - Nhập text  
      - Chọn tỉnh thành  
      - Chọn quốc gia  
      - Chọn một lựa chọn  
      - Chọn nhiều lựa chọn  
      - Chọn ngày tháng năm  
      - **Tải lên tệp**
        - Trường hợp này hệ thống upload tệp của người dùng lên S3  
        - Tối đa 2MB và hệ thống sẽ nén ảnh nhưng cần đảm bảo để sau còn xử lý case checkin bằng khuôn mặt  
    - Trường hợp chọn một lựa chọn và nhiều lựa chọn hệ thống hiển thị thêm trường “Lựa chọn”
      - Cho phép người dùng nhập multi lựa chọn mỗi lựa chọn phân tách nhau bởi enter  
    - Trường hợp chọn ngày hệ thống chỉ nhận giá trị datetime `dd/mm/yyyy`  
    - Trường hợp chọn Tải lên tệp hệ thống hiển thị thêm trường
      - Định dạng file tải lên cho phép người dùng nhập đuôi file chấp thuận phân tách nhau bởi Enter  
    - Trường hợp chọn tỉnh thành hệ thống hiển thị danh sách tỉnh thành cho người dùng chọn  
    - **Giá trị mặc định**
      - Trường hợp nhập text hệ thống cho phép người dùng nhập giá trị mặc định  
      - Trường hợp chọn lựa chọn hệ thống cho phép chọn 1 lựa chọn trong danh sách lựa chọn đã tạo ở trên  
      - Trường hợp chọn ngày hệ thống cho chọn ngày mặc định  
    - **Ảnh đính kèm**
      - Hệ thống cho phép upload ảnh lên để hiển thị ảnh ở form theo dạng hyperlink  
    - **DB Mapping - Mapping Field với trường dữ liệu trong CSDL của 5TICKET**
      - Cho phép chọn các trường dữ liệu có sẵn trong DB thông tin người tham dự để dữ liệu fill vào trong DB
        - Không cho chọn trùng trường dữ liệu khi form đăng ký đã có 1 trường dữ liệu chọn rồi  
        - Danh sách trường dữ liệu:
          - `participantName` - Tên người tham dự  
          - `participantsFirstName` - Họ và tên đệm  
          - `participantsLastName` - Tên  
          - `participantsDOB` - Ngày sinh người tham dự  
          - `participantsGender` - Giới tính người tham dự  
          - `participantsEmail` - Email của người tham dự  
          - `participantsPhone` - Số điện thoại người tham dự  
          - `participantsRacekit` - Size áo của người tham dự  
          - `participantsPortrait` - Ảnh chân dung người tham dự  
          - `participantsId` - Số căn cước/ Hộ chiếu của người tham dự  
          - `participantsAddress` - Địa chỉ của người tham dự  
          - `participantsCompany` - Hội nhóm/ công ty của người tham dự  
          - `participantsNational` - Quốc tịch của người tham dự  
          - `participantsQuestion` - Ví dụ như nó có câu hỏi thì map mẹ vào đây  
          - `participantsNote` - Note của người tham dự  
          - `participantsCity` - Thành phố của người tham dự  

- Trường hợp không chọn DB Mapping thì logic xử lý như Custom Field hiện tại  
- **Nút Yêu cầu trả lời**
  - True là bắt buộc người tham gia phải trả lời  
  - False là người tham gia có thể trả lời hoặc không  
- **Nút Ẩn/ Hiện trường dữ liệu**
  - Mặc định là Hiện  
  - Chọn ẩn thì trường dữ liệu sẽ ẩn trên UI  
- **Nút thêm mới câu hỏi** để thêm mới trường dữ liệu  
- **Nút xóa câu hỏi** để xóa câu hỏi trên form - Chỉ có thể xóa được câu hỏi khi chưa public sự kiện
  - Trường hợp đã public sự kiện sẽ không thể xóa câu hỏi do ảnh hưởng tới data người tham dự  

### AC5: CẤU HÌNH LUẬT THI ĐẤU

**Mục tiêu:** Cấu hình luật tính điểm (Scoring Engine) cho giải đấu dựa trên môn thể thao đã chọn.  
**Input:** `sportType` (Lấy từ Step 1).  
**Output:** JSON Object `scoringConfig` lưu vào Database.

### A. TRƯỜNG HỢP: SPORT TYPE = PICKLEBALL

| Tên trường (Field Name) | Loại (Type) | Giá trị (Values/Options) | Mặc định (Default) | Logic hiển thị / Hành vi |
| --- | --- | --- | --- | --- |
| **Scoring Mode** | Dropdown | `SIDE_OUT` (Truyền thống), `RALLY_POINT` (Điểm trực tiếp) | `SIDE_OUT` | Nếu chọn `SIDE_OUT` -> Kích hoạt logic Server 1/2 trong App Trọng tài. |
| **Match Format** | Radio Group | `1_SET`, `BEST_OF_3`, `BEST_OF_5` | `1_SET` |  |
| **Points to Win** | Number Input | Min: 11, Max: 21 | `11` | Điểm số để thắng 1 set. |
| **Win by 2** | Toggle (Boolean) | `TRUE` / `FALSE` | `TRUE` | Nếu `TRUE`: Phải thắng cách biệt 2 điểm (VD: 11-9, 12-10). |
| **Point Cap** | Number Input | Min: `Points to Win` + 1, Max: 50 | `NONE` (Null) | Điểm trần. Nếu hòa đến điểm này thì ai lên trước là thắng (Sudden Death). Ẩn nếu `Win by 2` = FALSE. |
| **Switch Ends** | Number Input | `0` (Không đổi), `6` (Giữa set 11), `8` (Giữa set 15) | `6` | Đổi sân khi một bên đạt điểm số này. |

### B. TRƯỜNG HỢP: SPORT TYPE = BADMINTON

| Tên trường (Field Name) | Loại (Type) | Giá trị (Values/Options) | Mặc định (Default) | Logic hiển thị / Hành vi |
| --- | --- | --- | --- | --- |
| **Scoring Mode** | Read-only Text | `RALLY_POINT` | `RALLY_POINT` | Cố định, User không được sửa. |
| **Match Format** | Radio Group | `BEST_OF_3` | `BEST_OF_3` | Chuẩn BWF là Best of 3. |
| **Points to Win** | Number Input | Min: 11, Max: 31 | `21` | Thường là 21 (3 sets) hoặc 31 (1 set). |
| **Win by 2** | Toggle (Boolean) | `TRUE` / `FALSE` | `TRUE` | Luật Deuce (20-20 đánh lên 22). |
| **Max Point (Cap)** | Number Input | Fixed: `30` | `30` | Luật BWF: Hòa 29-29 thì ai lên 30 thắng. |
| **Change Ends** | Checkbox Group | `[x] End of Set`, `[x] Interval (11 pts)` | Cả 2 `TRUE` | - `End of Set`: Đổi sân sau mỗi set.  <br> - `Interval`: Đổi sân/Nghỉ khi chạm 11 điểm set 3. |

#### 1. VALIDATION RULES (QUY TẮC KIỂM TRA DỮ LIỆU)

##### A. QUY TẮC CHUNG (COMMON RULES)

1. **Required Fields:** `Match Format`, `Points to Win` không được để trống.  
2. **Positive Integer:** Điểm số phải là số nguyên dương. Không chấp nhận số thập phân (11.5) hoặc số âm.  
3. **Logical Consistency:**
   - `Point Cap` (nếu có) **BẮT BUỘC PHẢI LỚN HƠN** `Points to Win`.  
     - Sai: Thắng 21, Cap 20.  
     - Đúng: Thắng 21, Cap 30.  
   - `Switch Ends At` (Điểm đổi sân) **PHẢI NHỎ HƠN** `Points to Win`.  
     - Sai: Thắng 11, Đổi sân ở 15.  

##### B. QUY TẮC RIÊNG CHO PICKLEBALL

1. **Points Range:**
   - Nếu Format = `1_SET`: Warning nếu Points < 15 (Quá ngắn cho 1 set).  
   - Max Point cho phép: **25** (Để tránh nhập nhầm thành 110).  
2. **Scoring Cap:**
   - Chỉ cho phép nhập nếu `Win by 2` đang bật.  

##### C. QUY TẮC RIÊNG CHO BADMINTON

1. **Points Range:**
   - Default phải là **21**.  
   - Max Point cho phép: **30**  

##### D. ERROR MESSAGES (THÔNG BÁO LỖI)

| Mã lỗi | Điều kiện Trigger | Thông báo hiển thị (Tiếng Việt) |
| --- | --- | --- |
| `ERR_POINTS_MIN` | Nhập điểm < 11 | "Điểm thắng một set tối thiểu là 11." |
| `ERR_POINTS_MAX` | Nhập điểm > Max (25/31) | "Điểm thắng quá lớn. Vui lòng kiểm tra lại." |
| `ERR_CAP_INVALID` | Cap <= Points | "Điểm trần (Cap) phải lớn hơn điểm thắng set." |
| `ERR_SWITCH_INVALID` | Switch >= Points | "Điểm đổi sân phải nhỏ hơn điểm thắng set." |
| `ERR_REQUIRED` | Field trống | "Vui lòng nhập thông tin này." |

### TỪ ĐIỂN DỮ LIỆU: CẤU HÌNH LUẬT THI ĐẤU (GAME RULES DICTIONARY)

#### 1. Scoring Mode (Cơ chế tính điểm)

- **Ý nghĩa:** Xác định xem **"Khi nào thì một điểm số được cộng?"**.  
- **Các giá trị:**
  - `SIDE_OUT` (Pickleball truyền thống): Chỉ đội **đang giao bóng** thắng pha bóng thì mới được +1 điểm. Nếu đội nhận bóng thắng -> Chỉ giành lại quyền giao bóng (không có điểm).  
  - `RALLY_POINT` (Cầu lông/Tennis/Pickleball mới): Bất kỳ đội nào thắng pha bóng cũng được +1 điểm.  
- **Tác động lên App:**
  - Nếu là `SIDE_OUT`: App Trọng tài phải hiện số **Server 1/2**.  
  - Nếu là `RALLY_POINT`: App Trọng tài ẩn số Server, hiện chỉ báo Sân (Trái/Phải).  

#### 2. Match Format (Thể thức trận đấu)

- **Ý nghĩa:** Xác định **"Cấu trúc của một trận đấu gồm bao nhiêu ván (Set)?"**.  
- **Các giá trị:**
  - `1_SET`: Đánh đúng 1 ván là xong (Thường dùng cho vòng loại, giải phong trào đông người).  
  - `BEST_OF_3` (Thắng 2/3): Đánh tối đa 3 ván. Ai thắng 2 ván trước là thắng chung cuộc.  
  - `BEST_OF_5` (Thắng 3/5): Dùng cho chung kết Grand Slam (ít dùng ở phong trào).  
- **Tác động lên App:**
  - Hệ thống tính điểm phải biết khi nào thì **End Match** (Kết thúc trận). Ví dụ `BEST_OF_3` mà tỷ số set là 2-0 thì dừng luôn, không đánh set 3 nữa.  

#### 3. Points to Win (Điểm thắng set)

- **Ý nghĩa:** Xác định **"Cần bao nhiêu điểm để thắng một ván (Set)?"**.  
- **Ví dụ:**
  - Pickleball: Thường là **11** điểm.  
  - Cầu lông: Thường là **21** điểm.  
  - Giải "phủi": Có thể là 15 hoặc 31 điểm.  
- **Tác động lên App:**
  - Đây là mốc để App kích hoạt logic kiểm tra điều kiện thắng (`CheckWinCondition`).  

#### 4. Win by 2 (Luật thắng cách biệt 2 điểm)

- **Ý nghĩa:** Xác định **"Có cần phải thắng hơn đối thủ 2 điểm mới được tính là thắng không?"**.  
- **Logic:**
  - Nếu `ON` (Bật): Tỷ số 11-10 (khi điểm thắng là 11) -> Trận đấu **CHƯA** kết thúc (Deuce). Phải đánh tiếp đến 12-10, hoặc 13-11.  
  - Nếu `OFF` (Tắt): Tỷ số 11-10 -> Kết thúc luôn (Sudden Death ngay tại điểm game).  
- **Tác động lên App:**
  - Vòng lặp `while` trong code tính điểm sẽ không dừng lại nếu hiệu số điểm `< 2`.  

#### 5. Point Cap (Điểm trần / Điểm kịch kim)

- **Ý nghĩa:** Xác định **"Điểm số tối đa tuyệt đối để kết thúc ván đấu, bỏ qua luật Win by 2"**. Dùng để tránh trận đấu kéo dài vô tận gây vỡ lịch giải đấu.  
- **Ví dụ:**
  - Luật Cầu lông: Điểm thắng 21, Cap 30. Nếu hòa 29-29 -> Ai lên **30** trước thắng (không cần cách 2).  
  - Luật Pickleball (Giải ao làng): Điểm thắng 11, Cap 15. Nếu hòa 14-14 -> Ai lên **15** thắng.  
- **Tác động lên App:**
  - Đây là điều kiện "Hard Stop". Code phải check: `IF Score == Cap THEN EndGame()`.  

#### 6. Switch Ends / Change Ends (Đổi sân)

- **Ý nghĩa:** Xác định **"Thời điểm hai đội đổi phần sân cho nhau"** (để công bằng về ánh sáng, hướng gió).  
- **Logic:**
  - *Giữa Set:* Đổi sân khi một bên đạt đến mốc điểm cụ thể (VD: 11 điểm trong set 21, hoặc 8 điểm trong set 15).  
  - *Hết Set:* Đổi sân sau mỗi ván đấu.  
- **Tác động lên App:**
  - Kích hoạt Popup **"ĐỔI SÂN"** trên màn hình trọng tài.  
  - Quan trọng nhất: **Đảo ngược vị trí điểm số** trên màn hình điện thoại (Bên Trái qua Phải và ngược lại) để trọng tài không bị bấm nhầm tay.  

### AC6: CẤU HÌNH MỞ RỘNG & TIỆN ÍCH (EXTENDED SETTINGS)

| Tên trường | Định dạng | Ràng buộc | Logic & Quy tắc xử lý |
| --- | --- | --- | --- |
| **Banner/Pop-up** | Toggle | Không | Bật/Tắt hiển thị Banner quảng cáo hoặc Pop-up khi User vào trang chi tiết sự kiện. |
| **Hình ảnh Banner** | Image | Bắt buộc (nếu bật) | PNG/JPG/JPEG. Dung lượng tối đa 2MB. Hỗ trợ kích thước hiển thị theo tỉ lệ chuẩn Web. |
| **Link CTA** | URL | Bắt buộc (nếu bật) | Đường dẫn dẫn tới trang đích khi User click vào Banner/Pop-up (VD: Link tài trợ, Link đăng ký sớm). |
| **Điều khoản tham gia** | File PDF |  | Upload file PDF chính sách/quy định của giải. Tối đa 10MB. VĐV phải tích xác nhận "Tôi đồng ý" mới được thanh toán. |
| **Điều kiện tham gia** | File PDF |  | Nội dung về sức khỏe, cam kết miễn trừ trách nhiệm. Upload file PDF chính sách/quy định của giải. Tối đa 10MB. VĐV phải tích xác nhận "Tôi đồng ý" mới được thanh toán. |
| **Dịch vụ Bảo hiểm** | Module | Tương lai | **Feature Toggle:** Hiện tại để trạng thái `Coming Soon` hoặc Ẩn. Cấu hình cho phép tích hợp API với bên thứ 3 (Igloo/PVI) để mua bảo hiểm chấn thương trực tuyến etc…. |

### AC6: HOÀN TẤT KHAI BÁO (FINAL PUBLISH)

- **Lưu nháp:** Hệ thống thực hiện lưu nháp ở mỗi bước khai báo khi người dùng ấn lưu.  
- **Xuất bản:** Người dùng ấn "Xuất bản sự kiện" để public sự kiện trên nền tảng 5Ticket và bắt đầu bán vé.  