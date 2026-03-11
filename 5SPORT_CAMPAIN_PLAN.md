# 5SPORT Campaign Module - Implementation Plan

## Tổng quan

Module **Campaign (Chiến dịch Gom vé)** cho phép Admin/Trưởng nhóm tạo chiến dịch gom vé, quản lý sản phẩm (vé theo cự ly), cấu hình giá theo giai đoạn, áp dụng giảm giá, và quản lý đơn hàng tập trung.

> **Database**: Module này dùng **MongoDB** (Mongoose) độc lập với PostgreSQL của hệ thống chính. Lý do: schema linh hoạt (custom fields, athlete_data, payment_config), document embedding phù hợp với order/item pattern, không cần join phức tạp.

---

## MongoDB Setup

### 1. Cài đặt dependencies

```bash
npm install @nestjs/mongoose mongoose
npm install -D @types/mongoose
```

### 2. Cấu hình kết nối — `src/libs/mongoose.config.ts`

```typescript
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongooseConfig = (): MongooseModuleOptions => ({
  uri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME ?? '5sport_campaign',
});
```

### 3. Biến môi trường `.env`

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=5sport_campaign
```

### 4. Đăng ký trong `AppModule`

```typescript
import { MongooseModule } from '@nestjs/mongoose';
import { mongooseConfig } from './libs/mongoose.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: mongooseConfig,
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### 5. Khởi tạo collection + indexes (chạy 1 lần)

Mongoose tự tạo collection khi insert document đầu tiên. Indexes được khai báo trực tiếp trong Schema decorator (`@Schema`, `@Prop`).

---

## MongoDB Collections (Mongoose Schemas)

### Quy ước
- `_id`: ObjectId (tự sinh bởi MongoDB)
- `createdAt` / `updatedAt`: tự sinh bởi `{ timestamps: true }`
- FK sang PostgreSQL lưu dưới dạng `string` (UUID)

---

## Database Schema

### 1. Collection `campaigns`

| Field               | Mongoose Type            | Required | Default    | Note                                        |
|---------------------|--------------------------|----------|------------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |            |                                              |
| creatorId           | String                   | yes      |            | UUID FK → PostgreSQL `users.id`              |
| name                | String                   | yes      |            | Tên chiến dịch, maxlength 256                |
| slug                | String (unique, index)   | yes      |            | Slug URL                                     |
| description         | String                   | no       |            | Mô tả chiến dịch                             |
| bannerUrl           | String                   | no       |            | Ảnh banner                                   |
| startTime           | Date                     | yes      |            | Thời gian bắt đầu gom vé                     |
| endTime             | Date                     | yes      |            | Thời gian kết thúc gom vé                    |
| status              | String (enum)            | yes      | `'DRAFT'`  | DRAFT, ACTIVE, CLOSED, CANCELLED             |
| paymentConfig       | Mixed (object)           | no       |            | STK, provider, account name...               |
| createdAt           | Date                     | auto     |            | timestamps: true                             |
| updatedAt           | Date                     | auto     |            | timestamps: true                             |

**Indexes**: `slug` (unique), `creatorId`, `status`

---

### 2. Collection `campaignproducts`

| Field               | Mongoose Type            | Required | Default | Note                                        |
|---------------------|--------------------------|----------|---------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |         |                                              |
| campaignId          | ObjectId (ref Campaign)  | yes      |         |                                              |
| name                | String                   | yes      |         | Tên sản phẩm (VD: "Vé 21km")                |
| description         | String                   | no       |         |                                              |
| originalPrice       | Number                   | yes      |         | Giá gốc                                     |
| totalQuantity       | Number                   | yes      |         | Tổng số lượng                                |
| maxPerOrder         | Number                   | yes      | `10`    | Số lượng tối đa mỗi đơn                     |
| sortOrder           | Number                   | yes      | `0`     |                                              |
| isVisible           | Boolean                  | yes      | `true`  |                                              |
| createdAt           | Date                     | auto     |         |                                              |
| updatedAt           | Date                     | auto     |         |                                              |

**Indexes**: `campaignId`

---

### 3. Collection `campaignpricingphases`

| Field               | Mongoose Type            | Required | Default | Note                                        |
|---------------------|--------------------------|----------|---------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |         |                                              |
| productId           | ObjectId (ref CampaignProduct) | yes |         |                                              |
| name                | String                   | yes      |         | Early Bird, Regular, Late...                 |
| price               | Number                   | yes      |         | Giá bán trong giai đoạn                      |
| startTime           | Date                     | yes      |         |                                              |
| endTime             | Date                     | yes      |         |                                              |
| sortOrder           | Number                   | yes      | `0`     |                                              |
| createdAt           | Date                     | auto     |         |                                              |
| updatedAt           | Date                     | auto     |         |                                              |

**Indexes**: `productId`

---

### 4. Collection `campaigndiscounts`

| Field               | Mongoose Type            | Required | Default | Note                                        |
|---------------------|--------------------------|----------|---------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |         |                                              |
| campaignId          | ObjectId (ref Campaign)  | yes      |         |                                              |
| code                | String (unique, index)   | yes      |         | Mã giảm giá                                 |
| discountType        | String (enum)            | yes      |         | PERCENTAGE, FIXED_AMOUNT                     |
| discountValue       | Number                   | yes      |         | Giá trị giảm                                |
| maxUses             | Number                   | no       |         | null = unlimited                             |
| usedCount           | Number                   | yes      | `0`     |                                              |
| minOrderAmount      | Number                   | no       |         | Đơn hàng tối thiểu để áp dụng               |
| startTime           | Date                     | yes      |         |                                              |
| endTime             | Date                     | yes      |         |                                              |
| isActive            | Boolean                  | yes      | `true`  |                                              |
| createdAt           | Date                     | auto     |         |                                              |
| updatedAt           | Date                     | auto     |         |                                              |

**Indexes**: `code` (unique), `campaignId`, `isActive`

---

### 5. Collection `campaigncustomfields`

| Field               | Mongoose Type            | Required | Default | Note                                        |
|---------------------|--------------------------|----------|---------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |         |                                              |
| campaignId          | ObjectId (ref Campaign)  | yes      |         |                                              |
| label               | String                   | yes      |         | Label hiển thị                               |
| fieldName           | String                   | yes      |         | Key lưu dữ liệu                             |
| fieldType           | String (enum)            | yes      |         | TEXT, SELECT, FILE, DATE, NUMBER, CHECKBOX   |
| options             | [String]                 | no       |         | Danh sách option (cho SELECT)                |
| dbMapping           | String                   | no       |         | Map sang trường DB chuẩn                     |
| isRequired          | Boolean                  | yes      | `false` |                                              |
| sortOrder           | Number                   | yes      | `0`     |                                              |
| createdAt           | Date                     | auto     |         |                                              |
| updatedAt           | Date                     | auto     |         |                                              |

**Indexes**: `campaignId`

---

### 6. Collection `campaignorders`

| Field               | Mongoose Type            | Required | Default    | Note                                        |
|---------------------|--------------------------|----------|------------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |            |                                              |
| campaignId          | ObjectId (ref Campaign)  | yes      |            |                                              |
| orderCode           | String (unique, index)   | yes      |            | Mã đơn hàng tự sinh                         |
| lastName            | String                   | yes      |            | Họ và tên đệm người mua                      |
| firstName           | String                   | yes      |            | Tên người mua                                |
| email               | String                   | no       |            |                                              |
| phoneNumber         | String                   | yes      |            |                                              |
| totalAmount         | Number                   | yes      |            | Tổng tiền trước giảm                         |
| discountAmount      | Number                   | yes      | `0`        | Số tiền được giảm                            |
| finalAmount         | Number                   | yes      |            | Tiền thanh toán thực tế                      |
| discountId          | ObjectId (ref CampaignDiscount) | no |         | Mã giảm giá đã dùng                         |
| paymentStatus       | String (enum)            | yes      | `'PENDING'`| PENDING, PAID, FAILED, REFUNDED             |
| paymentId           | String                   | no       |            | UUID FK → PostgreSQL `payments.id`           |
| items               | [OrderItem (embedded)]   | yes      |            | Embed danh sách item                         |
| orderDate           | Date                     | yes      | `Date.now` |                                              |
| createdAt           | Date                     | auto     |            |                                              |
| updatedAt           | Date                     | auto     |            |                                              |

**Indexes**: `orderCode` (unique), `campaignId`, `paymentStatus`, `orderDate`

#### Embedded: `OrderItem`

| Field               | Mongoose Type            | Required | Default | Note                                        |
|---------------------|--------------------------|----------|---------|----------------------------------------------|
| productId           | ObjectId (ref CampaignProduct) | yes |         |                                              |
| productName         | String                   | yes      |         | Snapshot tên sản phẩm tại thời điểm mua     |
| unitPrice           | Number                   | yes      |         | Giá tại thời điểm mua                       |
| quantity            | Number                   | yes      | `1`     |                                              |
| athleteData         | Mixed (object)           | yes      |         | Thông tin VĐV (custom fields data)           |

> `items` được **embed** vào `CampaignOrder` (không tạo collection riêng) vì luôn được đọc cùng đơn hàng.

---

## Enums

```typescript
// campaign-status.enum.ts
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

// discount-type.enum.ts
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

// campaign-order-status.enum.ts
export enum CampaignOrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// campaign-field-type.enum.ts
export enum CampaignFieldType {
  TEXT = 'TEXT',
  SELECT = 'SELECT',
  FILE = 'FILE',
  DATE = 'DATE',
  NUMBER = 'NUMBER',
  CHECKBOX = 'CHECKBOX',
}
```

## Mongoose Schema Pattern

```typescript
// Ví dụ: campaign.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CampaignStatus } from '../enums/campaign-status.enum';

export type CampaignDocument = HydratedDocument<Campaign>;

@Schema({ timestamps: true, collection: 'campaigns' })
export class Campaign {
  @Prop({ required: true })
  creatorId: string;

  @Prop({ required: true, maxlength: 256 })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  bannerUrl: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: String, enum: CampaignStatus, default: CampaignStatus.DRAFT, index: true })
  status: CampaignStatus;

  @Prop({ type: Object })
  paymentConfig: Record<string, any>;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
```

---

## API Endpoints

### Campaign CRUD (Admin)

| Method | Endpoint                          | Auth         | Description                          |
|--------|-----------------------------------|--------------|--------------------------------------|
| POST   | `/campaigns`                      | Admin/Org    | Tạo chiến dịch                       |
| GET    | `/campaigns`                      | Admin/Org    | Danh sách chiến dịch                 |
| GET    | `/campaigns/:id`                  | Admin/Org    | Chi tiết chiến dịch                  |
| PATCH  | `/campaigns/:id`                  | Admin/Org    | Cập nhật chiến dịch                  |
| DELETE | `/campaigns/:id`                  | Admin        | Xóa chiến dịch (chỉ DRAFT)          |
| PATCH  | `/campaigns/:id/status`           | Admin/Org    | Đổi trạng thái (activate/close)      |

### Campaign Products (Vé/Cự ly)

| Method | Endpoint                                     | Auth         | Description                     |
|--------|----------------------------------------------|--------------|---------------------------------|
| POST   | `/campaigns/:campaignId/products`            | Admin/Org    | Tạo sản phẩm                    |
| GET    | `/campaigns/:campaignId/products`            | Public       | Danh sách sản phẩm              |
| PATCH  | `/campaigns/:campaignId/products/:id`        | Admin/Org    | Cập nhật sản phẩm               |
| DELETE | `/campaigns/:campaignId/products/:id`        | Admin/Org    | Xóa sản phẩm                    |

### Pricing Phases (Giai đoạn giá)

| Method | Endpoint                                                     | Auth         | Description           |
|--------|--------------------------------------------------------------|--------------|-----------------------|
| POST   | `/campaigns/:campaignId/products/:productId/phases`          | Admin/Org    | Tạo giai đoạn giá     |
| GET    | `/campaigns/:campaignId/products/:productId/phases`          | Public       | Danh sách giai đoạn    |
| PATCH  | `/campaigns/:campaignId/products/:productId/phases/:id`      | Admin/Org    | Cập nhật               |
| DELETE | `/campaigns/:campaignId/products/:productId/phases/:id`      | Admin/Org    | Xóa                   |

### Discounts (Giảm giá)

| Method | Endpoint                                      | Auth         | Description                     |
|--------|-----------------------------------------------|--------------|---------------------------------|
| POST   | `/campaigns/:campaignId/discounts`            | Admin/Org    | Tạo mã giảm giá                 |
| GET    | `/campaigns/:campaignId/discounts`            | Admin/Org    | Danh sách mã giảm giá           |
| PATCH  | `/campaigns/:campaignId/discounts/:id`        | Admin/Org    | Cập nhật                        |
| DELETE | `/campaigns/:campaignId/discounts/:id`        | Admin/Org    | Xóa                            |
| POST   | `/campaigns/:campaignId/discounts/validate`   | Public       | Kiểm tra mã giảm giá            |

### Custom Fields (Form Data)

| Method | Endpoint                                         | Auth         | Description                  |
|--------|--------------------------------------------------|--------------|------------------------------|
| POST   | `/campaigns/:campaignId/custom-fields`           | Admin/Org    | Tạo trường tùy chỉnh         |
| GET    | `/campaigns/:campaignId/custom-fields`           | Public       | Danh sách trường              |
| PATCH  | `/campaigns/:campaignId/custom-fields/:id`       | Admin/Org    | Cập nhật                     |
| DELETE | `/campaigns/:campaignId/custom-fields/:id`       | Admin/Org    | Xóa                         |

### Orders (Đơn hàng)

| Method | Endpoint                                           | Auth         | Description                              |
|--------|-----------------------------------------------------|--------------|------------------------------------------|
| POST   | `/campaigns/:campaignId/orders`                    | Public       | Tạo đơn hàng (mua vé)                    |
| GET    | `/campaigns/:campaignId/orders`                    | Admin/Org    | Danh sách đơn hàng (filter, pagination)  |
| GET    | `/campaigns/:campaignId/orders/:id`                | Admin/Org    | Chi tiết đơn hàng                        |
| GET    | `/campaigns/:campaignId/orders/export`             | Admin/Org    | Export Excel (format 5BIB/ActiUp)        |

### Public (Trang mua vé)

| Method | Endpoint                        | Auth   | Description                                |
|--------|---------------------------------|--------|--------------------------------------------|
| GET    | `/campaigns/public/:slug`       | Public | Lấy thông tin chiến dịch qua slug          |

---

## File Structure

```
src/
├── libs/
│   └── mongoose.config.ts              ← Mongoose connection config
│
└── modules/campaign/
    ├── campaign.module.ts              ← MongooseModule.forFeature([...schemas])
    ├── campaign.controller.ts
    ├── campaign.service.ts
    ├── schemas/                        ← Mongoose schemas (thay cho entities/)
    │   ├── index.ts
    │   ├── campaign.schema.ts
    │   ├── campaign-product.schema.ts
    │   ├── campaign-pricing-phase.schema.ts
    │   ├── campaign-discount.schema.ts
    │   ├── campaign-custom-field.schema.ts
    │   └── campaign-order.schema.ts    ← embed OrderItem bên trong
    ├── enums/
    │   ├── index.ts
    │   ├── campaign-status.enum.ts
    │   ├── campaign-field-type.enum.ts
    │   ├── discount-type.enum.ts
    │   └── campaign-order-status.enum.ts
    ├── dto/
    │   ├── create-campaign.dto.ts
    │   ├── update-campaign.dto.ts
    │   ├── create-campaign-product.dto.ts
    │   ├── update-campaign-product.dto.ts
    │   ├── create-pricing-phase.dto.ts
    │   ├── update-pricing-phase.dto.ts
    │   ├── create-discount.dto.ts
    │   ├── update-discount.dto.ts
    │   ├── create-campaign-custom-field.dto.ts
    │   ├── create-order.dto.ts
    │   ├── order-query.dto.ts
    │   └── validate-discount.dto.ts
    ├── campaign-product.controller.ts
    ├── campaign-product.service.ts
    ├── campaign-discount.controller.ts
    ├── campaign-discount.service.ts
    ├── campaign-order.controller.ts
    ├── campaign-order.service.ts
    └── campaign-export.service.ts
```

---

## Implementation Phases

### Phase 1: MongoDB Init + Core Campaign

**Setup:**
- [ ] `npm install @nestjs/mongoose mongoose`
- [ ] Tạo `src/libs/mongoose.config.ts`
- [ ] Thêm `MONGODB_URI` và `MONGODB_DB_NAME` vào `.env`
- [ ] Đăng ký `MongooseModule.forRootAsync` trong `AppModule`

**Core:**
- [ ] Tạo enums (`CampaignStatus`, `DiscountType`, `CampaignOrderStatus`, `CampaignFieldType`)
- [ ] Tạo Mongoose schemas (`Campaign`, `CampaignProduct`, `CampaignPricingPhase`)
- [ ] Tạo DTOs cho Campaign + Product + PricingPhase
- [ ] Implement `CampaignService` (CRUD + status management)
- [ ] Implement `CampaignProductService` (CRUD + pricing phase management)
- [ ] Đăng ký schemas trong `CampaignModule` với `MongooseModule.forFeature`
- [ ] Implement controllers

### Phase 2: Discount Engine
- [ ] Tạo entity `CampaignDiscount`
- [ ] Tạo DTOs
- [ ] Implement `CampaignDiscountService` (CRUD + validate logic)
- [ ] Logic: kiểm tra thời gian, số lần dùng, đơn hàng tối thiểu
- [ ] API validate mã giảm giá

### Phase 3: Custom Fields (Form Data)
- [ ] Tạo entity `CampaignCustomField`
- [ ] Tạo DTOs
- [ ] Implement CRUD (tận dụng pattern từ `EventCustomField`)
- [ ] API public lấy danh sách fields cho form đăng ký

### Phase 4: Orders (Đơn hàng)
- [ ] Tạo entities (`CampaignOrder`, `CampaignOrderItem`)
- [ ] Tạo DTOs (create order, query filters)
- [ ] Implement `CampaignOrderService`:
  - Tạo đơn hàng + tính giá theo phase hiện tại
  - Áp dụng discount code
  - Tích hợp payment module (gọi `PaymentsService`)
  - Gộp thông tin người mua + VĐV trên một dòng
- [ ] Implement query filters (trạng thái, cự ly, ngày đặt)
- [ ] Webhook callback cập nhật `payment_status`

### Phase 5: Export + Tích hợp
- [ ] Implement `CampaignExportService`:
  - Export Excel format chuẩn 5BIB/ActiUp
  - Bộ lọc theo trạng thái, cự ly, ngày
- [ ] API public page (`/campaigns/public/:slug`)
- [ ] Cấu hình thanh toán theo chiến dịch (STK cá nhân / công ty)

### Phase 6: Payment Config
- [ ] Cấu hình payment provider per campaign (Casso/Seapay)
- [ ] Hỗ trợ STK cá nhân "Trưởng nhóm" hoặc tài khoản công ty
- [ ] Lưu config vào `campaign.payment_config` (JSONB)

---

## Entity Relationships

```
Campaign (1) ──── (N) CampaignProduct
    │                      │
    │                      └── (N) CampaignPricingPhase
    │
    ├── (N) CampaignDiscount
    │
    ├── (N) CampaignCustomField
    │
    └── (N) CampaignOrder
                │
                └── (N) CampaignOrderItem ──── (1) CampaignProduct

Campaign (N) ──── (1) User (creator)
```

---

## Key Business Logic

### Tính giá bán hiện tại
```
1. Lấy danh sách PricingPhases của product, sort theo start_time
2. Tìm phase mà now() nằm trong [start_time, end_time]
3. Nếu có → dùng price của phase đó
4. Nếu không → dùng original_price của product
```

### Áp dụng Discount
```
1. Kiểm tra code tồn tại + is_active + thời gian hợp lệ
2. Kiểm tra used_count < max_uses (nếu có giới hạn)
3. Kiểm tra total_amount >= min_order_amount (nếu có)
4. Tính discount_amount:
   - PERCENTAGE: total_amount * discount_value / 100
   - FIXED_AMOUNT: discount_value
5. final_amount = total_amount - discount_amount
6. Increment used_count khi order PAID
```

### Export Excel
```
Columns: Mã đơn | Người mua | SĐT | Email | Cự ly | Tên VĐV | BIB Name
         | Size áo | CMND | CLB | Trạng thái TT | Ngày đặt | Số tiền
Format: Chuẩn 5BIB/ActiUp để import ngược
```


the order of campain there are have field
- Họ và tên đệm
- name
- email 
- phoneNumber
array thông tin người chạy: 
- họ và tên đệm
- Name
- phoneNumber
- location
- national
- provinceCode (get FROM api province)
- Date Of birth 
- sizeShirt
- Club
- Name in Bib
- medicalInformationPhoneNumber
- medicalInformationName
- medicalInformation
- typeOfMedicine
- bloodType