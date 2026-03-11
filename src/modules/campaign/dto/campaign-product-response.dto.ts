import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampaignProductResponseDto {
  @ApiProperty({ description: 'ID sản phẩm', example: '69b14395fb29ef704b152bc0' })
  _id: string;

  @ApiProperty({ description: 'ID chiến dịch', example: '69b142edfb29ef704b152bb8' })
  campaignId: string;

  @ApiProperty({ description: 'Tên sản phẩm', example: 'Vé 21km Half Marathon' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả sản phẩm', example: 'Cự ly 21km dành cho runner chuyên nghiệp' })
  description?: string;

  @ApiProperty({ description: 'Giá gốc (VNĐ)', example: 280000 })
  originalPrice: number;

  @ApiProperty({ description: 'Giá hiện tại theo phase đang active (VNĐ)', example: 250000 })
  currentPrice: number;

  @ApiPropertyOptional({ description: 'Tên phase đang active', example: 'Early Bird', nullable: true })
  activePhaseName: string | null;

  @ApiPropertyOptional({ description: 'ID phase đang active', example: '69b14395fb29ef704b152bc1', nullable: true })
  activePhaseId: string | null;

  @ApiProperty({ description: 'Tổng số lượng vé', example: 250 })
  totalQuantity: number;

  @ApiProperty({ description: 'Số lượng tối đa mỗi đơn hàng', example: 10 })
  maxPerOrder: number;

  @ApiProperty({ description: 'Thứ tự hiển thị', example: 1 })
  sortOrder: number;

  @ApiProperty({ description: 'Hiển thị sản phẩm', example: true })
  isVisible: boolean;

  @ApiProperty({ description: 'Thời gian tạo', example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật', example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
