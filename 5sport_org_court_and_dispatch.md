# 5Sport - Organizer Admin: Court Management & Tournament Dispatch

## Backend API Reference

Base URL: `/api/v1`
Auth: Bearer JWT token (role: ADMIN or ORGANIZER)

---

## PHASE 1: COURT MANAGEMENT (Quản lý sân)

### 1.1 Quick Setup - Bulk Create Courts

**Screen:** Popup/Modal khi vào menu "Quản lý Sân" lần đầu.

**API:** `POST /events/:eventId/courts/bulk`

```json
// Request
{ "count": 8 }

// Response: Court[]
[
  {
    "id": "uuid-1",
    "eventId": "event-uuid",
    "name": "San 1",
    "sortOrder": 1,
    "status": "ACTIVE",
    "isGhost": false,
    "allowedSessionIds": null,
    "created_at": "2026-03-12T..."
  },
  // ... San 2 -> San 8
]
```

**UI Flow:**
1. Hiển thị input number "Số lượng sân thi đấu" (min 1, max 50)
2. Bấm "Tạo danh sách sân" → gọi API bulk
3. Sau khi tạo xong → chuyển sang màn Court List

---

### 1.2 Court List - CRUD

**Screen:** Danh sách sân dạng bảng, có thể inline edit.

**APIs:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List sân | GET | `/events/:eventId/courts` | - |
| Thêm 1 sân | POST | `/events/:eventId/courts` | `{ name, allowedSessionIds?, isGhost? }` |
| Sửa sân | PATCH | `/events/:eventId/courts/:courtId` | `{ name?, status?, allowedSessionIds? }` |
| Xóa sân | DELETE | `/events/:eventId/courts/:courtId` | - |
| Court Grid | GET | `/events/:eventId/courts/grid` | - |

**Court Grid Response:**

```json
[
  {
    "court": { "id": "...", "name": "San 1", "status": "ACTIVE", ... },
    "operationalStatus": "AVAILABLE",  // AVAILABLE | RESERVED | BUSY | MAINTENANCE
    "currentMatch": null               // Match object nếu có trận đang gán
  },
  {
    "court": { "id": "...", "name": "San 2", "status": "ACTIVE", ... },
    "operationalStatus": "BUSY",
    "currentMatch": {
      "id": "match-uuid",
      "name": "Quarter Final 1",
      "status": "IN_PROGRESS",
      "team1Name": "Tuan/Hung",
      "team2Name": "Nam/Bac",
      "startTime": "2026-03-12T09:05:00Z"
    }
  }
]
```

**UI cho mỗi dòng Court Row:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Drag Handle]  [Input: San 1 (editable)]                       │
│                                                                 │
│ Hạng mục: [Multi-select dropdown: Tất cả ▼]                    │
│           (load từ GET /events/:eventId → sessions)             │
│                                                                 │
│ Trạng thái: [Toggle ON/OFF]                                     │
│             ON = ACTIVE, OFF = MAINTENANCE                      │
│                                                                 │
│ Actions: [🖨️ QR Code]  [🗑️ Xóa]                               │
│          Xóa bị disable nếu operationalStatus !== AVAILABLE     │
└─────────────────────────────────────────────────────────────────┘
```

**Nút Global (góc trên phải):**
- `[+ Thêm Sân]` → gọi POST `/events/:eventId/courts`
- `[🖨️ In toàn bộ QR]` → gọi GET QR cho từng sân, render ra 1 PDF

**Khi sửa tên sân (inline edit):**
- onBlur hoặc Enter → `PATCH /events/:eventId/courts/:courtId` body `{ "name": "San Trung Tam (Live)" }`

**Khi toggle trạng thái:**
- `PATCH /events/:eventId/courts/:courtId` body `{ "status": "MAINTENANCE" }` hoặc `{ "status": "ACTIVE" }`

**Khi chọn hạng mục (multi-select):**
- Load danh sách sessions từ event data (GET `/events/:eventId` → `sessions[]`)
- Khi chọn xong → `PATCH /events/:eventId/courts/:courtId` body `{ "allowedSessionIds": ["session-uuid-1", "session-uuid-2"] }`
- Nếu chọn "Tất cả" → `{ "allowedSessionIds": [] }` (empty = all allowed)

---

### 1.3 QR Code Modal

**Trigger:** Bấm nút 🖨️ QR Code trên dòng sân.

**API:** `GET /events/:eventId/courts/:courtId/qr`

```json
// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "url": "https://match.5sport.vn/auth/qr?t=eyJhbGciOiJIUzI1NiIs..."
}
```

**UI Modal:**

```
┌──────────────────────────────────────┐
│        Mã truy cập Sân 1            │
│                                      │
│        ┌──────────────┐              │
│        │              │              │
│        │   QR CODE    │              │
│        │  (từ url)    │              │
│        │              │              │
│        └──────────────┘              │
│                                      │
│  Link: https://match.5sport...       │
│        [📋 Copy]                     │
│                                      │
│  Trạng thái: 🟢 Đang hoạt động      │
│                                      │
│  ┌────────────────┐ ┌──────────────┐ │
│  │ 🖨️ TẢI FILE IN │ │ 🔄 TẠO MÃ MỚI│ │
│  └────────────────┘ └──────────────┘ │
└──────────────────────────────────────┘
```

**Tải file in:**
- Frontend render QR thành canvas/image với template (logo, tên sân, hướng dẫn)
- Dùng thư viện: `qrcode` (npm) để generate QR từ `url`
- Export ra PNG hoặc PDF bằng `html2canvas` + `jspdf`

**Tạo mã mới (Rotate):**

```
API: POST /events/:eventId/courts/:courtId/rotate-qr
Response: { "token": "new-token...", "url": "new-url..." }
```

- Hiện confirm dialog trước: "Hành động này sẽ vô hiệu hóa mã QR cũ. Trọng tài đang sử dụng mã cũ sẽ bị đăng xuất. Bạn có chắc không?"
- Sau khi confirm → gọi API → cập nhật QR trong modal

**In toàn bộ QR (Bulk print):**
- Loop gọi `GET /events/:eventId/courts/:courtId/qr` cho mỗi sân
- Hoặc gọi `GET /events/:eventId/courts` rồi render tất cả QR client-side
- Render template cho mỗi sân → ghép thành 1 PDF (2-4 sân/trang)

---

## PHASE 2: TOURNAMENT DISPATCH (Điều hành sự kiện)

### 2.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  ZONE A: STATS BAR (60px fixed top)                             │
│  🕒 10:45 AM │ 📊 35% │ Pending: 15 │ Playing: 8 │ Done: 20   │
│  [🔍 Tìm kiếm]                              [⚡ Auto-Assign]  │
├──────────────┬──────────────────────────────────────────────────┤
│  ZONE B:     │  ZONE C: COURT GRID (main area)                 │
│  MATCH QUEUE │                                                  │
│  (350-400px) │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│              │  │ San 1   │ │ San 2   │ │ San 3   │           │
│  [Filter ▼]  │  │ BUSY 🔴 │ │ AVAIL 🟢│ │ RSVD 🟡 │           │
│              │  │ #M01    │ │         │ │ #M05    │           │
│  ┌──────────┐│  │ A vs B  │ │ Kéo vào │ │ C vs D  │           │
│  │ #M02     ││  │ 14:02   │ │  đây    │ │         │           │
│  │ Tứ kết   ││  │ (1)11-5 │ │         │ │ [▶ BĐ]  │           │
│  │ E vs F   ││  └─────────┘ └─────────┘ └─────────┘           │
│  │ Đôi Nam  ││                                                  │
│  └──────────┘│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  ┌──────────┐│  │ San 4   │ │ San 5   │ │ San 6   │           │
│  │ #M03     ││  │ MAINT ⚫│ │ AVAIL 🟢│ │ AVAIL 🟢│           │
│  │ Bán kết  ││  └─────────┘ └─────────┘ └─────────┘           │
│  │ G vs H   ││                                                  │
│  └──────────┘│                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### 2.2 Zone A: Stats Bar

**Data sources:**
- Thời gian: client-side `new Date()`
- Tiến độ + thống kê: tính từ match data

**Cách tính stats:**
```typescript
// Gọi GET /events/:eventId/matches để lấy tất cả matches
// Hoặc dùng court grid + queue data đã load

const stats = {
  pending: matches.filter(m => m.status === 'PENDING').length,
  playing: matches.filter(m => ['IN_PROGRESS', 'WARM_UP', 'SCHEDULED'].includes(m.status)).length,
  completed: matches.filter(m => m.status === 'COMPLETED').length,
  total: matches.length,
  progress: Math.round((completed / total) * 100)
};
```

**Search:** Client-side filter trên danh sách matches (tìm theo tên VĐV, mã trận).

**Auto-Assign button:** Xem mục 2.5.

---

### 2.3 Zone B: Match Queue (Left Sidebar)

**API:** `GET /events/:eventId/dispatch/queue?sessionId=xxx&page=1&limit=50`

```json
// Response
{
  "data": [
    {
      "id": "match-uuid-1",
      "name": "Quarter Final 1",
      "round": "Quarter Final",
      "sessionId": "session-uuid",
      "status": "PENDING",
      "priority": 0,
      "team1Name": "Nguyen A & Tran B",
      "team2Name": "Le C & Pham D",
      "scheduledTime": "2026-03-12T09:00:00Z",
      "created_at": "2026-03-11T..."
    }
  ],
  "total": 15
}
```

**UI - Filter Bar:**
- Dropdown chọn hạng mục (session) → truyền `?sessionId=...`
- Dữ liệu sessions load từ event data

**UI - Match Card (Draggable):**

```
┌──────────────────────────────┐
│  #M02 - Tứ kết        🟠    │  ← Border cam = PENDING
│  Đôi Nam 3.5                │  ← session name
│                              │
│  Nguyen A & Tran B           │
│       vs                     │
│  Le C & Pham D               │
└──────────────────────────────┘
```

- Mỗi card là `draggable`
- Khi drag bắt đầu → gửi `matchId` vào drag data

---

### 2.4 Zone C: Court Grid (Main Area)

**API:** `GET /events/:eventId/courts/grid`

**Render grid:** 2-4 columns responsive, mỗi court là 1 card.

**Court Card States:**

#### State 1: AVAILABLE (Xanh)

```
┌────────────────────────────┐
│  San 1           🟢 Trống  │
│  ─────────────────────────  │
│                             │
│      📥 Kéo trận vào đây   │  ← Drop zone
│                             │
└────────────────────────────┘
```

- CSS: `border: 2px dashed green`
- Là drop target cho drag-and-drop

#### State 2: RESERVED (Vàng)

```
┌────────────────────────────┐
│  San 3          🟡 Đã gán  │
│  ─────────────────────────  │
│  #M05 - Tứ kết             │
│  Đôi Nam                    │
│  C & D vs E & F             │
│                             │
│  [▶️ Bắt đầu]  [↩️ Gỡ bỏ]  │
└────────────────────────────┘
```

#### State 3: BUSY (Đỏ)

```
┌────────────────────────────┐
│  San 1    🔴 Đang đánh     │
│  ─────────────────────────  │
│  #M01 - Bán kết            │
│  A & B vs C & D             │
│                             │
│  ⏱️ 14:02     (1) 11-5     │  ← Timer chạy real-time (client)
│                             │
│  [📝 Nhập điểm] [↩️ Gỡ bỏ] │
└────────────────────────────┘
```

- Timer: client-side interval, tính từ `currentMatch.startTime`
  ```typescript
  const elapsed = Math.floor((Date.now() - new Date(match.startTime).getTime()) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  ```

#### State 4: MAINTENANCE (Xám)

```
┌────────────────────────────┐
│  San 4       ⚫ Bảo trì    │
│  ─────────────────────────  │
│                             │
│      🔧 Đang bảo trì       │
│                             │
└────────────────────────────┘
```

---

### 2.5 Drag & Drop Assignment

**Khi drop match card vào court card:**

```typescript
// Frontend handler
async function onDrop(matchId: string, courtId: string) {
  try {
    const result = await api.post(`/events/${eventId}/dispatch/assign`, {
      matchId,
      courtId,
    });
    // Success: refresh court grid + queue
    refreshCourtGrid();
    refreshMatchQueue();
    toast.success(`Đã gán trận vào ${courtName}`);
  } catch (error) {
    // Backend trả lỗi nếu:
    // - Court đang MAINTENANCE
    // - Court đã có trận
    // - Category không tương thích
    toast.error(error.response.data.message);
  }
}
```

**API:** `POST /events/:eventId/dispatch/assign`

```json
// Request
{ "matchId": "match-uuid", "courtId": "court-uuid" }

// Success Response: Match object với status = "SCHEDULED", courtId set
// Error 400: "Court is under maintenance"
// Error 400: "Court already has an active or scheduled match"
// Error 400: "This court does not allow matches from this category"
```

---

### 2.6 Unassign Match (Gỡ trận khỏi sân)

**Trigger:** Bấm nút "Gỡ bỏ" trên court card.

**API:** `POST /events/:eventId/dispatch/unassign`

```json
// Request
{ "matchId": "match-uuid" }

// Response: Match object với status = "PENDING", courtId = null
// Error 400: "Cannot unassign a match that is in progress"
```

- Hiện confirm dialog trước khi gỡ
- Sau khi gỡ → match quay lại queue, court trở thành AVAILABLE

---

### 2.7 Auto-Assign (Xếp tự động)

**Trigger:** Bấm nút ⚡ Auto-Assign trên Stats Bar.

**Step 1: Preview**

```typescript
const preview = await api.post(
  `/events/${eventId}/dispatch/auto-assign?confirm=false`
);
```

```json
// Response: AutoAssignPreview
{
  "assignments": [
    { "courtId": "c1", "courtName": "San 2", "matchId": "m1", "matchName": "QF 1" },
    { "courtId": "c2", "courtName": "San 5", "matchId": "m2", "matchName": "QF 2" },
    { "courtId": "c3", "courtName": "San 6", "matchId": "m3", "matchName": "QF 3" }
  ],
  "totalAvailableCourts": 3,
  "totalPendingMatches": 10
}
```

**UI Preview Modal:**

```
┌──────────────────────────────────────────┐
│  ⚡ Xếp sân tự động                      │
│                                          │
│  Tìm thấy 3 sân trống, 10 trận chờ.     │
│  Sẽ gán 3 trận sau:                      │
│                                          │
│  San 2  ←  QF 1 (Đôi Nam)               │
│  San 5  ←  QF 2 (Đôi Nữ)               │
│  San 6  ←  QF 3 (Đôi Nam)               │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │   ❌ Hủy      │  │  ✅ Đồng ý   │      │
│  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────┘
```

**Step 2: Confirm**

```typescript
const result = await api.post(
  `/events/${eventId}/dispatch/auto-assign?confirm=true`
);
// Response: Match[] (các trận đã được gán)
```

---

### 2.8 Swap Court (Đổi sân)

**Trigger:** Drag court card đang có trận → drop vào court card trống khác.

**API:** `POST /events/:eventId/dispatch/swap-court`

```json
// Request
{ "matchId": "match-uuid", "newCourtId": "new-court-uuid" }

// Response: Match object với courtId mới
// Giữ nguyên status, startTime, scores
```

---

### 2.9 Match Lifecycle Actions (trên Court Card)

**Nút "Bắt đầu" (SCHEDULED → IN_PROGRESS):**

```typescript
// Có thể gọi qua organizer API
await api.post(`/events/${eventId}/matches/${matchId}/start`);
```

**Nút "Nhập điểm" → mở Score Modal:**

```
┌──────────────────────────────────────┐
│  Nhập điểm - #M01                   │
│  A & B vs C & D                      │
│                                      │
│  Set 1: [11] - [5]   Winner: [A&B]  │
│  Set 2: [ 9] - [11]  Winner: [C&D]  │
│  Set 3: [  ] - [  ]  Winner: [   ]  │
│                                      │
│  ☐ Bỏ cuộc (Walkover)               │
│                                      │
│  ┌──────────┐  ┌───────────────────┐ │
│  │   Lưu    │  │ ✅ Kết thúc trận  │ │
│  └──────────┘  └───────────────────┘ │
└──────────────────────────────────────┘
```

**Cập nhật score từng set:**

```typescript
await api.patch(`/events/${eventId}/matches/${matchId}/score`, {
  setNumber: 1,
  team1Points: 11,
  team2Points: 5,
  winnerTeam: 1,
});
```

**Kết thúc trận:**

```typescript
await api.post(`/events/${eventId}/matches/${matchId}/end`, {
  winnerTeam: 1  // optional, backend auto-calculates
});
// Match → COMPLETED, court → AVAILABLE (auto)
```

---

## PHASE 3: REFEREE QR ACCESS (Trọng tài quét QR)

### 3.1 Flow tổng quan

```
Organizer tạo QR ──→ In QR dán ở sân ──→ Trọng tài quét QR
                                              │
                                              ▼
                                    POST /auth/court/qr
                                    { token: "..." }
                                              │
                                              ▼
                                    Nhận court-access JWT
                                    (valid 8 giờ)
                                              │
                                              ▼
                                    Trọng tài thao tác trận
                                    trên sân của mình
```

### 3.2 Referee Screen (sau khi scan QR thành công)

**API xác thực:** `POST /auth/court/qr`

```json
// Request
{ "token": "eyJhbGciOiJIUzI1NiIs..." }

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",  // JWT 8h
  "courtId": "court-uuid",
  "eventId": "event-uuid"
}
```

- Lưu `accessToken` vào localStorage
- Set header: `Authorization: Bearer ${accessToken}`

### 3.3 Referee Match Screen

**API:** `GET /court/matches` (dùng court-access JWT)

```json
// Response: Match[] trên sân này
[
  {
    "id": "match-uuid",
    "name": "Quarter Final 1",
    "status": "SCHEDULED",
    "team1Name": "A & B",
    "team2Name": "C & D",
    "scores": []
  }
]
```

**UI cho trọng tài (mobile-friendly):**

```
┌──────────────────────────────┐
│  San 1 - Quarter Final 1     │
│  ─────────────────────────── │
│                               │
│      A & B                    │
│       vs                      │
│      C & D                    │
│                               │
│  Status: Chờ bắt đầu         │
│                               │
│  ┌───────────────────────┐    │
│  │  ▶️ KHỞI ĐỘNG (Warm-up)│    │ ← POST /court/matches/:id/warm-up
│  └───────────────────────┘    │
│  ┌───────────────────────┐    │
│  │  ▶️ BẮT ĐẦU TRẬN      │    │ ← POST /court/matches/:id/start
│  └───────────────────────┘    │
│                               │
│  (Sau khi bắt đầu)           │
│  ⏱️ 00:00:00                  │
│                               │
│  Score Input:                 │
│  Set 1: [  ] - [  ] [Lưu]    │ ← PATCH /court/matches/:id/score
│  Set 2: [  ] - [  ] [Lưu]    │
│  Set 3: [  ] - [  ] [Lưu]    │
│                               │
│  ┌───────────────────────┐    │
│  │  ✅ KẾT THÚC TRẬN     │    │ ← POST /court/matches/:id/end
│  └───────────────────────┘    │
└──────────────────────────────┘
```

**Referee API endpoints:**

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Xem trận trên sân | GET | `/court/matches` | court-access JWT |
| Khởi động | POST | `/court/matches/:matchId/warm-up` | court-access JWT |
| Bắt đầu | POST | `/court/matches/:matchId/start` | court-access JWT |
| Nhập điểm | PATCH | `/court/matches/:matchId/score` | court-access JWT |
| Kết thúc | POST | `/court/matches/:matchId/end` | court-access JWT |

---

## DATA POLLING STRATEGY

Backend hiện tại chưa có WebSocket. Frontend cần polling:

```typescript
// Court Grid: poll mỗi 5 giây khi đang ở màn dispatch
useEffect(() => {
  const interval = setInterval(() => {
    fetchCourtGrid();   // GET /events/:eventId/courts/grid
    fetchMatchQueue();  // GET /events/:eventId/dispatch/queue
  }, 5000);
  return () => clearInterval(interval);
}, []);

// Referee screen: poll mỗi 3 giây
useEffect(() => {
  const interval = setInterval(() => {
    fetchMyMatches();  // GET /court/matches
  }, 3000);
  return () => clearInterval(interval);
}, []);
```

---

## ERROR HANDLING

Tất cả API errors trả format:

```json
{
  "statusCode": 400,
  "message": "Court already has an active or scheduled match",
  "error": "Bad Request"
}
```

**Các lỗi cần handle UI:**

| Error Message | UI Action |
|---------------|-----------|
| `Court is under maintenance` | Toast warning, không cho drop |
| `Court already has an active or scheduled match` | Toast error, bounce lại card |
| `This court does not allow matches from this category` | Toast warning + highlight sân không tương thích |
| `Cannot delete court with active or scheduled matches` | Toast error, disable nút xóa |
| `Cannot unassign a match that is in progress` | Toast error |
| `QR code has been revoked` | Redirect trọng tài về màn scan lại |
| `Invalid or expired QR token` | Hiển thị "Mã QR không hợp lệ hoặc đã hết hạn" |

---

## MATCH STATUS FLOW

```
PENDING ──(assign to court)──→ SCHEDULED
                                   │
                          ┌────────┤
                          │        ▼
                          │    WARM_UP (optional)
                          │        │
                          ▼        ▼
                       IN_PROGRESS
                          │
                          ▼
                       COMPLETED ──→ Court auto-freed

(At any point before IN_PROGRESS):
  SCHEDULED/WARM_UP ──(unassign)──→ PENDING
```

---

## ENUMS REFERENCE

```typescript
// Court entity status (stored in DB)
enum CourtStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

// Court operational status (computed, not in DB)
enum CourtOperationalStatus {
  AVAILABLE = 'AVAILABLE',     // Active + no match
  RESERVED = 'RESERVED',       // Active + match SCHEDULED
  BUSY = 'BUSY',               // Active + match IN_PROGRESS/WARM_UP
  MAINTENANCE = 'MAINTENANCE', // Court disabled
}

// Match status
enum MatchStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  WARM_UP = 'WARM_UP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```
