import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '../enums/campaign-status.enum';
import { DistanceItemResponseDto } from './campaign-public-response.dto';

export class CampaignResponseDto {
  @ApiProperty({ example: '65abc123def456789xyz0001' })
  id: string;

  @ApiProperty({ example: 'user123' })
  creatorId: string;

  @ApiProperty({ example: '5BIB Marathon 2024' })
  name: string;

  @ApiProperty({ example: '5bib-marathon-2024' })
  slug: string;

  @ApiPropertyOptional({ example: 'Giải marathon quốc tế' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  bannerUrl?: string;

  @ApiProperty({ example: '2024-03-15T00:00:00Z' })
  startTime: Date;

  @ApiProperty({ example: '2024-04-15T23:59:59Z' })
  endTime: Date;

  @ApiProperty({ enum: CampaignStatus, example: 'DRAFT' })
  status: CampaignStatus;

  @ApiProperty({ type: [DistanceItemResponseDto] })
  distances: DistanceItemResponseDto[];

  @ApiPropertyOptional({ example: '5BIB Running Club' })
  groupName?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  groupLeader?: string;

  @ApiPropertyOptional({ example: 'https://zalo.me/5bib' })
  zaloGroupUrl?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  hotline?: string;

  @ApiPropertyOptional({ example: 'https://example.com/regulations.pdf' })
  regulationsUrl?: string;

  @ApiPropertyOptional()
  regulations?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/5bib' })
  fanpageUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['S', 'M', 'L', 'XL'] })
  sizeShirtOptions?: string[];

  @ApiPropertyOptional()
  paymentConfig?: Record<string, any>;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  updatedAt: Date;
}
