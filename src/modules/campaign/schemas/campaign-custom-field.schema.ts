import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CampaignFieldType } from '../enums/campaign-field-type.enum';

export type CampaignCustomFieldDocument = HydratedDocument<CampaignCustomField>;

@Schema({ timestamps: true, collection: 'campaigncustomfields' })
export class CampaignCustomField {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  fieldName: string;

  @Prop({ type: String, enum: CampaignFieldType, required: true })
  fieldType: CampaignFieldType;

  @Prop({ type: [String] })
  options: string[];

  @Prop()
  dbMapping: string;

  @Prop({ required: true, default: false })
  isRequired: boolean;

  @Prop({ required: true, default: 0 })
  sortOrder: number;
}

export const CampaignCustomFieldSchema = SchemaFactory.createForClass(CampaignCustomField);
