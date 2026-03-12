import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignOrderStatus } from '../enums/campaign-order-status.enum';

export class OrderPublicResponseDto {
  @ApiProperty({ example: 'ORD-M6X2K4-AB1C', description: 'Mã đơn hàng' })
  orderCode: string;

  @ApiProperty({ example: 'Nguyễn', description: 'Họ' })
  lastName: string;

  @ApiProperty({ example: 'Văn A', description: 'Tên' })
  firstName: string;

  @ApiProperty({ enum: CampaignOrderStatus, example: CampaignOrderStatus.PAID, description: 'Trạng thái thanh toán' })
  paymentStatus: CampaignOrderStatus;

  @ApiPropertyOptional({ example: 'PAY-123456', description: 'Mã giao dịch thanh toán' })
  paymentId: string | null;

  @ApiPropertyOptional({ example: '2026-03-12T08:00:00.000Z', description: 'Thời gian thanh toán thành công' })
  paidAt: Date | null;
}
