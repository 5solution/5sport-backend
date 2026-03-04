import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { SportType } from '../enums/sport-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreateEventDto {
  @ApiProperty({
    description: 'Tên sự kiện',
    example: 'Giải Pickleball Hà Nội 2026',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiPropertyOptional({
    description: 'Thương hiệu/Nhà tài trợ',
    example: 'VinSports',
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  brand?: string;

  @ApiProperty({
    description: 'Loại hình thể thao',
    enum: SportType,
    example: SportType.PICKLEBALL,
  })
  @IsEnum(SportType)
  sportType: SportType;

  @ApiProperty({
    description: 'Số điện thoại hỗ trợ',
    example: '0901234567',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  hotline: string;

  @ApiProperty({
    description: 'Địa chỉ chi tiết tổ chức sự kiện',
    example: 'Sân số 1, Đường Láng Hạ, Quận Đống Đa',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Mã tỉnh/thành phố',
    example: '01',
  })
  @IsString()
  provinceCode: string;

  @ApiProperty({
    description: 'Mã phường/xã',
    example: '00001',
  })
  @IsString()
  wardCode: string;

  @ApiProperty({
    description: 'Mã tiền tố (tối đa 6 ký tự, tự động chuyển in hoa)',
    example: 'PKB',
    maxLength: 6,
  })
  @IsString()
  @MaxLength(6)
  @Transform(({ value }) => value?.toUpperCase())
  prefixCode: string;

  @ApiPropertyOptional({
    description: 'Slug URL (tự động sinh nếu không cung cấp)',
    example: 'giai-pickleball-ha-noi-2026',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Cho phép chuyển nhượng vé',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  allowTransfer?: boolean;

  @ApiPropertyOptional({
    description: 'Yêu cầu đăng ký theo cặp (partner)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requirePartner?: boolean;

  @ApiProperty({
    description: 'Thời gian bắt đầu sự kiện (ISO 8601)',
    example: '2026-03-01T08:00:00Z',
  })
  @IsDateString()
  eventStartTime: string;

  @ApiProperty({
    description: 'Thời gian kết thúc sự kiện (ISO 8601)',
    example: '2026-03-02T18:00:00Z',
  })
  @IsDateString()
  eventEndTime: string;

  @ApiProperty({
    description: 'Thời gian mở chỉnh sửa thông tin (ISO 8601)',
    example: '2026-02-01T00:00:00Z',
  })
  @IsDateString()
  editInfoOpenTime: string;

  @ApiProperty({
    description: 'Thời gian đóng chỉnh sửa thông tin (ISO 8601)',
    example: '2026-02-28T23:59:59Z',
  })
  @IsDateString()
  editInfoCloseTime: string;

  @ApiPropertyOptional({
    description: 'Thời gian mở chuyển nhượng (bắt buộc nếu allowTransfer=true)',
    example: '2026-02-15T00:00:00Z',
  })
  @ValidateIf((o) => o.allowTransfer !== false)
  @IsDateString()
  transferOpenTime?: string;

  @ApiPropertyOptional({
    description: 'Thời gian đóng chuyển nhượng (bắt buộc nếu allowTransfer=true)',
    example: '2026-02-28T23:59:59Z',
  })
  @ValidateIf((o) => o.allowTransfer !== false)
  @IsDateString()
  transferCloseTime?: string;

  @ApiProperty({
    description: 'Thời gian mở check-in (ISO 8601)',
    example: '2026-03-01T06:00:00Z',
  })
  @IsDateString()
  checkinOpenTime: string;

  @ApiProperty({
    description: 'Thời gian đóng check-in (ISO 8601)',
    example: '2026-03-01T10:00:00Z',
  })
  @IsDateString()
  checkinCloseTime: string;

  @ApiProperty({
    description: 'Danh sách phương thức thanh toán',
    enum: PaymentMethod,
    isArray: true,
    example: [PaymentMethod.VNPAY_QR, PaymentMethod.DOMESTIC_CARD],
  })
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethods: PaymentMethod[];
}
