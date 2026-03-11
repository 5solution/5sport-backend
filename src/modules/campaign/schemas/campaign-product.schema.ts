import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CampaignProductDocument = HydratedDocument<CampaignProduct>;

@Schema({ timestamps: true, collection: 'campaignproducts' })
export class CampaignProduct {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  originalPrice: number;

  @Prop({ required: true })
  totalQuantity: number;

  @Prop({ required: true, default: 10 })
  maxPerOrder: number;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  @Prop({ required: true, default: true })
  isVisible: boolean;
}

export const CampaignProductSchema = SchemaFactory.createForClass(CampaignProduct);
