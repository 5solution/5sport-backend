import { IsString, IsDateString, IsOptional, IsObject, MaxLength, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DistanceItemDto {
  @ApiProperty({ example: 5, description: 'Cự ly (km)' })
  @IsNumber()
  distance: number;

  @ApiProperty({ example: 200000, description: 'Giá (VND)' })
  @IsNumber()
  price: number;
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    type: [DistanceItemDto],
    example: [{ distance: 5, price: 200000 }, { distance: 10, price: 350000 }],
    description: 'Danh sách cự ly và giá',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistanceItemDto)
  distances?: DistanceItemDto[];

  @ApiPropertyOptional({ description: 'Tên nhóm' })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({ description: 'Trưởng nhóm' })
  @IsOptional()
  @IsString()
  groupLeader?: string;

  @ApiPropertyOptional({ description: 'Link nhóm Zalo' })
  @IsOptional()
  @IsString()
  zaloGroupUrl?: string;

  @ApiPropertyOptional({ description: 'Hotline' })
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiPropertyOptional({ description: 'Link điều lệ giải' })
  @IsOptional()
  @IsString()
  regulationsUrl?: string;

  @ApiPropertyOptional({ description: 'Link fanpage' })
  @IsOptional()
  @IsString()
  fanpageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  paymentConfig?: Record<string, any>;
}
