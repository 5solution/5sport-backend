import { IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignOrderStatus } from '../enums/campaign-order-status.enum';
import { Type } from 'class-transformer';

export class OrderQueryDto {
  @ApiPropertyOptional({ enum: CampaignOrderStatus })
  @IsOptional()
  @IsEnum(CampaignOrderStatus)
  paymentStatus?: CampaignOrderStatus;

  @ApiPropertyOptional({ description: 'Lọc theo cự ly (km)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
