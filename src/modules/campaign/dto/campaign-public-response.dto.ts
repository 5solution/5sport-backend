import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '../enums/campaign-status.enum';

export class DistanceItemResponseDto {
  @ApiProperty({ example: '5km', description: 'Cự ly' })
  distance: string;

  @ApiProperty({ example: 200000, description: 'Giá (VND)' })
  price: number;
}

export class CampaignPublicResponseDto {
  @ApiProperty({ example: '65abc123def456789xyz0001', description: 'ID chiến dịch' })
  id: string;

  @ApiProperty({ example: '5BIB Marathon 2024', description: 'Tên chiến dịch' })
  name: string;

  @ApiProperty({ example: '5bib-marathon-2024', description: 'Slug URL' })
  slug: string;

  @ApiPropertyOptional({ example: 'Giải marathon quốc tế', description: 'Mô tả' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg', description: 'Ảnh banner' })
  bannerUrl?: string;

  @ApiProperty({ example: '2024-03-15T00:00:00Z', description: 'Thời gian bắt đầu' })
  startTime: Date;

  @ApiProperty({ example: '2024-04-15T23:59:59Z', description: 'Thời gian kết thúc' })
  endTime: Date;

  @ApiProperty({ enum: CampaignStatus, example: 'ACTIVE', description: 'Trạng thái' })
  status: CampaignStatus;

  @ApiProperty({
    type: [DistanceItemResponseDto],
    description: 'Danh sách cự ly và giá',
  })
  distances: DistanceItemResponseDto[];

  @ApiPropertyOptional({ example: '5BIB Running Club', description: 'Tên nhóm' })
  groupName?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Trưởng nhóm' })
  groupLeader?: string;

  @ApiPropertyOptional({ example: 'https://zalo.me/5bib', description: 'Link nhóm Zalo' })
  zaloGroupUrl?: string;

  @ApiPropertyOptional({ example: '0901234567', description: 'Hotline liên hệ' })
  hotline?: string;

  @ApiPropertyOptional({ example: 'https://example.com/regulations.pdf', description: 'Link điều lệ' })
  regulationsUrl?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/5bib', description: 'Link fanpage' })
  fanpageUrl?: string;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z', description: 'Thời gian tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z', description: 'Thời gian cập nhật' })
  updatedAt: Date;
}
