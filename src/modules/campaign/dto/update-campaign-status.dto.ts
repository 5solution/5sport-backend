import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignStatus } from '../enums/campaign-status.enum';

export class UpdateCampaignStatusDto {
  @ApiProperty({ enum: CampaignStatus })
  @IsEnum(CampaignStatus)
  status: CampaignStatus;
}
