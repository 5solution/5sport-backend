import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { env } from 'src/config';
import { EmailNotification, EmailNotificationDocument, EmailNotificationStatus } from './schemas/email-notification.schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mailchimp = require('@mailchimp/mailchimp_transactional');

export interface GroupOrderEmailData {
  toEmail: string;
  username: string;
  orderCode: string;
  eventName: string;
  groupName: string;
  ticketNumber: number;
  processDate: string;
  totalPrice: string;
  paymentMethod: string;
  endUserEmail: string;
  phone: string;
  athletes: { name: string; distance: string; email: string }[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client;

  constructor(
    @InjectModel(EmailNotification.name) private notificationModel: Model<EmailNotificationDocument>,
  ) {
    this.client = mailchimp(env.mailchimp.apiKey);
  }

  async ping(): Promise<string> {
    const response = await this.client.users.ping();
    this.logger.log(`Mailchimp ping response: ${response}`);
    return response;
  }

  async sendGroupOrderConfirmation(data: GroupOrderEmailData) {
    const subject = `✅ [5Sport] Xác nhận Đơn hàng Mua Chung thành công / Group Order Confirmation - ${data.eventName}`;

    const mergeVars = {
      username: data.username,
      order_code: data.orderCode,
      event_name: data.eventName,
      group_name: data.groupName,
      ticket_number: String(data.ticketNumber),
      process_date: data.processDate,
      total_price: data.totalPrice,
      payment_method: data.paymentMethod,
      end_user_email: data.endUserEmail,
      phone: data.phone,
    };

    const notification = await this.notificationModel.create({
      toEmail: data.toEmail,
      subject,
      templateSlug: '5sportgrouporderconfirm',
      status: EmailNotificationStatus.PENDING,
      orderCode: data.orderCode,
      mergeVars,
    });

    const ticketListHtml = `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">Tên</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">Cự ly tham dự</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">Địa chỉ email</th>
          </tr>
        </thead>
        <tbody>
          ${data.athletes
            .map(
              (a) => `<tr>
                <td style="border:1px solid #ddd;padding:8px;">${a.name}</td>
                <td style="border:1px solid #ddd;padding:8px;">${a.distance}</td>
                <td style="border:1px solid #ddd;padding:8px;">${a.email}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;

    try {
      const response = await this.client.messages.sendTemplate({
        template_name: '5sportgrouporderconfirm',
        template_content: [],
        message: {
          from_email: '5sport@5sport.vn',
          subject,
          to: [{ email: data.toEmail, type: 'to' }],
          global_merge_vars: [
            ...Object.entries(mergeVars).map(([name, content]) => ({ name, content })),
            { name: 'ticket_list_table', content: ticketListHtml },
          ],
        },
      });

      await this.notificationModel.updateOne(
        { _id: notification._id },
        {
          $set: {
            status: EmailNotificationStatus.SENT,
            response,
            sentAt: new Date(),
          },
        },
      );

      this.logger.log(`Group order confirmation email sent to ${data.toEmail}, orderCode=${data.orderCode}`);
      return response;
    } catch (error) {
      await this.notificationModel.updateOne(
        { _id: notification._id },
        {
          $set: {
            status: EmailNotificationStatus.FAILED,
            errorMessage: error.message || String(error),
          },
        },
      );

      this.logger.error(`Failed to send email to ${data.toEmail}, orderCode=${data.orderCode}`, error);
      throw error;
    }
  }
}
