import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignProduct, CampaignProductSchema } from './schemas/campaign-product.schema';
import { CampaignPricingPhase, CampaignPricingPhaseSchema } from './schemas/campaign-pricing-phase.schema';
import { CampaignOrder, CampaignOrderSchema } from './schemas/campaign-order.schema';

import { CampaignController } from './campaign.controller';
import { CampaignProductController } from './campaign-product.controller';
import { CampaignOrderController } from './campaign-order.controller';

import { CampaignService } from './campaign.service';
import { CampaignProductService } from './campaign-product.service';
import { CampaignOrderService } from './campaign-order.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignProduct.name, schema: CampaignProductSchema },
      { name: CampaignPricingPhase.name, schema: CampaignPricingPhaseSchema },
      { name: CampaignOrder.name, schema: CampaignOrderSchema },
    ]),
  ],
  controllers: [
    CampaignController,
    CampaignProductController,
    CampaignOrderController,
  ],
  providers: [
    CampaignService,
    CampaignProductService,
    CampaignOrderService,
  ],
  exports: [CampaignService, CampaignOrderService],
})
export class CampaignModule {}
