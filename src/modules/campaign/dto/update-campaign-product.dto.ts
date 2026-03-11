import { PartialType } from '@nestjs/mapped-types';
import { CreateCampaignProductDto } from './create-campaign-product.dto';

export class UpdateCampaignProductDto extends PartialType(CreateCampaignProductDto) {}
