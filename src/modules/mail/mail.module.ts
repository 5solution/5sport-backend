import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { EmailNotification, EmailNotificationSchema } from './schemas/email-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailNotification.name, schema: EmailNotificationSchema },
    ]),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
