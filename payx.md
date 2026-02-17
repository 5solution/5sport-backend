<!-- **Pay** -->

<!--  -->

<!-- Tài liệudǎc ta kỹ thuật kết nối **PAYX** -->

**Pay**

![](https://web-api.textin.com/ocr_image/external/87e15d22ce7d7469.jpg)

<!-- 4 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liêu đǎc ta kỹ thuật kết nối **PAYX** -->

# 4. Đặc tả dữ liệu trao đối

# 4.1. Thông tin chung

**Host:**

- Production: https://payment-gateway.payx.com.vn

- Sandbox: https://payment-gateway-sandbox.payx.com.vn

**Securehash:**

| Loai securehash su dung trong API | Mô ta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request                           | Securehash (request): Mỗi api sẽ cócách tạo khác nhau, xem chi tiết trong<br>mô tả:<br> es (e) ee e n o                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Response                          | ecurecia dữ liêu:<br>securehash = Base64(HMACSHA512(secretkey,<br>responseBodyJSON))<br>Buóc 1:Lây Response Body<br>Lây toàn bộ response body dưới dạng chuỗi JSON(raw JSON string). Không parse JSON<br>Không format lai<br>Giữ nguyên như nhận được<br>Buóc 2: Tính HMAC-SHA512<br>Sử dụng thuật toán HMAC-SHA512:<br>- Key:Secret Key được câp khi đǎng ký merchant<br>- Message: Chuỗi JSON response body tù buóc 1<br>Buóc 3: Mã hóa Base64<br>Chuyên đổi kết quả hash từ bước 2 sang chuỗi Base64 (standard<br>encoding).<br>Buóc 4: So sánh kết quả hash với giá trị trong header, néu khóp thì coi là họp lệ. |

# 4.2. API gửi yêu cầu thanh toán

**Method:** POST

<!-- 5 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu đǎc tà kỹ thuât kêt nối **PAYX** -->

curl --location 'https://{HOST}/api/v1/payments'\

--header 'Content-Type: application/json'\

--data '{

"merchantCode": "5bipweb1",

"amount": 1000,

"orderId": "25e5ad59-877d-4625-bb49-4b1a19ac4549",

"description": "SMTP",

"returnUrl": "https://ecom.merchant.com/orders/result",

"callbackUrl": "https://api.ecom.merchant.com/payx/payments/callback",

"paymentMethod": "domesticcard",

"ipAddr": "101.186.196.40",

"createdDate": "2024-09-24T11:32:00Z",

"expireDate": "2024-09-24T12:32:00Z",

"secureHash": "hashed value"

}'

**Request:**

| Tham số                                                           | Mô ta                                                                                                                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- | ----------- | ------------- | ----------- | ------ | ----------- | ---------- |
| merchantCode<br>Type:string                                       | Mã Dối tác được PAYX cung cấp để định danh Đối tác lúc khởi<br>tao giao dich thanh toán                                                                                                                 |
| amount<br>Type:number<br>$\text {gte}=1000$                       | Số tiền thanh toán, tối thiếu 1000 (VNÐ)                                                                                                                                                                |
| orderId<br>Type:string<br>alphanumberic<br>$\text {max_{len}=40}$ | Mã đơn hàngcủa Đối tác, không trùng lặp. Bao gồm chũ và số<br>không quá 40 ký tự.                                                                                                                       |
| paymentMethod<br>Type:<br>string<br>optional                      | Phuong thúc thanh toán tai PAYX:<br>$*$ domesticcard: Giao dich thanh toán qua thè nôi dia \* vacollection: Giao dich thanh toán qua tài khoan<br>thu hộ dinh danh (VietQR)                             |
| displayMode<br>Type:<br>string<br>optional                        | Phưong thúc hiên thị giao diên thanh toán:<br>merchanthosted: Hiên thi thông tin thanh toán tai<br>app/web cua Merchant<br>\* hostedform: Hiên thị thông tin thanh toán tai Web<br>Công thanh toán PAYX |
| description<br>Type:string                                        | Mô tả nội dung thanh toán                                                                                                                                                                               |
| returnUr1<br>Type:string<br>optional                              | - Néu displayMode = merchanthosted: Truyền giá trị rỗng<br>- Néu displayMode = hostedform: Truyền địa chỉ điều hưóngvề trang của Đối tác khi Khách hàng thanh toánxong                                  |
| callbackUr1<br>Type:string                                        | Ðia chi callback về API của Đối tác sau khi giao dich được hoàntât                                                                                                                                      |
| ipAddr<br>Type:string                                             | Ðia chi IP của Khách hàng, dùng đê audit giao dịch trong truònghọp phát sinh nhu câu tra cúu.                                                                                                           |
| createdDate                                                       | Thời điểm tạo giao dịch tại Đối tác. Kiểu dữ liệu Datetime kèm<br>timezone. Format dên đon vi giây.                                                                                                     |
| Type:string<br>format: ISO Datetime                               | Ví du: 2024-09-24T11:32:00Z                                                                                                                                                                             |
| expireDate<br>Type:string<br>format: ISO Datetime                 | Thòi điêm hết hạn cho giao dịch thanh toán tại PAYX. Kiêu dfi<br>liệu Datetime kèm timezone. Format dến don vi giây.<br>Ví du:2024-09-24T12:32:00Z                                                      |
| secureHash<br>Type:string                                         | Chuỗi mã hóa bảo mật dữ liệu giao tiếp theo công thúc sau:<br>securehash = Base64 (HMACSHA512(secretkey, data))<br>_ secretkey: Mã khoá bí mât duợc PAYX cung câp cho<br>$Merhan$_ Data = merchantCode  | amount | orderId | description | <br>returnUrl | callbackUrl | ipAddr | createdDate | expireDate |

<!-- 6 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu dǎc ta kỹ thuật kết nối **PAYX** -->

## 4.2.1. Truòng hop $displayMode=hosted\_form$

Merchant chuyên hưóng tói URL của $PAYXde$ mở ra giao diên thanh toán.

## 4.2.2. Truòng hop $displayMode=merchant\_hoste$ d

### Response:

Header:X-Secure-Hash: 'this is secure hash'

Body:

<!-- 7 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu đǎc tả kỹ thuật kết nối **PAYX** -->

{

"code": 0,

"message": "SUCCESS",

"data": {

"paymentid": "d45hu667mhqs73dr609g",

"amount": 300000,

"expireddate": "2025-11-05T10:25:29Z",

"description": "Đon hàng #GS-1933775822486 tù Cua hàng Gemini",

"methoddata": {

"paymentmethod": "vacollection",

"accountnumber": "963PYX999000001603",

"accountname": "CÔNG TY CO PHAN 5BIB",

"bankshortname": "BIDV",

"bankfullname": "Ngân hàng TMCP Đâu tu và Phát triên Việt Nam",

"transferdescription": "Don hang #GS-1933775822486 tu Cua hang

Gemini",

"vietqrcontent":

"00020101021238620010A000000727013200069704180118963PYX9990000016030208QRIBFT TA530370454063000005802VN62490845Don hang #GS-1933775822486 tu Cua hang Gemini6304749D"

}

}

**Mô ta:**

| Tham sô                                                                            | Mô ta                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| message<br>Type:string                                                             | SUCCESS                                          |
| data.paymentid<br>Type:string                                                      | Mã giao dich cúa PAYX                            |
| data.amount<br>Type:string                                                         | Sô tiền giao dich                                |
| data.expireddate<br>Type:string<br>format: ISO-Datetime                            | Thòi điêm hết han thanh toán                     |
| data.description<br>Type:string                                                    | Mô tả nội dung thanh toán                        |
| methoddata.paymentmethod<br>Type:string<br>methoddata.accountnumber<br>Type:string | Phuong thúc thanh toán<br>Số tài khoản nhận tiền |
| methoddata.accountname<br>Type:string<br>methoddata.bankshortname<br>Type:string   | Tên tài khoản nhận tiền<br>Tên ngân hàng rút gọn |
| methoddata.bankfullname<br>Type:string                                             | Tên ngân hàng đầy đủ                             |
| methoddata.transferdescription Type:string                                         | Nội dung chuyên khoản để hệ thống tự đối soát    |
| methoddata.vietqrcontent<br>Type:string                                            | Chuỗi ký tự dùng để sinh hình ảnh QRCode         |

<!-- 8 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu đǎc tà kỹ thuât kêt nối **PAYX** -->

Hưóng dẫn Merchant sử dung:

·Merchant tự hiên thị thông tin chuyên khoản trên UI.

·Merchant tu render QR từ vietqrcontent.

·Khi ngưòi dùng thanh toán xong, Merchant nhân Webhook từ PAYX hoặc Merchant goi API Lây trang thái giao dịch thanh toán định kỳ để lây trang thái giao dịch mới nhất trong trưòng họp PAYX gửi Webhook cho Merchant không thành công

# 4.3. Ðiều hưóng về trang Ðôi tác

Áp dung cho displayMode = hostedform, sau khi Khách hàng giao dịch hoàn tất, PAYX sẽ điều hướng Khách hàng về website của Merchant theo đia chi **redirectUrl.**

<!-- 9 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu đǎc tả kỹ thuật kết nối **PAYX** -->

Ðối tác gửi sang kèm các tham số sau:

| Tham sô                                                       | Mô ta                                                                                                                                                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| merchantcode<br>Type:string                                   | Mã đôi tác                                                                                                                                                                                                                                  |
| amount<br>Type:number                                         | Số tiền thanh toán                                                                                                                                                                                                                          |
| orderId<br>Type:string                                        | Mã hóa đon phía đối tác                                                                                                                                                                                                                     |
| paymentmethod<br>Type:string                                  | Phuong thúc thanh toán                                                                                                                                                                                                                      |
| createddate<br>Type:string<br>format: ISO-Datetime            | Ngày tạo hóa đon ở đôi tác                                                                                                                                                                                                                  |
| expiredate<br>Type:string<br>format: ISO-Datetime             | Ngày hét han hóa đon                                                                                                                                                                                                                        |
| status<br>Type:string<br>errorcode<br>Type:string<br>optional | Trang thái giao dich thanh toán tai PAYX<br>_ pending: Giao dich dang chò xu lý<br>_ success: Giao dich thành công<br>_ failed: Giao dich thât bai<br>_ cancelled: Giao bi huy bòi Khách hàng<br>\* expired: Giao dich dã hêt han<br>Mã lỗi |
| errormessage<br>Type:string<br>optional                       | Chi tiết lỗi                                                                                                                                                                                                                                |

<!-- 10 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu đǎc tả kỹ thuật kết nối **PAYX** -->

# 4.4.IPN callback cho Dôi tác

Sau khi giao dịch hoàn tất, PAYX sẽ callback kết quả giao dịch để Đối tác xử lý trả hàng theo callbackUrl được cung cấp lúc khởi tạo giao dịch.

curl --location 'https:\*\*//{MERCHANTHOST}/{endpoint}'\*\*

--header 'Content-Type: application/json'\

--data '{

"merchantCode": "5bipweb1",

"orderId": "ssss",

"amount": 1000,

"paymentMethod": "domesticcard",

"createdDate": "2024-09-25T10:11:12Z",

"expireDate": "2024-09-25T10:11:12Z",

"status": "success",

"errorCode":"",

"errorMessage": "",

"secureHash": "this-is-secure-hash"

}'

**Method: POST**

| Tham sô                             | Mô ta                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- | ------------- | --------------- | ---------- | ------ | --------- | ----------------------------------------------------------------------------------------------- |
| merchantCode                        | Mã đôi tác                                                                                                                                                                                                                                                                                                                                                                           |
| Type:string                         |                                                                                                                                                                                                                                                                                                                                                                                      |
| amount                              | Sô tiền thanh toán                                                                                                                                                                                                                                                                                                                                                                   |
| Type:number                         | Sô tiền thanh toán                                                                                                                                                                                                                                                                                                                                                                   |
| orderId                             | Mã hóa đơn phía đối tác                                                                                                                                                                                                                                                                                                                                                              |
| Type:string                         |                                                                                                                                                                                                                                                                                                                                                                                      |
| paymentMethod                       | Phuong thúc thanh toán                                                                                                                                                                                                                                                                                                                                                               |
| Type:string                         |                                                                                                                                                                                                                                                                                                                                                                                      |
| createdDate                         | Ngày tao hóa đơn ở đối tác                                                                                                                                                                                                                                                                                                                                                           |
| Type:string<br>format: ISO-Datetime |                                                                                                                                                                                                                                                                                                                                                                                      |
| expireDate                          | Ngày hết han hóa đon                                                                                                                                                                                                                                                                                                                                                                 |
| Type:string                         |                                                                                                                                                                                                                                                                                                                                                                                      |
| format: ISO-Datetime                |                                                                                                                                                                                                                                                                                                                                                                                      |
| status<br>Type:string               | Trang thái giao dich thanh toán tai PAYX<br>_ pending: Giao dich dang chò xù $1y$_ success: Giao dich thành công<br>_ failed: Giao dich thât bai<br>_ cancelled:Giao bi huy boi Khách hàng<br>\* expired: Giao dich dã hêt han<br>Ðối với giao dịch tại trang thái Pending, Merchant có thê gọi API Lây lai trang thái giao dịch sau đó $\text {de}$được cập nhật trang thái<br>mói. |
| errorCode                           | Mã lỗi                                                                                                                                                                                                                                                                                                                                                                               |
| Type:string<br>optional             | Mã lỗi                                                                                                                                                                                                                                                                                                                                                                               |
| errorMessage                        | Chi tiêt lỗi                                                                                                                                                                                                                                                                                                                                                                         |
| Type:string<br>optional             |                                                                                                                                                                                                                                                                                                                                                                                      |
| secureHash<br>Type:string           | Chuỗi mã hóa<br>Data = merchantCode                                                                                                                                                                                                                                                                                                                                                  | amount | orderId | paymentMethod | <br>createdDate | expireDate | status | errorCode | errorMessage<br>Trong truòng họp thành công, errorCodde và<br>errorMessage sẽ bằng rông ( $""$) |

<!-- 11 -->

<!-- Pay -->

<!-- Tài liệu đǎc ta kỹ thuật kết nối **PAYX** -->

# 4.5. API Lây trang thái giao dich thanh toán

**Method: POST**

curl --location 'https://{HOST}/api/v1/payments/inquiry'\

--headder 'Content-Type: application/json'\

--data'{

"merchantCode": "5bibweb1",

"orderId": "1753415137",

"timestamp": "2025-07-25T03:45:01Z",

"secureHash" :

"3xm+ffGg77Du8ykaUSCYLunQQz9UUtbKiTBdJWi5V9doHDELuEUP4L+1N7BCqGH7f4n4ek9xXYhvMDTnvQ $PoCA=="$

$$\}'$$

<!-- 12 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu đǎc tả kỹ thuật kết nối **PAYX** -->

**Request:**

| Tham số                             | Mô ta                                                   |
| ----------------------------------- | ------------------------------------------------------- | ------- | --------- |
| merchantCode                        | Mã dôi tác                                              |
| Type:string                         |                                                         |
| orderId                             | Mã hóa đon phía đối tác                                 |
| Type:string                         |                                                         |
| timestamp                           | Thòi điêm truy vân kết qua, ví du: 2025-07-25T03:45:01Z |
| Type:string<br>format: ISO-Datetime |                                                         |
| secureHash                          | Chuỗi mã hóa                                            |
| Type:string                         | Data = merchantCode                                     | orderId | timestamp |

**Response:**

Header:X-Secure-Hash: 'this is secure hash'

Body:

{

"merchantCode": "5bibweb1",

"amount":10000,

"orderId": "1753415048",

"paymentMethod": "vacollection",

"createdDate": "2025-07-25T03:44:07Z",

"expireDate": "2025-07-25T04:14:08Z",

"status": "success",

"errorCode": "",

"errorMessage": ""

}

Mô ta:

| Tham sô                                           | Mô ta                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| merchantCode                                      | Mã đôi tác                                                                                                                                                                                                                                                                                                                                                                               |
| Type:string                                       |                                                                                                                                                                                                                                                                                                                                                                                          |
| amount                                            | Sô tiền thanh toán                                                                                                                                                                                                                                                                                                                                                                       |
| Type:number                                       |                                                                                                                                                                                                                                                                                                                                                                                          |
| orderId                                           | Mã hóa đon phía đối tác                                                                                                                                                                                                                                                                                                                                                                  |
| Type:string                                       |                                                                                                                                                                                                                                                                                                                                                                                          |
| paymentMethod<br>Type:string                      | Phuong thúc thanh toán                                                                                                                                                                                                                                                                                                                                                                   |
| createdDate                                       | Ngày tạo hóa đon ở đối tác                                                                                                                                                                                                                                                                                                                                                               |
| Type:string<br>format: ISO-Datetime               |                                                                                                                                                                                                                                                                                                                                                                                          |
| expireDate<br>Type:string<br>format: ISO-Datetime | Ngày hết han hóa đon                                                                                                                                                                                                                                                                                                                                                                     |
| status<br>Type:string                             | Trang thái giao dich thanh toán tai PAYX<br>_ pending: Giao dich dang chò xu lý<br>_ success: Giao dich thành công<br>_ failed: Giao dich thât bai<br>_ cancelled: Giao bi huy bòi Khách hàng<br>\* expired: Giao dich dã hêt han<br>Ðối với giao dịch tại trạng thái Pending, Merchant có thê tiếp tuc gọi API Lây lại trạng thái giao dịch sau đó để đluợc cập nhật<br>trang thái mói. |
| errorCode<br>Type:string<br>optional              | Mã lỗi                                                                                                                                                                                                                                                                                                                                                                                   |
| errorMessage                                      | Chi tiêt lỗi                                                                                                                                                                                                                                                                                                                                                                             |
| Type:string<br>optional                           |                                                                                                                                                                                                                                                                                                                                                                                          |

<!-- 13 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu dǎc ta kỹ thuật kết nối **PAYX** -->

<!-- 14 -->

<!-- **Pay** -->

<!--  -->

<!-- Tài liệu đặc tả kỹ thuật kết nối **PAYX** -->

**XIN CAM** ON!

<!-- 15 -->
