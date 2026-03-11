import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CampaignPricingPhaseDocument = HydratedDocument<CampaignPricingPhase>;

@Schema({ timestamps: true, collection: 'campaignpricingphases' })
export class CampaignPricingPhase {
  @Prop({ type: Types.ObjectId, ref: 'CampaignProduct', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, default: 0 })
  sortOrder: number;
}

export const CampaignPricingPhaseSchema = SchemaFactory.createForClass(CampaignPricingPhase);
