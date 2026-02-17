# System Design: Create Event Feature

| **Version** | v1.0 |
|---|---|
| **Create date** | 2026-02-11 |
| **Status** | DRAFT - Pending Review |
| **Tech Stack** | NestJS + TypeORM + PostgreSQL |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Design](#2-database-design)
3. [Module Architecture](#3-module-architecture)
4. [API Endpoints](#4-api-endpoints)
5. [DTOs & Validation](#5-dtos--validation)
6. [Business Logic](#6-business-logic)
7. [File Upload Strategy](#7-file-upload-strategy)
8. [State Machine](#8-state-machine)
9. [Migration Plan](#9-migration-plan)

---

## 1. Overview

### Scope

Implement a complete Event Creation system supporting:
- Multi-step event creation (General Info → Media → Sessions/Tickets → Custom Fields → Game Rules → Extended Settings)
- Draft/Publish workflow
- Sport-specific scoring configuration (Pickleball, Badminton)
- Dynamic registration form builder
- Ticket tier management with time-based sales

### Out of Scope
- Tennis sport type (future)
- Insurance integration (coming soon)
- Payment processing (separate module)
- Match management / Live scoring

---

## 2. Database Design

### 2.1 Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    User      │       │      Event       │       │  EventMedia     │
│  (existing)  │──1:N──│                  │──1:N──│                 │
└─────────────┘       └──────────────────┘       └─────────────────┘
                              │
                    ┌─────────┼──────────┐
                    │         │          │
                   1:N       1:N        1:N
                    │         │          │
           ┌────────┴───┐  ┌─┴────────┐ ┌┴───────────┐
           │ EventSession│  │EventField│ │EventBlack  │
           │ (Hạng mục)  │  │(Custom)  │ │  list      │
           └─────────────┘  └──────────┘ └────────────┘
                    │
                   1:N
                    │
           ┌────────┴───┐
           │TicketTier   │
           │(Loại vé)    │
           └─────────────┘
```

> **Note:** Extended settings (banner, terms, conditions) are stored directly on the `Event` entity since it's a 1:1 relationship.

### 2.2 Entity Definitions

#### `Event` (Primary Entity)

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `organizerId` | UUID | FK → User.id, NOT NULL | Creator/Owner |
| `name` | VARCHAR(256) | NOT NULL | Tên sự kiện |
| `brand` | VARCHAR(256) | NULLABLE | Thương hiệu |
| `sportType` | ENUM | NOT NULL | `PICKLEBALL`, `BADMINTON` |
| `hotline` | VARCHAR(20) | NOT NULL | SĐT hỗ trợ |
| `address` | TEXT | NOT NULL | Địa chỉ chi tiết |
| `provinceCode` | VARCHAR(10) | NOT NULL | Mã tỉnh/thành |
| `wardCode` | VARCHAR(10) | NOT NULL | Mã phường/xã |
| `prefixCode` | VARCHAR(6) | NOT NULL | Mã tiền tố (auto uppercase) |
| `slug` | VARCHAR(512) | UNIQUE, NOT NULL | URL slug |
| `allowTransfer` | BOOLEAN | DEFAULT true | Cho phép chuyển nhượng |
| `status` | ENUM | DEFAULT 'DRAFT' | `DRAFT`, `PUBLISHED`, `LIVE`, `CLOSED`, `CANCELLED` |
| `eventStartTime` | TIMESTAMP | NOT NULL | Thời gian bắt đầu |
| `eventEndTime` | TIMESTAMP | NOT NULL | Thời gian kết thúc |
| `editInfoOpenTime` | TIMESTAMP | NOT NULL | Mở chỉnh sửa thông tin |
| `editInfoCloseTime` | TIMESTAMP | NOT NULL | Đóng chỉnh sửa thông tin |
| `transferOpenTime` | TIMESTAMP | NULLABLE | Mở chuyển nhượng (required if allowTransfer=true) |
| `transferCloseTime` | TIMESTAMP | NULLABLE | Đóng chuyển nhượng |
| `checkinOpenTime` | TIMESTAMP | NOT NULL | Mở check-in |
| `checkinCloseTime` | TIMESTAMP | NOT NULL | Đóng check-in |
| `paymentMethods` | VARCHAR[] | NOT NULL | Array of payment method codes |
| `scoringConfig` | JSONB | NULLABLE | Game rules configuration |
| `bannerEnabled` | BOOLEAN | DEFAULT false | Bật/tắt banner |
| `bannerImageUrl` | TEXT | NULLABLE | URL hình banner |
| `bannerCtaUrl` | TEXT | NULLABLE | Link CTA banner |
| `termsFileUrl` | TEXT | NULLABLE | Điều khoản PDF URL |
| `conditionsFileUrl` | TEXT | NULLABLE | Điều kiện PDF URL |
| `created_at` | TIMESTAMP | auto | |
| `updated_at` | TIMESTAMP | auto | |

#### `EventMedia`

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `eventId` | UUID | FK → Event.id, NOT NULL | |
| `type` | ENUM | NOT NULL | `LOGO`, `WALLPAPER`, `EMAIL_IMAGE` |
| `url` | TEXT | NOT NULL | S3 URL |
| `fileSize` | INTEGER | NOT NULL | Size in bytes |
| `mimeType` | VARCHAR(50) | NOT NULL | |
| `created_at` | TIMESTAMP | auto | |

#### `EventDescription`

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `eventId` | UUID | FK → Event.id, NOT NULL | |
| `title` | VARCHAR(256) | NULLABLE | Title of description block |
| `content` | TEXT | NOT NULL | Rich text HTML content |
| `sortOrder` | INTEGER | DEFAULT 0 | Display order |
| `created_at` | TIMESTAMP | auto | |
| `updated_at` | TIMESTAMP | auto | |

#### `EventSession` (Hạng mục thi đấu)

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `eventId` | UUID | FK → Event.id, NOT NULL | |
| `name` | VARCHAR(256) | NOT NULL | Tên hạng mục |
| `matchType` | ENUM | NOT NULL | `SINGLES`, `DOUBLES` |
| `requirePartner` | BOOLEAN | DEFAULT false | Yêu cầu partner (only for DOUBLES) |
| `startTime` | TIMESTAMP | NOT NULL | Thời gian bắt đầu nội dung |
| `endTime` | TIMESTAMP | NOT NULL | Thời gian kết thúc dự kiến |
| `ticketCode` | VARCHAR(3) | UNIQUE per event, NOT NULL | Mã vé (3 ký tự) |
| `ticketImageUrl` | TEXT | NULLABLE | Hình vé |
| `ratingCheckEnabled` | BOOLEAN | DEFAULT false | Bật kiểm tra rating |
| `ratingSources` | VARCHAR[] | NULLABLE | `MANUAL`, `FIVE_RATING`, `DUPR` |
| `minRating` | DECIMAL(5,2) | NULLABLE | Ngưỡng điểm tối thiểu |
| `maxRating` | DECIMAL(5,2) | NULLABLE | Ngưỡng điểm tối đa |
| `sortOrder` | INTEGER | DEFAULT 0 | |
| `created_at` | TIMESTAMP | auto | |
| `updated_at` | TIMESTAMP | auto | |

#### `TicketTier` (Loại vé)

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `sessionId` | UUID | FK → EventSession.id, NOT NULL | |
| `name` | VARCHAR(256) | NOT NULL | Tên loại vé |
| `isFree` | BOOLEAN | DEFAULT false | Vé miễn phí |
| `price` | DECIMAL(15,0) | NULLABLE | Giá VND (null if free) |
| `totalQuantity` | INTEGER | NOT NULL | Tổng số vé |
| `minPerOrder` | INTEGER | NOT NULL, DEFAULT 1 | Tối thiểu/đơn |
| `maxPerOrder` | INTEGER | NOT NULL | Tối đa/đơn |
| `isVisible` | BOOLEAN | DEFAULT true | Hiển thị trên UI |
| `saleStartTime` | TIMESTAMP | NOT NULL | Ngày bắt đầu bán |
| `saleEndTime` | TIMESTAMP | NOT NULL | Ngày ngưng bán |
| `sortOrder` | INTEGER | DEFAULT 0 | |
| `created_at` | TIMESTAMP | auto | |
| `updated_at` | TIMESTAMP | auto | |

#### `EventCustomField` (Câu hỏi tùy chỉnh)

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `eventId` | UUID | FK → Event.id, NOT NULL | |
| `label` | VARCHAR(256) | NOT NULL | Label hiển thị UI |
| `fieldName` | VARCHAR(256) | NOT NULL | Tên trường (cho báo cáo) |
| `description` | VARCHAR(250) | NULLABLE | Mô tả ngắn |
| `fieldType` | ENUM | NOT NULL | `TEXT`, `PROVINCE`, `COUNTRY`, `SINGLE_SELECT`, `MULTI_SELECT`, `DATE`, `FILE_UPLOAD` |
| `options` | TEXT[] | NULLABLE | Danh sách lựa chọn (for SELECT types) |
| `allowedFileTypes` | VARCHAR[] | NULLABLE | Đuôi file cho phép (for FILE_UPLOAD) |
| `defaultValue` | TEXT | NULLABLE | Giá trị mặc định |
| `attachmentUrl` | TEXT | NULLABLE | Ảnh đính kèm URL |
| `dbMapping` | VARCHAR(50) | NULLABLE, UNIQUE per event | Map to participant DB field |
| `isRequired` | BOOLEAN | DEFAULT false | Bắt buộc trả lời |
| `isVisible` | BOOLEAN | DEFAULT true | Ẩn/hiện |
| `sortOrder` | INTEGER | DEFAULT 0 | |
| `created_at` | TIMESTAMP | auto | |
| `updated_at` | TIMESTAMP | auto | |

#### `EventBlacklist`

| Column | Type | Constraint | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `eventId` | UUID | FK → Event.id, NOT NULL | |
| `type` | ENUM | NOT NULL | `EMAIL`, `PHONE` |
| `value` | VARCHAR(256) | NOT NULL | Email or phone number |
| `created_at` | TIMESTAMP | auto | |

**Unique constraint:** (`eventId`, `type`, `value`)

### 2.3 Scoring Config (JSONB Structure)

Stored in `Event.scoringConfig` as JSONB:

```typescript
// Pickleball
{
  sportType: 'PICKLEBALL',
  scoringMode: 'SIDE_OUT' | 'RALLY_POINT',
  matchFormat: '1_SET' | 'BEST_OF_3' | 'BEST_OF_5',
  pointsToWin: 11,        // 11-25
  winByTwo: true,
  pointCap: null | number, // > pointsToWin, only if winByTwo=true
  switchEndsAt: 6          // 0 = disabled
}

// Badminton
{
  sportType: 'BADMINTON',
  scoringMode: 'RALLY_POINT',  // fixed
  matchFormat: 'BEST_OF_3',
  pointsToWin: 21,        // 11-31
  winByTwo: true,
  pointCap: 30,
  changeEnds: {
    endOfSet: true,
    interval: true          // at 11 points in set 3
  }
}
```

---

## 3. Module Architecture

### 3.1 Module Structure

```
src/modules/event/
├── event.module.ts
├── event.controller.ts
├── event.service.ts
├── entities/
│   ├── event.entity.ts
│   ├── event-media.entity.ts
│   ├── event-description.entity.ts
│   ├── event-session.entity.ts
│   ├── ticket-tier.entity.ts
│   ├── event-custom-field.entity.ts
│   └── event-blacklist.entity.ts
├── dto/
│   ├── create-event.dto.ts
│   ├── update-event.dto.ts
│   ├── create-event-session.dto.ts
│   ├── create-ticket-tier.dto.ts
│   ├── create-custom-field.dto.ts
│   ├── scoring-config.dto.ts
│   └── event-response.dto.ts
├── enums/
│   ├── event-status.enum.ts
│   ├── sport-type.enum.ts
│   ├── match-type.enum.ts
│   ├── field-type.enum.ts
│   └── payment-method.enum.ts
├── validators/
│   ├── scoring-config.validator.ts
│   └── timeline.validator.ts
└── services/
    ├── event-session.service.ts
    ├── event-media.service.ts
    ├── event-custom-field.service.ts
    └── event-status.service.ts
```

### 3.2 Module Dependencies

```
EventModule
├── imports: [TypeOrmModule.forFeature([all entities]), UserModule]
├── controllers: [EventController]
├── providers: [EventService, EventSessionService, EventMediaService,
│               EventCustomFieldService, EventStatusService]
└── exports: [EventService]
```

---

## 4. API Endpoints

### 4.1 Event CRUD

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/events` | JWT | organizer, admin | Create event (draft) |
| `GET` | `/events` | JWT | organizer, admin | List my events (paginated) |
| `GET` | `/events/:id` | JWT | organizer, admin | Get event detail |
| `PATCH` | `/events/:id` | JWT | organizer, admin | Update general info (AC1) |
| `DELETE` | `/events/:id` | JWT | organizer, admin | Delete draft event only |
| `POST` | `/events/:id/publish` | JWT | organizer, admin | Publish event (Draft→Published) |
| `POST` | `/events/:id/cancel` | JWT | organizer, admin | Cancel event |

### 4.2 Media & Description (AC2)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events/:id/media` | Upload media (logo/wallpaper/email image) |
| `DELETE` | `/events/:id/media/:mediaId` | Delete media |
| `POST` | `/events/:id/descriptions` | Add description block |
| `PATCH` | `/events/:id/descriptions/:descId` | Update description |
| `DELETE` | `/events/:id/descriptions/:descId` | Delete description |
| `PATCH` | `/events/:id/descriptions/reorder` | Reorder descriptions |

### 4.3 Sessions & Tickets (AC3)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events/:id/sessions` | Create session (hạng mục) |
| `PATCH` | `/events/:id/sessions/:sessionId` | Update session |
| `DELETE` | `/events/:id/sessions/:sessionId` | Delete session |
| `POST` | `/events/:id/sessions/:sessionId/tickets` | Create ticket tier |
| `PATCH` | `/events/:id/sessions/:sessionId/tickets/:ticketId` | Update ticket tier |
| `DELETE` | `/events/:id/sessions/:sessionId/tickets/:ticketId` | Delete ticket tier |

### 4.4 Custom Fields (AC4)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events/:id/fields` | Add custom field |
| `PATCH` | `/events/:id/fields/:fieldId` | Update custom field |
| `DELETE` | `/events/:id/fields/:fieldId` | Delete field (only if Draft) |
| `PATCH` | `/events/:id/fields/reorder` | Reorder fields |

### 4.5 Scoring Config (AC5)

| Method | Endpoint | Description |
|---|---|---|
| `PUT` | `/events/:id/scoring-config` | Save/update scoring config |
| `GET` | `/events/:id/scoring-config` | Get scoring config |

### 4.6 Extended Settings (AC6)

Extended settings fields live on the Event entity, updated via `PATCH /events/:id`.

File uploads for banner/terms/conditions use the media upload endpoint:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events/:id/media` | Upload banner image / terms PDF / conditions PDF |

### 4.7 Blacklist

| Method | Endpoint | Description |
|---|---|---|
| `PUT` | `/events/:id/blacklist` | Bulk set blacklist (replace all) |
| `GET` | `/events/:id/blacklist` | Get blacklist |

---

## 5. DTOs & Validation

### 5.1 CreateEventDto (AC1 - General Info)

```typescript
class CreateEventDto {
  @IsString() @MaxLength(256)
  name: string;

  @IsOptional() @IsString() @MaxLength(256)
  brand?: string;

  @IsEnum(SportType)
  sportType: SportType;  // PICKLEBALL | BADMINTON

  @IsString() @MaxLength(20)
  hotline: string;

  @IsString()
  address: string;

  @IsString()
  provinceCode: string;

  @IsString()
  wardCode: string;

  @IsString() @MaxLength(6) @Transform(({ value }) => value?.toUpperCase())
  prefixCode: string;

  @IsOptional() @IsString() @MaxLength(512)
  slug?: string;  // auto-generated if not provided

  @IsOptional() @IsBoolean()
  allowTransfer?: boolean;  // default true

  @IsDateString()
  eventStartTime: string;

  @IsDateString()
  eventEndTime: string;

  @IsDateString()
  editInfoOpenTime: string;

  @IsDateString()
  editInfoCloseTime: string;

  @ValidateIf(o => o.allowTransfer !== false)
  @IsDateString()
  transferOpenTime?: string;

  @ValidateIf(o => o.allowTransfer !== false)
  @IsDateString()
  transferCloseTime?: string;

  @IsDateString()
  checkinOpenTime: string;

  @IsDateString()
  checkinCloseTime: string;

  @IsArray() @IsEnum(PaymentMethod, { each: true })
  paymentMethods: PaymentMethod[];
}
```

### 5.2 Key Validation Rules

**Timeline Validation (Custom Validator):**
```
- eventEndTime > eventStartTime
- editInfoCloseTime > editInfoOpenTime
- transferCloseTime > transferOpenTime (if allowTransfer)
- checkinCloseTime > checkinOpenTime
- editInfoCloseTime <= eventStartTime  (đóng chỉnh sửa trước khi diễn ra)
```

**Scoring Config Validation (per sportType):**
```
- Common: pointsToWin >= 11, positive integer
- Pickleball: pointsToWin <= 25, pointCap > pointsToWin (if winByTwo), switchEndsAt < pointsToWin
- Badminton: pointsToWin <= 31, pointCap default 30
- pointCap > pointsToWin (ERR_CAP_INVALID)
- switchEndsAt < pointsToWin (ERR_SWITCH_INVALID)
```

**Custom Field Validation:**
```
- dbMapping must be unique per event
- dbMapping values must be from allowed list
- options required for SINGLE_SELECT / MULTI_SELECT types
- allowedFileTypes required for FILE_UPLOAD type
```

---

## 6. Business Logic

### 6.1 Event Creation Flow

```
1. POST /events → Create Event with status=DRAFT
   - Auto-generate slug from name (Vietnamese → ASCII → kebab-case)
   - Auto-uppercase prefixCode
   - Validate timeline constraints
   - Set organizerId from JWT token

2. Build event step by step (any order):
   - PATCH /events/:id (update general info)
   - POST /events/:id/media (upload images)
   - POST /events/:id/sessions (add competition categories)
   - POST /events/:id/fields (add custom registration fields)
   - PUT /events/:id/scoring-config (configure game rules)
   - PATCH /events/:id (update extended settings: banner, terms, conditions)

3. POST /events/:id/publish → Validate all required fields → PUBLISHED
```

### 6.2 Publish Validation Checklist

Before transitioning from DRAFT → PUBLISHED, validate:

```
✓ Event name, sportType, hotline, address, province, ward, prefixCode filled
✓ All required timeline fields filled
✓ At least 1 EventSession exists
✓ Each EventSession has at least 1 TicketTier
✓ Each TicketTier has valid price/quantity/dates
✓ scoringConfig is valid for the sportType
✓ paymentMethods is not empty
```

### 6.3 Authorization Rules

- Only `organizer` and `admin` roles can create/manage events
- Users can only manage events where `event.organizerId === currentUser.id`
- `admin` can manage all events
- Delete is only allowed for DRAFT events

### 6.4 Slug Generation

```typescript
function generateSlug(name: string): string {
  return removeVietnameseTones(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
// "Giải Pickleball Hà Nội 2026" → "giai-pickleball-ha-noi-2026"
```

### 6.5 Blacklist Processing

Input: raw text (emails/phones separated by newline or space)
```typescript
function parseBlacklist(raw: string): { type: 'EMAIL' | 'PHONE', value: string }[] {
  const tokens = raw.split(/[\s\n]+/).filter(Boolean);
  return tokens.map(token => ({
    type: token.includes('@') ? 'EMAIL' : 'PHONE',
    value: token.trim().toLowerCase()
  }));
}
```

---

## 7. File Upload Strategy

### 7.1 S3 Configuration

| File Type | Max Size | Allowed Formats | S3 Path Pattern |
|---|---|---|---|
| Logo | 2MB | PNG, JPEG, JPG | `events/{eventId}/logo/{uuid}.{ext}` |
| Wallpaper | 3MB | PNG, JPEG, JPG | `events/{eventId}/wallpaper/{uuid}.{ext}` |
| Email Image | 3MB | PNG, JPEG, JPG | `events/{eventId}/email/{uuid}.{ext}` |
| Ticket Image | 2MB | PNG, JPEG, JPG | `events/{eventId}/tickets/{uuid}.{ext}` |
| Banner | 2MB | PNG, JPEG, JPG | `events/{eventId}/banner/{uuid}.{ext}` |
| Terms PDF | 10MB | PDF | `events/{eventId}/terms/{uuid}.pdf` |
| Conditions PDF | 10MB | PDF | `events/{eventId}/conditions/{uuid}.pdf` |
| Custom Field Attachment | 2MB | PNG, JPEG, JPG | `events/{eventId}/fields/{uuid}.{ext}` |

### 7.2 Upload Flow

```
1. Client → POST /events/:id/media (multipart/form-data)
2. Server validates file size & type
3. Server compresses image (if applicable, preserve quality for face recognition)
4. Server uploads to S3
5. Server saves URL to database
6. Server returns URL to client
```

---

## 8. State Machine

### 8.1 Event Status Transitions

```
                ┌──────────────────────────────┐
                │                              │
   ┌────────┐   │   ┌───────────┐   ┌──────┐   │   ┌────────┐
   │ DRAFT  │───┼──→│ PUBLISHED │──→│ LIVE │───┼──→│ CLOSED │
   └────────┘   │   └───────────┘   └──────┘   │   └────────┘
                │         │             │       │
                │         └──────┬──────┘       │
                │                │              │
                │         ┌──────▼──────┐       │
                │         │  CANCELLED  │       │
                │         └─────────────┘       │
                └──────────────────────────────┘
```

### 8.2 Transition Rules

| From | To | Trigger | Condition |
|---|---|---|---|
| DRAFT | PUBLISHED | Manual (API call) | All required fields validated |
| PUBLISHED | LIVE | **Automatic** (Cron/Scheduler) | `now() >= eventStartTime` |
| LIVE | CLOSED | **Automatic** (Cron/Scheduler) | `now() > eventEndTime` |
| PUBLISHED | CANCELLED | Manual (API call) | Organizer action |
| LIVE | CANCELLED | Manual (API call) | Organizer action |

### 8.3 Auto-Transition Implementation

Use `@nestjs/schedule` (Cron) to check and update statuses:

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async handleEventStatusTransitions() {
  const now = new Date();

  // Published → Live
  await this.eventRepo.update(
    { status: EventStatus.PUBLISHED, eventStartTime: LessThanOrEqual(now) },
    { status: EventStatus.LIVE }
  );

  // Live → Closed
  await this.eventRepo.update(
    { status: EventStatus.LIVE, eventEndTime: LessThan(now) },
    { status: EventStatus.CLOSED }
  );
}
```

---

## 9. Migration Plan

### 9.1 Migrations to Create

```
Migration 1: Create event table
Migration 2: Create event_media table
Migration 3: Create event_description table
Migration 4: Create event_session table
Migration 5: Create ticket_tier table
Migration 6: Create event_custom_field table
Migration 7: Create event_blacklist table
Migration 8: Add indexes (slug, organizerId, status, sportType)
```

**Recommended:** Combine into a single migration file for atomic deployment.

### 9.2 Key Indexes

```sql
CREATE INDEX idx_event_organizer ON event(organizer_id);
CREATE INDEX idx_event_status ON event(status);
CREATE INDEX idx_event_sport_type ON event(sport_type);
CREATE UNIQUE INDEX idx_event_slug ON event(slug);
CREATE INDEX idx_event_start_time ON event(event_start_time);
CREATE INDEX idx_event_session_event ON event_session(event_id);
CREATE INDEX idx_ticket_tier_session ON ticket_tier(session_id);
CREATE INDEX idx_custom_field_event ON event_custom_field(event_id);
CREATE INDEX idx_blacklist_event ON event_blacklist(event_id);
CREATE UNIQUE INDEX idx_blacklist_unique ON event_blacklist(event_id, type, value);
CREATE UNIQUE INDEX idx_custom_field_db_mapping ON event_custom_field(event_id, db_mapping) WHERE db_mapping IS NOT NULL;
```

---

## 10. Enums Reference

```typescript
enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

enum SportType {
  PICKLEBALL = 'PICKLEBALL',
  BADMINTON = 'BADMINTON'
}

enum MatchType {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES'
}

enum FieldType {
  TEXT = 'TEXT',
  PROVINCE = 'PROVINCE',
  COUNTRY = 'COUNTRY',
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  DATE = 'DATE',
  FILE_UPLOAD = 'FILE_UPLOAD'
}

enum PaymentMethod {
  VNPAY_QR = 'VNPAY_QR',
  INTERNATIONAL_CARD = 'INTERNATIONAL_CARD',
  DOMESTIC_CARD = 'DOMESTIC_CARD',
  PAYX_QR = 'PAYX_QR',
  PAYX_DOMESTIC = 'PAYX_DOMESTIC'
}

enum MediaType {
  LOGO = 'LOGO',
  WALLPAPER = 'WALLPAPER',
  EMAIL_IMAGE = 'EMAIL_IMAGE'
}

enum RatingSource {
  MANUAL = 'MANUAL',
  FIVE_RATING = 'FIVE_RATING',
  DUPR = 'DUPR'
}

enum BlacklistType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE'
}

// DB Mapping allowed values
const DB_MAPPING_FIELDS = [
  'participantName',
  'participantsFirstName',
  'participantsLastName',
  'participantsDOB',
  'participantsGender',
  'participantsEmail',
  'participantsPhone',
  'participantsRacekit',
  'participantsPortrait',
  'participantsId',
  'participantsAddress',
  'participantsCompany',
  'participantsNational',
  'participantsQuestion',
  'participantsNote',
  'participantsCity'
] as const;
```

---

## 11. Implementation Priority

| Phase | Tasks | Entities |
|---|---|---|
| **Phase 1** | Event CRUD + General Info (AC1) + Status Machine | Event, EventBlacklist |
| **Phase 2** | Media & Descriptions (AC2) | EventMedia, EventDescription |
| **Phase 3** | Sessions & Tickets (AC3) | EventSession, TicketTier |
| **Phase 4** | Custom Fields (AC4) | EventCustomField |
| **Phase 5** | Scoring Config (AC5) | Event.scoringConfig (JSONB) |
| **Phase 6** | Extended Settings (AC6) + Publish flow | Event (banner/terms/conditions fields) |
