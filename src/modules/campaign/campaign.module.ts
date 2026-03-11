import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignOrder, CampaignOrderSchema } from './schemas/campaign-order.schema';

import { CampaignController } from './campaign.controller';
import { CampaignOrderController } from './campaign-order.controller';

import { CampaignService } from './campaign.service';
import { CampaignOrderService } from './campaign-order.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignOrder.name, schema: CampaignOrderSchema },
    ]),
  ],
  controllers: [
    CampaignController,
    CampaignOrderController,
  ],
  providers: [
    CampaignService,
    CampaignOrderService,
  ],
  exports: [CampaignService, CampaignOrderService],
})
export class CampaignModule {}
