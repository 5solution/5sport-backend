import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '../enums/discount-type.enum';

export class DiscountResponseDto {
  @ApiProperty({ example: '65abc123def456789xyz0001' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  campaignId: string;

  @ApiProperty({ example: 'SUMMER2024' })
  code: string;

  @ApiProperty({ enum: DiscountType, example: 'PERCENTAGE' })
  discountType: DiscountType;

  @ApiProperty({ example: 10 })
  discountValue: number;

  @ApiPropertyOptional({ example: 100 })
  maxUses?: number;

  @ApiProperty({ example: 5 })
  usedCount: number;

  @ApiPropertyOptional({ example: 100000 })
  minOrderAmount?: number;

  @ApiProperty({ example: '2024-03-15T00:00:00Z' })
  startTime: Date;

  @ApiProperty({ example: '2024-04-15T23:59:59Z' })
  endTime: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  updatedAt: Date;
}

export class ValidateDiscountResponseDto {
  @ApiProperty({ type: DiscountResponseDto })
  discount: DiscountResponseDto;

  @ApiProperty({ example: 50000 })
  discountAmount: number;
}
