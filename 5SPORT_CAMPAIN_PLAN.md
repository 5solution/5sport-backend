# 5SPORT Campaign Module - Implementation Plan

## Tổng quan

Module **Campaign (Chiến dịch Gom vé)** cho phép Admin/Organizer tạo chiến dịch gom vé, quản lý cự ly và giá trực tiếp trên campaign, áp dụng giảm giá, quản lý custom fields cho form đăng ký, và quản lý đơn hàng tập trung.

> **Database**: Module này dùng **MongoDB** (Mongoose) độc lập với PostgreSQL của hệ thống chính. Lý do: schema linh hoạt (custom fields, athlete_data, payment_config), document embedding phù hợp với order/athlete pattern, không cần join phức tạp.

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
| distances           | Array of {distance, price} | no    | `[]`       | Danh sách cự ly và giá (embedded)            |
| groupName           | String                   | no       |            | Tên nhóm                                    |
| groupLeader         | String                   | no       |            | Trưởng nhóm                                 |
| zaloGroupUrl        | String                   | no       |            | Link nhóm Zalo                              |
| hotline             | String                   | no       |            | Hotline liên hệ                             |
| regulationsUrl      | String                   | no       |            | Link điều lệ giải                           |
| fanpageUrl          | String                   | no       |            | Link fanpage                                |
| paymentConfig       | Mixed (object)           | no       |            | STK, provider, account name...               |
| createdAt           | Date                     | auto     |            | timestamps: true                             |
| updatedAt           | Date                     | auto     |            | timestamps: true                             |

**Embedded: `distances` item**

| Field    | Type   | Note                        |
|----------|--------|-----------------------------|
| distance | String | Cự ly (VD: "5km", "21km")   |
| price    | Number | Giá (VND)                   |

**Indexes**: `slug` (unique), `creatorId`, `status`

> **Lưu ý**: Không sử dụng collection `CampaignProduct` và `CampaignPricingPhase` riêng biệt. Thay vào đó, danh sách cự ly và giá được embed trực tiếp vào Campaign document dưới field `distances`.

---

### 2. Collection `campaigndiscounts`

| Field               | Mongoose Type            | Required | Default | Note                                        |
|---------------------|--------------------------|----------|---------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |         |                                              |
| campaignId          | ObjectId (ref Campaign)  | yes      |         |                                              |
| code                | String (unique, index)   | yes      |         | Mã giảm giá (uppercase)                     |
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

### 3. Collection `campaigncustomfields`

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

### 4. Collection `campaignorders`

| Field               | Mongoose Type            | Required | Default    | Note                                        |
|---------------------|--------------------------|----------|------------|----------------------------------------------|
| _id                 | ObjectId                 | auto     |            |                                              |
| campaignId          | ObjectId (ref Campaign)  | yes      |            |                                              |
| orderCode           | String (unique, index)   | yes      |            | Mã đơn hàng tự sinh (ORD-{ts}-{rand})       |
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
| athletes            | [AthleteInfo (embedded)] | yes      |            | Embed danh sách VĐV                         |
| orderDate           | Date                     | yes      | `Date.now` |                                              |
| createdAt           | Date                     | auto     |            |                                              |
| updatedAt           | Date                     | auto     |            |                                              |

**Indexes**: `orderCode` (unique), `campaignId`, `paymentStatus`, `orderDate`

#### Embedded: `AthleteInfo`

| Field                          | Mongoose Type              | Required | Note                                       |
|--------------------------------|----------------------------|----------|--------------------------------------------|
| distance                       | String                     | yes      | Cự ly đăng ký (VD: "5km")                  |
| unitPrice                      | Number                     | yes      | Giá tại thời điểm đặt (tính từ campaign.distances) |
| lastName                       | String                     | yes      | Họ và tên đệm VĐV                         |
| firstName                      | String                     | yes      | Tên VĐV                                   |
| phoneNumber                    | String                     | yes      | SĐT VĐV                                  |
| location                       | String                     | no       | Địa chỉ                                   |
| national                       | String                     | no       | Quốc tịch                                 |
| provinceCode                   | String                     | no       | Mã tỉnh/thành (lấy từ API province)       |
| dateOfBirth                    | Date                       | no       | Ngày sinh                                 |
| sizeShirt                      | String (enum: SizeShirt)   | no       | Size áo (XS, S, M, L, XL, XXL)            |
| club                           | String                     | no       | Câu lạc bộ                                |
| nameInBib                      | String                     | no       | Tên trên BIB                              |
| medicalInformationPhoneNumber  | String                     | no       | SĐT người liên hệ y tế                   |
| medicalInformationName         | String                     | no       | Tên người liên hệ y tế                    |
| medicalInformation             | String                     | no       | Thông tin y tế                             |
| typeOfMedicine                 | String                     | no       | Loại thuốc đang dùng                      |
| bloodType                      | String                     | no       | Nhóm máu                                  |

> `athletes` được **embed** vào `CampaignOrder` (không tạo collection riêng) vì luôn được đọc cùng đơn hàng.

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

// size-shirt.enum.ts
export enum SizeShirt {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}
```

---

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

  @Prop({
    type: [{ distance: String, price: Number }],
    default: [],
  })
  distances: { distance: string; price: number }[];

  @Prop()
  groupName: string;

  @Prop()
  groupLeader: string;

  @Prop()
  zaloGroupUrl: string;

  @Prop()
  hotline: string;

  @Prop()
  regulationsUrl: string;

  @Prop()
  fanpageUrl: string;

  @Prop({ type: Object })
  paymentConfig: Record<string, any>;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.index({ creatorId: 1 });
```

---

## API Endpoints

### Campaign CRUD (Admin/Organizer)

| Method | Endpoint                          | Auth         | Description                          |
|--------|-----------------------------------|--------------|--------------------------------------|
| POST   | `/campaigns`                      | Admin/Org    | Tạo chiến dịch                       |
| GET    | `/campaigns`                      | Admin/Org    | Danh sách chiến dịch (Admin: tất cả, Org: chỉ của mình) |
| GET    | `/campaigns/:id`                  | Admin/Org    | Chi tiết chiến dịch                  |
| PATCH  | `/campaigns/:id`                  | Admin/Org    | Cập nhật chiến dịch (kiểm tra ownership) |
| DELETE | `/campaigns/:id`                  | Admin        | Xóa chiến dịch (chỉ DRAFT)          |
| PATCH  | `/campaigns/:id/status`           | Admin/Org    | Đổi trạng thái (kiểm tra ownership)  |

### Public Campaigns

| Method | Endpoint                        | Auth   | Description                                |
|--------|---------------------------------|--------|--------------------------------------------|
| GET    | `/campaigns/public`             | Public | Danh sách chiến dịch ACTIVE/CLOSED (pagination) |
| GET    | `/campaigns/public/:slug`       | Public | Lấy thông tin chiến dịch ACTIVE/CLOSED qua slug |

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
| GET    | `/campaigns/:campaignId/custom-fields`           | Public       | Danh sách trường (sort by sortOrder) |
| PATCH  | `/campaigns/:campaignId/custom-fields/:id`       | Admin/Org    | Cập nhật                     |
| DELETE | `/campaigns/:campaignId/custom-fields/:id`       | Admin/Org    | Xóa                         |

### Orders (Đơn hàng)

| Method | Endpoint                                           | Auth         | Description                              |
|--------|-----------------------------------------------------|--------------|------------------------------------------|
| POST   | `/campaigns/:campaignId/orders`                    | Public       | Tạo đơn hàng (mua vé)                    |
| GET    | `/campaigns/:campaignId/orders`                    | Admin/Org    | Danh sách đơn hàng (filter, pagination)  |
| GET    | `/campaigns/:campaignId/orders/:id`                | Admin/Org    | Chi tiết đơn hàng                        |

---

## File Structure

```
src/
├── libs/
│   └── mongoose.config.ts              ← Mongoose connection config
│
└── modules/campaign/
    ├── campaign.module.ts              ← MongooseModule.forFeature([...schemas])
    ├── campaign.controller.ts          ← Campaign CRUD + public endpoints
    ├── campaign.service.ts             ← Campaign business logic
    ├── campaign-order.controller.ts    ← Order endpoints
    ├── campaign-order.service.ts       ← Order business logic
    ├── campaign-discount.controller.ts ← Discount endpoints
    ├── campaign-discount.service.ts    ← Discount business logic + validate
    ├── campaign-custom-field.controller.ts ← Custom field endpoints
    ├── campaign-custom-field.service.ts   ← Custom field CRUD
    ├── schemas/
    │   ├── campaign.schema.ts          ← Campaign + embedded distances
    │   ├── campaign-order.schema.ts    ← Order + embedded AthleteInfo
    │   ├── campaign-discount.schema.ts
    │   └── campaign-custom-field.schema.ts
    ├── enums/
    │   ├── campaign-status.enum.ts
    │   ├── campaign-field-type.enum.ts
    │   ├── discount-type.enum.ts
    │   ├── campaign-order-status.enum.ts
    │   └── size-shirt.enum.ts
    └── dto/
        ├── create-campaign.dto.ts      ← Includes DistanceItemDto
        ├── update-campaign.dto.ts      ← PartialType(CreateCampaignDto)
        ├── update-campaign-status.dto.ts
        ├── create-discount.dto.ts
        ├── update-discount.dto.ts      ← PartialType(CreateDiscountDto)
        ├── validate-discount.dto.ts
        ├── create-campaign-custom-field.dto.ts
        ├── create-order.dto.ts         ← Includes AthleteInfoDto
        └── order-query.dto.ts
```

---

## Module Registration (`campaign.module.ts`)

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignOrder.name, schema: CampaignOrderSchema },
      // TODO: Cần bổ sung:
      // { name: CampaignDiscount.name, schema: CampaignDiscountSchema },
      // { name: CampaignCustomField.name, schema: CampaignCustomFieldSchema },
    ]),
  ],
  controllers: [
    CampaignController,
    CampaignOrderController,
    // TODO: Cần bổ sung:
    // CampaignDiscountController,
    // CampaignCustomFieldController,
  ],
  providers: [
    CampaignService,
    CampaignOrderService,
    // TODO: Cần bổ sung:
    // CampaignDiscountService,
    // CampaignCustomFieldService,
  ],
  exports: [CampaignService, CampaignOrderService],
})
export class CampaignModule {}
```

> **Lưu ý quan trọng**: Hiện tại `campaign.module.ts` chưa đăng ký `CampaignDiscount` và `CampaignCustomField` schemas, controllers và services. Cần bổ sung để các endpoint hoạt động.

---

## Implementation Status

### Đã hoàn thành

- [x] MongoDB Init + Mongoose config
- [x] Campaign schema (với embedded distances thay vì product/pricing phase riêng)
- [x] Campaign CRUD + status management
- [x] Campaign ownership validation (ADMIN xem tất cả, ORGANIZER chỉ xem của mình)
- [x] Public campaign endpoints (list with pagination, get by slug)
- [x] Discount schema + CRUD + validate logic
- [x] Custom Fields schema + CRUD
- [x] Order schema (với embedded AthleteInfo thay vì OrderItem)
- [x] Order creation (tính giá từ campaign.distances)
- [x] Order listing (filter by paymentStatus, distance, date range + pagination)
- [x] Enums (CampaignStatus, DiscountType, CampaignOrderStatus, CampaignFieldType, SizeShirt)

### Cần hoàn thành

- [ ] **Fix module registration**: Bổ sung CampaignDiscount + CampaignCustomField vào `campaign.module.ts`
- [ ] **Export Excel**: Implement `CampaignExportService` (export format chuẩn 5BIB/ActiUp)
- [ ] **Payment integration**: Tích hợp payment module khi tạo order
- [ ] **Discount apply on order**: Áp dụng discount code khi tạo đơn hàng (hiện order service chưa tích hợp discount)
- [ ] **Payment webhook**: Callback cập nhật `paymentStatus` + increment `usedCount` cho discount
- [ ] **Payment Config**: Cấu hình payment provider per campaign (Casso/Seapay)

---

## Entity Relationships

```
Campaign (1) ──── (N) distances (embedded)
    │
    ├── (N) CampaignDiscount
    │
    ├── (N) CampaignCustomField
    │
    └── (N) CampaignOrder
                │
                └── (N) AthleteInfo (embedded) ──── distance → Campaign.distances

Campaign (N) ──── (1) User (creator, via creatorId → PostgreSQL)
```

---

## Key Business Logic

### Tính giá bán (hiện tại)
```
1. Mỗi campaign có mảng `distances` chứa { distance, price }
2. Khi tạo order, mỗi athlete chọn 1 distance
3. Service lookup giá từ campaign.distances theo tên cự ly
4. Nếu cự ly không tồn tại → throw BadRequestException
5. totalAmount = sum(unitPrice) của tất cả athletes
6. finalAmount = totalAmount (chưa tích hợp discount khi tạo order)
```

### Áp dụng Discount (qua validate endpoint)
```
1. Kiểm tra code tồn tại + isActive + thời gian hợp lệ (startTime ≤ now ≤ endTime)
2. Kiểm tra usedCount < maxUses (nếu có giới hạn)
3. Kiểm tra totalAmount >= minOrderAmount (nếu có)
4. Tính discountAmount:
   - PERCENTAGE: (totalAmount * discountValue) / 100
   - FIXED_AMOUNT: discountValue
5. Cap: discountAmount = min(discountAmount, totalAmount)
6. Trả về { discount, discountAmount }
7. incrementUsedCount(discountId) khi order PAID (chưa implement webhook)
```

### Order Code Generation
```
Format: ORD-{timestamp_base36}-{random_4chars}
VD: ORD-LM5K2X-A9B3
```

### Export Excel (chưa implement)
```
Columns: Mã đơn | Người mua | SĐT | Email | Cự ly | Tên VĐV | BIB Name
         | Size áo | CLB | Nhóm máu | Trạng thái TT | Ngày đặt | Số tiền
Format: Chuẩn 5BIB/ActiUp để import ngược
```
