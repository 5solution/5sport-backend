import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignOrderStatus } from '../enums/campaign-order-status.enum';

export class OrderQueryDto {
  @ApiPropertyOptional({ enum: CampaignOrderStatus })
  @IsOptional()
  @IsEnum(CampaignOrderStatus)
  paymentStatus?: CampaignOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

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
