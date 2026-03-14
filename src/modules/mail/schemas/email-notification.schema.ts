import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum EmailNotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export type EmailNotificationDocument = HydratedDocument<EmailNotification>;

@Schema({ timestamps: true, collection: 'email_notifications' })
export class EmailNotification {
  @Prop({ required: true, index: true })
  toEmail: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  templateSlug: string;

  @Prop({ type: String, enum: EmailNotificationStatus, default: EmailNotificationStatus.PENDING, index: true })
  status: EmailNotificationStatus;

  @Prop()
  orderCode: string;

  @Prop({ type: Object })
  mergeVars: Record<string, any>;

  @Prop({ type: Object })
  response: Record<string, any>;

  @Prop()
  errorMessage: string;

  @Prop()
  sentAt: Date;
}

export const EmailNotificationSchema = SchemaFactory.createForClass(EmailNotification);
EmailNotificationSchema.index({ orderCode: 1 });
EmailNotificationSchema.index({ createdAt: -1 });
