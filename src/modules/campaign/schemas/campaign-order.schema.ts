import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CampaignOrderStatus } from '../enums/campaign-order-status.enum';
import { SizeShirt } from '../enums/size-shirt.enum';

export class AthleteInfo {
  lastName: string;
  firstName: string;
  phoneNumber: string;
  location: string;
  national: string;
  provinceCode: string;
  dateOfBirth: Date;
  sizeShirt: SizeShirt;
  club: string;
  nameInBib: string;
  medicalInformationPhoneNumber: string;
  medicalInformationName: string;
  medicalInformation: string;
  typeOfMedicine: string;
  bloodType: string;
}

export class OrderItem {
  productId: Types.ObjectId;
  productName: string;
  unitPrice: number;
  athletes: AthleteInfo[];
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

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'CampaignProduct' },
        productName: String,
        unitPrice: Number,
        athletes: [
          {
            lastName: String,
            firstName: String,
            phoneNumber: String,
            location: String,
            national: String,
            provinceCode: String,
            dateOfBirth: Date,
            sizeShirt: { type: String, enum: SizeShirt },
            club: String,
            nameInBib: String,
            medicalInformationPhoneNumber: String,
            medicalInformationName: String,
            medicalInformation: String,
            typeOfMedicine: String,
            bloodType: String,
          },
        ],
      },
    ],
    required: true,
  })
  items: OrderItem[];

  @Prop({ required: true, default: Date.now, index: true })
  orderDate: Date;
}

export const CampaignOrderSchema = SchemaFactory.createForClass(CampaignOrder);
