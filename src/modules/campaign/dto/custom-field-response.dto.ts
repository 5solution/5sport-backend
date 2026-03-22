import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignFieldType } from '../enums/campaign-field-type.enum';

export class CustomFieldResponseDto {
  @ApiProperty({ example: '65abc123def456789xyz0001' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  campaignId: string;

  @ApiProperty({ example: 'Nhóm máu' })
  label: string;

  @ApiProperty({ example: 'bloodType' })
  fieldName: string;

  @ApiProperty({ enum: CampaignFieldType, example: 'SELECT' })
  fieldType: CampaignFieldType;

  @ApiPropertyOptional({ type: [String], example: ['A', 'B', 'AB', 'O'] })
  options?: string[];

  @ApiPropertyOptional({ example: 'bloodType' })
  dbMapping?: string;

  @ApiProperty({ example: false })
  isRequired: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-11T16:47:18.041Z' })
  updatedAt: Date;
}
