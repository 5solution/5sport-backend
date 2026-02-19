import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../enums/event-status.enum';
import { SportType } from '../enums/sport-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export class EventResponseDto {
  @ApiProperty({
    description: 'ID sự kiện',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID người tổ chức',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  organizerId: string;

  @ApiProperty({
    description: 'Tên sự kiện',
    example: 'Giải Pickleball Hà Nội 2026',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Thương hiệu',
    example: 'VinSports',
  })
  brand?: string;

  @ApiProperty({
    description: 'Loại hình thể thao',
    enum: SportType,
    example: SportType.PICKLEBALL,
  })
  sportType: SportType;

  @ApiProperty({
    description: 'Hotline hỗ trợ',
    example: '0901234567',
  })
  hotline: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: 'Sân số 1, Đường Láng Hạ',
  })
  address: string;

  @ApiProperty({
    description: 'Mã tỉnh/thành',
    example: '01',
  })
  provinceCode: string;

  @ApiPropertyOptional({
    description: 'Tên tỉnh/thành',
    example: 'Thành phố Hà Nội',
  })
  provinceName?: string;

  @ApiProperty({
    description: 'Mã phường/xã',
    example: '00001',
  })
  wardCode: string;

  @ApiPropertyOptional({
    description: 'Tên phường/xã',
    example: 'Phường Láng Hạ',
  })
  wardName?: string;

  @ApiProperty({
    description: 'Mã tiền tố',
    example: 'PKB',
  })
  prefixCode: string;

  @ApiProperty({
    description: 'Slug URL',
    example: 'giai-pickleball-ha-noi-2026',
  })
  slug: string;

  @ApiProperty({
    description: 'Cho phép chuyển nhượng',
    example: true,
  })
  allowTransfer: boolean;

  @ApiProperty({
    description: 'Trạng thái sự kiện',
    enum: EventStatus,
    example: EventStatus.DRAFT,
  })
  status: EventStatus;

  @ApiProperty({
    description: 'Thời gian bắt đầu',
    example: '2026-03-01T08:00:00Z',
  })
  eventStartTime: Date;

  @ApiProperty({
    description: 'Thời gian kết thúc',
    example: '2026-03-02T18:00:00Z',
  })
  eventEndTime: Date;

  @ApiProperty({
    description: 'Thời gian mở chỉnh sửa',
    example: '2026-02-01T00:00:00Z',
  })
  editInfoOpenTime: Date;

  @ApiProperty({
    description: 'Thời gian đóng chỉnh sửa',
    example: '2026-02-28T23:59:59Z',
  })
  editInfoCloseTime: Date;

  @ApiPropertyOptional({
    description: 'Thời gian mở chuyển nhượng',
    example: '2026-02-15T00:00:00Z',
  })
  transferOpenTime?: Date;

  @ApiPropertyOptional({
    description: 'Thời gian đóng chuyển nhượng',
    example: '2026-02-28T23:59:59Z',
  })
  transferCloseTime?: Date;

  @ApiProperty({
    description: 'Thời gian mở check-in',
    example: '2026-03-01T06:00:00Z',
  })
  checkinOpenTime: Date;

  @ApiProperty({
    description: 'Thời gian đóng check-in',
    example: '2026-03-01T10:00:00Z',
  })
  checkinCloseTime: Date;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    isArray: true,
    example: [PaymentMethod.VNPAY_QR],
  })
  paymentMethods: PaymentMethod[];

  @ApiPropertyOptional({
    description: 'Cấu hình luật thi đấu',
    example: {
      sportType: 'PICKLEBALL',
      scoringMode: 'SIDE_OUT',
      matchFormat: '1_SET',
      pointsToWin: 11,
      winByTwo: true,
      pointCap: 15,
      switchEndsAt: 6,
    },
  })
  scoringConfig?: Record<string, any>;

  @ApiProperty({
    description: 'Banner được bật',
    example: false,
  })
  bannerEnabled: boolean;

  @ApiPropertyOptional({
    description: 'URL hình banner',
    example: 'https://s3.amazonaws.com/bucket/banner.png',
  })
  bannerImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Link CTA banner',
    example: 'https://example.com/sponsor',
  })
  bannerCtaUrl?: string;

  @ApiPropertyOptional({
    description: 'URL file điều khoản',
    example: 'https://s3.amazonaws.com/bucket/terms.pdf',
  })
  termsFileUrl?: string;

  @ApiPropertyOptional({
    description: 'URL file điều kiện',
    example: 'https://s3.amazonaws.com/bucket/conditions.pdf',
  })
  conditionsFileUrl?: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2026-01-15T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2026-02-11T14:20:00Z',
  })
  updated_at: Date;
}

export class SessionResponseDto {
  @ApiProperty({
    description: 'ID hạng mục',
    example: '550e8400-e29b-41d4-a716-446655440100',
  })
  id: string;

  @ApiProperty({
    description: 'ID sự kiện',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  eventId: string;

  @ApiProperty({
    description: 'Tên hạng mục',
    example: 'Thi đấu đơn nam',
  })
  name: string;

  @ApiProperty({
    description: 'Thể thức (SINGLES/DOUBLES)',
    example: 'SINGLES',
  })
  matchType: string;

  @ApiProperty({
    description: 'Yêu cầu partner',
    example: false,
  })
  requirePartner: boolean;

  @ApiProperty({
    description: 'Thời gian bắt đầu',
    example: '2026-03-01T08:00:00Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Thời gian kết thúc',
    example: '2026-03-01T18:00:00Z',
  })
  endTime: Date;

  @ApiProperty({
    description: 'Mã vé',
    example: 'DNM',
  })
  ticketCode: string;

  @ApiPropertyOptional({
    description: 'URL hình vé',
    example: 'https://s3.amazonaws.com/bucket/ticket.png',
  })
  ticketImageUrl?: string;

  @ApiProperty({
    description: 'Bật kiểm tra rating',
    example: false,
  })
  ratingCheckEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Nguồn rating',
    isArray: true,
    example: ['DUPR', 'FIVE_RATING'],
  })
  ratingSources?: string[];

  @ApiPropertyOptional({
    description: 'Rating tối thiểu',
    example: 3.5,
  })
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Rating tối đa',
    example: 5.0,
  })
  maxRating?: number;

  @ApiProperty({
    description: 'Thứ tự hiển thị',
    example: 0,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2026-01-15T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2026-02-11T14:20:00Z',
  })
  updated_at: Date;
}

export class TicketTierResponseDto {
  @ApiProperty({
    description: 'ID loại vé',
    example: '550e8400-e29b-41d4-a716-446655440200',
  })
  id: string;

  @ApiProperty({
    description: 'ID hạng mục',
    example: '550e8400-e29b-41d4-a716-446655440100',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Tên loại vé',
    example: 'Early Bird',
  })
  name: string;

  @ApiProperty({
    description: 'Vé miễn phí',
    example: false,
  })
  isFree: boolean;

  @ApiPropertyOptional({
    description: 'Giá vé (VND)',
    example: 500000,
  })
  price?: number;

  @ApiProperty({
    description: 'Tổng số vé',
    example: 100,
  })
  totalQuantity: number;

  @ApiProperty({
    description: 'Tối thiểu/đơn',
    example: 1,
  })
  minPerOrder: number;

  @ApiProperty({
    description: 'Tối đa/đơn',
    example: 5,
  })
  maxPerOrder: number;

  @ApiProperty({
    description: 'Hiển thị',
    example: true,
  })
  isVisible: boolean;

  @ApiProperty({
    description: 'Ngày bắt đầu bán',
    example: '2026-02-01T00:00:00Z',
  })
  saleStartTime: Date;

  @ApiProperty({
    description: 'Ngày ngưng bán',
    example: '2026-02-28T23:59:59Z',
  })
  saleEndTime: Date;

  @ApiProperty({
    description: 'Thứ tự hiển thị',
    example: 0,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2026-01-15T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2026-02-11T14:20:00Z',
  })
  updated_at: Date;
}

export class CustomFieldResponseDto {
  @ApiProperty({
    description: 'ID trường dữ liệu',
    example: '550e8400-e29b-41d4-a716-446655440300',
  })
  id: string;

  @ApiProperty({
    description: 'ID sự kiện',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  eventId: string;

  @ApiProperty({
    description: 'Label hiển thị',
    example: 'Họ và tên',
  })
  label: string;

  @ApiProperty({
    description: 'Tên trường',
    example: 'fullName',
  })
  fieldName: string;

  @ApiPropertyOptional({
    description: 'Mô tả',
    example: 'Nhập đầy đủ họ và tên',
  })
  description?: string;

  @ApiProperty({
    description: 'Loại trường',
    example: 'TEXT',
  })
  fieldType: string;

  @ApiPropertyOptional({
    description: 'Các lựa chọn',
    isArray: true,
    example: ['Nam', 'Nữ'],
  })
  options?: string[];

  @ApiPropertyOptional({
    description: 'Định dạng file cho phép',
    isArray: true,
    example: ['jpg', 'png'],
  })
  allowedFileTypes?: string[];

  @ApiPropertyOptional({
    description: 'Giá trị mặc định',
    example: 'Việt Nam',
  })
  defaultValue?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh đính kèm',
    example: 'https://s3.amazonaws.com/bucket/guide.png',
  })
  attachmentUrl?: string;

  @ApiPropertyOptional({
    description: 'Mapping DB',
    example: 'participantName',
  })
  dbMapping?: string;

  @ApiProperty({
    description: 'Bắt buộc',
    example: false,
  })
  isRequired: boolean;

  @ApiProperty({
    description: 'Hiển thị',
    example: true,
  })
  isVisible: boolean;

  @ApiProperty({
    description: 'Thứ tự hiển thị',
    example: 0,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2026-01-15T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2026-02-11T14:20:00Z',
  })
  updated_at: Date;
}

export class BlacklistResponseDto {
  @ApiProperty({
    description: 'ID mục blacklist',
    example: '550e8400-e29b-41d4-a716-446655440400',
  })
  id: string;

  @ApiProperty({
    description: 'ID sự kiện',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  eventId: string;

  @ApiProperty({
    description: 'Loại (EMAIL/PHONE)',
    example: 'EMAIL',
  })
  type: string;

  @ApiProperty({
    description: 'Giá trị (email hoặc SĐT)',
    example: 'spam@example.com',
  })
  value: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2026-02-11T14:20:00Z',
  })
  created_at: Date;
}

export class DescriptionResponseDto {
  @ApiProperty({
    description: 'ID mô tả',
    example: '550e8400-e29b-41d4-a716-446655440500',
  })
  id: string;

  @ApiProperty({
    description: 'ID sự kiện',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  eventId: string;

  @ApiPropertyOptional({
    description: 'Tiêu đề',
    example: 'Giới thiệu giải đấu',
  })
  title?: string;

  @ApiProperty({
    description: 'Nội dung',
    example: '<p>Giải đấu lớn nhất 2026...</p>',
  })
  content: string;

  @ApiProperty({
    description: 'Thứ tự hiển thị',
    example: 0,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2026-01-15T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2026-02-11T14:20:00Z',
  })
  updated_at: Date;
}
