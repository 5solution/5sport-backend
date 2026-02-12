import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTicketTierDto {
  @ApiProperty({
    description: 'Tên loại vé/giai đoạn',
    example: 'Early Bird',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiPropertyOptional({
    description: 'Vé miễn phí (nếu true thì price = null)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFree?: boolean;

  @ApiPropertyOptional({
    description: 'Giá vé (VND, null nếu isFree=true)',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiProperty({
    description: 'Tổng số lượng vé',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  totalQuantity: number;

  @ApiPropertyOptional({
    description: 'Số lượng vé tối thiểu mỗi đơn hàng',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minPerOrder?: number;

  @ApiProperty({
    description: 'Số lượng vé tối đa mỗi đơn hàng',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxPerOrder: number;

  @ApiPropertyOptional({
    description: 'Hiển thị giai đoạn vé trên UI',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVisible?: boolean;

  @ApiProperty({
    description: 'Ngày bắt đầu bán (ISO 8601)',
    example: '2026-02-01T00:00:00Z',
  })
  @IsDateString()
  saleStartTime: string;

  @ApiProperty({
    description: 'Ngày ngưng bán (ISO 8601)',
    example: '2026-02-28T23:59:59Z',
  })
  @IsDateString()
  saleEndTime: string;
}
