import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Campaign ID' })
  campaignId: string;

  @ApiProperty({ example: 'ORD-M6X2K4-AB1C', description: 'Unique order code' })
  orderCode: string;
}
