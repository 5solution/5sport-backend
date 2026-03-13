import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CampaignOrderStatus } from '../enums/campaign-order-status.enum';
import { Gender } from '../enums/gender.enum';

export class GuardianInfo {
  fullName: string;
  dateOfBirth: Date;
  identityCard: string;
  email: string;
  phoneNumber: string;
  relationship: string;
}

export class AthleteInfo {
  distance: string;
  unitPrice: number;
  lastName: string;
  firstName: string;
  phoneNumber: string;
  email: string;
  gender: Gender;
  identityCard: string;
  location: string;
  national: string;
  provinceCode: string;
  dateOfBirth: Date;
  sizeShirt: string;
  club: string;
  nameInBib: string;
  guardian: GuardianInfo;
  medicalInformationPhoneNumber: string;
  medicalInformationName: string;
  medicalInformation: string;
  typeOfMedicine: string;
  bloodType: string;
}

export type CampaignOrderDocument = HydratedDocument<CampaignOrder>;

@Schema({ timestamps: true, collection: 'campaignorders' })
export class CampaignOrder {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  orderCode: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true, default: 0 })
  discountAmount: number;

  @Prop({ required: true })
  finalAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'CampaignDiscount' })
  discountId: Types.ObjectId;

  @Prop({ type: String, enum: CampaignOrderStatus, default: CampaignOrderStatus.PENDING, index: true })
  paymentStatus: CampaignOrderStatus;

  @Prop()
  paymentId: string;

  @Prop({ type: String, default: null })
  paymentProvider: string | null;

  @Prop({ type: String, default: null })
  providerTransactionId: string | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ type: Object, default: null })
  paymentMetadata: Record<string, any> | null;

  @Prop({
    type: [
      {
        distance: String,
        unitPrice: Number,
        lastName: String,
        firstName: String,
        phoneNumber: String,
        email: { type: String, required: true },
        gender: { type: String, enum: Gender },
        identityCard: String,
        location: String,
        national: String,
        provinceCode: String,
        dateOfBirth: Date,
        sizeShirt: String,
        club: String,
        nameInBib: String,
        guardian: {
          fullName: String,
          dateOfBirth: Date,
          identityCard: String,
          email: String,
          phoneNumber: String,
          relationship: String,
        },
        medicalInformationPhoneNumber: String,
        medicalInformationName: String,
        medicalInformation: String,
        typeOfMedicine: String,
        bloodType: String,
      },
    ],
    required: true,
  })
  athletes: AthleteInfo[];

  @Prop({ required: true, default: Date.now, index: true })
  orderDate: Date;
}

export const CampaignOrderSchema = SchemaFactory.createForClass(CampaignOrder);
