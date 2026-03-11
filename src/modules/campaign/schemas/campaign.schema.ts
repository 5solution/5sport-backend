import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CampaignStatus } from '../enums/campaign-status.enum';

export type CampaignDocument = HydratedDocument<Campaign>;

@Schema({ timestamps: true, collection: 'campaigns' })
export class Campaign {
  @Prop({ required: true })
  creatorId: string;

  @Prop({ required: true, maxlength: 256 })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  bannerUrl: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: String, enum: CampaignStatus, default: CampaignStatus.DRAFT, index: true })
  status: CampaignStatus;

  @Prop({
    type: [{ distance: String, price: Number }],
    default: [],
  })
  distances: { distance: string; price: number }[];

  @Prop()
  groupName: string;

  @Prop()
  groupLeader: string;

  @Prop()
  zaloGroupUrl: string;

  @Prop()
  hotline: string;

  @Prop()
  regulationsUrl: string;

  @Prop()
  fanpageUrl: string;

  @Prop({ type: Object })
  paymentConfig: Record<string, any>;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.index({ creatorId: 1 });
