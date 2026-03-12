Plan: Court Configuration, QR Auth, & Tournament Operations
Context
5Sport backend cần bổ sung hệ thống quản lý sân thi đấu, xác thực trọng tài qua QR, và điều hành sự kiện real-time. Hiện tại:

Match entity chỉ có courtNumber (số đơn giản), không có Court entity
Không có QR auth, không có referee flow
Match status thiếu PENDING và WARM_UP
Không có logic dispatch (gán trận vào sân, auto-assign)
Mục tiêu: Xây dựng đầy đủ Court module, QR-based referee auth, và Dispatch module cho điều hành giải đấu.

Decisions
Quyết định	Lựa chọn
Auth trọng tài	Court-scoped JWT (không tạo REFEREE role)
Module structure	Court + Dispatch là module riêng
Match status	Giữ IN_PROGRESS, thêm PENDING + WARM_UP
Scope	Full: Court + QR + Dispatch
Phase 1: Court Entity & CRUD
1.1 Tạo Court entity & enum
New file: src/modules/court/entities/court.entity.ts


Table: courts
- id: UUID (PK)
- eventId: UUID (FK → events.id, CASCADE delete, indexed)
- name: varchar(100)
- sortOrder: integer, default 0
- status: CourtStatus enum (ACTIVE, MAINTENANCE), default ACTIVE
- accessSecret: varchar(64) — random hex cho QR
- isGhost: boolean, default false
- allowedSessionIds: text (simple-array, nullable) — category filtering
- created_at, updated_at
New file: src/modules/court/enums/court-status.enum.ts


export enum CourtStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}
1.2 Modify Match entity
File: src/modules/event/entities/match.entity.ts

Add courtId: UUID | null (FK → courts.id, SET NULL on delete, indexed)
Add ManyToOne(() => Court) relation
Add priority: integer, default 0
Expand MatchStatus enum: thêm PENDING (before SCHEDULED) và WARM_UP (after SCHEDULED)
Giữ nguyên courtNumber cho backward compat
1.3 Migration
New file: src/migrations/<timestamp>-add-courts-and-match-updates.ts

CREATE TYPE courts_status_enum
CREATE TABLE courts
ALTER TYPE matches_status_enum ADD VALUE 'PENDING', 'WARM_UP'
ALTER TABLE matches ADD COLUMN court_id, priority
1.4 Court service & controller
New files:

src/modules/court/court.service.ts
src/modules/court/court.controller.ts
src/modules/court/court.module.ts
CourtService methods:

Method	Mô tả
bulkCreate(eventId, count)	Tạo N sân: "Sân 1"..."Sân N", generate random accessSecret
addOne(eventId, dto)	Thêm 1 sân mới
findAllByEvent(eventId)	List sân của event
findOne(id)	Chi tiết 1 sân
update(id, dto)	Sửa name, status, allowedSessionIds
remove(id)	Xóa sân (validate: không có match IN_PROGRESS/WARM_UP/SCHEDULED)
getCourtGrid(eventId)	Computed status: AVAILABLE/RESERVED/BUSY/MAINTENANCE dựa trên match
DTOs:

src/modules/court/dto/create-courts-bulk.dto.ts — { count: number }
src/modules/court/dto/create-court.dto.ts — { name, allowedSessionIds?, isGhost? }
src/modules/court/dto/update-court.dto.ts — { name?, status?, allowedSessionIds? }
Endpoints (/events/:eventId/courts):

Method	Path	Mô tả
POST	/bulk	Bulk create N sân
POST	/	Thêm 1 sân
GET	/	List tất cả sân
GET	/grid	Court grid (kèm computed operational status + current match)
GET	/:courtId	Chi tiết sân
PATCH	/:courtId	Cập nhật sân
DELETE	/:courtId	Xóa sân
Auth: JwtAuthGuard + @Roles(ADMIN, ORGANIZER)

Phase 2: QR Auth Flow
2.1 Court QR generation
Add to CourtService:

Method	Mô tả
getQrPayload(courtId)	Tạo JWT: { eventId, courtId, secret: court.accessSecret, type: 'court-qr' } → trả URL + token
rotateSecret(courtId)	Tạo mới accessSecret, invalidate QR cũ
Add endpoints to CourtController:

Method	Path	Mô tả
GET	/:courtId/qr	Lấy QR data (URL + token)
POST	/:courtId/rotate-qr	Tạo mã QR mới
2.2 Court access authentication
New files:

src/modules/court/strategies/court-jwt.strategy.ts — Passport strategy name 'court-jwt'
src/modules/court/guards/court-access.guard.ts — AuthGuard('court-jwt')
src/modules/court/decorators/current-court.decorator.ts — extract { courtId, eventId }
src/modules/court/court-access.controller.ts
Flow:

Organizer tạo QR → JWT chứa { eventId, courtId, secret, type: 'court-qr' }
QR encode URL: https://match.5sport.vn/auth/qr?t=${token}
Trọng tài scan → Frontend gọi POST /auth/court/qr với token
Backend verify secret khớp court.accessSecret → trả JWT ngắn hạn (8h): { sub: courtId, eventId, type: 'court-access' }
Trọng tài dùng JWT này để gọi court-scoped APIs
Endpoint:

Method	Path	Auth	Mô tả
POST	/auth/court/qr	Public	Validate QR token → trả court-access JWT
2.3 Court-scoped match controller
New file: src/modules/court/court-match.controller.ts

Referee dùng court-access JWT để điều khiển trận trên sân mình:

Method	Path	Mô tả
GET	/court/matches	Xem trận trên sân mình
POST	/court/matches/:matchId/warm-up	SCHEDULED → WARM_UP
POST	/court/matches/:matchId/start	SCHEDULED/WARM_UP → IN_PROGRESS
POST	/court/matches/:matchId/end	IN_PROGRESS → COMPLETED + nhập score
PATCH	/court/matches/:matchId/score	Cập nhật tỷ số từng set
Auth: CourtAccessGuard — validate courtId từ JWT khớp với match.courtId

Phase 3: Dispatch / Tournament Operations
3.1 Dispatch module
New files:

src/modules/dispatch/dispatch.module.ts
src/modules/dispatch/dispatch.service.ts
src/modules/dispatch/dispatch.controller.ts
DispatchService methods:

Method	Mô tả
getMatchQueue(eventId, filters)	List PENDING matches, filter theo sessionId, sort theo priority + createdAt
assignMatchToCourt(matchId, courtId)	Validate: court ACTIVE + AVAILABLE + category compatible → set courtId, status=SCHEDULED
unassignMatch(matchId)	Trả match về PENDING, clear courtId
autoAssign(eventId, sessionId?)	Tìm sân trống + pending matches → gán tự động, trả preview trước khi confirm
swapCourt(matchId, newCourtId)	Đổi sân giữa chừng (giữ nguyên timer + score)
DTOs:

src/modules/dispatch/dto/assign-match.dto.ts — { matchId, courtId }
src/modules/dispatch/dto/auto-assign-result.dto.ts — preview kết quả auto-assign
src/modules/dispatch/dto/match-queue-query.dto.ts — { sessionId?, page?, limit? }
Endpoints (/events/:eventId/dispatch):

Method	Path	Mô tả
GET	/queue	Match queue (PENDING matches)
POST	/assign	Gán match vào court
POST	/unassign	Gỡ match khỏi court
POST	/auto-assign	Auto-assign algorithm
POST	/swap-court	Đổi sân
Auth: JwtAuthGuard + @Roles(ADMIN, ORGANIZER)

3.2 Auto-assign algorithm
Lấy courts ACTIVE có computed status AVAILABLE
Lấy PENDING matches, sort: priority DESC → round importance → created_at ASC
Loop: match mỗi court với match tương thích (allowedSessionIds check)
Trả preview: [{ courtId, courtName, matchId, matchName }]
Client confirm → batch assign
3.3 Match lifecycle updates
Modify: src/modules/event/match.service.ts

startMatch(): cho phép transition từ cả SCHEDULED và WARM_UP
endMatch(): sau khi COMPLETED, auto clear court availability (computed, không cần update court)
3.4 Court computed operational status logic

if court.status === MAINTENANCE → MAINTENANCE
else if court has match with status IN_PROGRESS/WARM_UP → BUSY
else if court has match with status SCHEDULED → RESERVED
else → AVAILABLE
Tính tại query time bằng LEFT JOIN, không lưu trên entity.

File Structure Summary

src/modules/court/
├── court.module.ts
├── court.service.ts
├── court.controller.ts              # CRUD + QR endpoints
├── court-access.controller.ts       # POST /auth/court/qr
├── court-match.controller.ts        # Referee endpoints /court/matches
├── entities/
│   └── court.entity.ts
├── enums/
│   └── court-status.enum.ts
├── dto/
│   ├── create-courts-bulk.dto.ts
│   ├── create-court.dto.ts
│   └── update-court.dto.ts
├── guards/
│   └── court-access.guard.ts
├── strategies/
│   └── court-jwt.strategy.ts
└── decorators/
    └── current-court.decorator.ts

src/modules/dispatch/
├── dispatch.module.ts
├── dispatch.service.ts
├── dispatch.controller.ts
└── dto/
    ├── assign-match.dto.ts
    ├── auto-assign-result.dto.ts
    └── match-queue-query.dto.ts
Modified Existing Files
File	Thay đổi
src/modules/event/entities/match.entity.ts	Thêm courtId FK, priority, expand MatchStatus enum
src/modules/event/match.service.ts	Update startMatch cho WARM_UP, endMatch logic
src/modules/event/event.module.ts	Import Court entity nếu cần
src/modules/app.module.ts	Register CourtModule + DispatchModule
src/config/index.ts	Thêm COURT_QR_EXPIRY config (optional)
Implementation Order
Phase 1 — Court entity, enum, migration, CRUD service/controller
Phase 2 — QR generation, court-jwt strategy, court-access guard, referee endpoints
Phase 3 — Dispatch module, assign/unassign/auto-assign, match lifecycle updates
Verification
Court CRUD: Tạo event → bulk create 8 sân → list → update tên → delete sân trống
QR flow: Lấy QR data → call /auth/court/qr với token → nhận court-access JWT → dùng JWT gọi /court/matches
Dispatch: Tạo matches (PENDING) → assign vào court → verify status=SCHEDULED → start → score → end → verify court freed
Auto-assign: Tạo 5 sân + 10 pending matches → auto-assign → verify 5 matches assigned
Guard test: Court-access JWT chỉ access được match trên court mình, reject match court khác
Edge cases: Xóa court có match SCHEDULED (nên block hoặc unassign trước), rotate QR rồi dùng token cũ (reject)