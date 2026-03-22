import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignOrderStatus } from '../enums/campaign-order-status.enum';
import { AthleteInfo } from '../schemas/campaign-order.schema';

export class OrderResponseDto {
  @ApiProperty({ example: '65abc123def456789xyz0001' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  campaignId: string;

  @ApiProperty({ example: 'ORD-M6X2K4-AB1C' })
  orderCode: string;

  @ApiProperty({ example: 'Nguyễn' })
  lastName: string;

  @ApiProperty({ example: 'Văn A' })
  firstName: string;

  @ApiPropertyOptional({ example: 'email@example.com' })
  email?: string;

  @ApiProperty({ example: '0901234567' })
  phoneNumber: string;

  @ApiProperty({ example: 500000 })
  totalAmount: number;

  @ApiProperty({ example: 50000 })
  discountAmount: number;

  @ApiProperty({ example: 450000 })
  finalAmount: number;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  discountId?: string;

  @ApiProperty({ enum: CampaignOrderStatus, example: 'PAID' })
  paymentStatus: CampaignOrderStatus;

  @ApiPropertyOptional({ example: 'PAY-123456' })
  paymentId?: string;

  @ApiPropertyOptional({ example: 'sepay' })
  paymentProvider?: string;

  @ApiPropertyOptional({ example: 'TXN-789' })
  providerTransactionId?: string;

  @ApiPropertyOptional({ example: '2026-03-12T08:00:00.000Z' })
  paidAt?: Date;

  @ApiProperty({ type: [Object], description: 'Danh sách vận động viên' })
  athletes: AthleteInfo[];

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  orderDate: Date;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  updatedAt: Date;
}
