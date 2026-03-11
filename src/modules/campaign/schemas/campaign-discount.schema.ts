import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DiscountType } from '../enums/discount-type.enum';

export type CampaignDiscountDocument = HydratedDocument<CampaignDiscount>;

@Schema({ timestamps: true, collection: 'campaigndiscounts' })
export class CampaignDiscount {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ type: String, enum: DiscountType, required: true })
  discountType: DiscountType;

  @Prop({ required: true })
  discountValue: number;

  @Prop()
  maxUses: number;

  @Prop({ required: true, default: 0 })
  usedCount: number;

  @Prop()
  minOrderAmount: number;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, default: true, index: true })
  isActive: boolean;
}

export const CampaignDiscountSchema = SchemaFactory.createForClass(CampaignDiscount);
