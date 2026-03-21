import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Telegraf } from 'telegraf';
import { env } from 'src/config';
import { RABBITMQ_EXCHANGE, RoutingKey } from './constants/events';
import { OrderPaidPayload } from './dto/event-payloads';

const TELEGRAM_CHAT_ID = -5178735117;
const QUEUE = `5sport.order-paid-telegram.${env.env}`;

@Injectable()
export class OrderPaidConsumer {
  private readonly logger = new Logger(OrderPaidConsumer.name);
  private readonly bot: Telegraf;

  constructor() {
    this.bot = new Telegraf(env.telegramBotToken);
  }

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: RoutingKey.ORDER_PAID,
    queue: QUEUE,
    queueOptions: { durable: true },
  })
  async handleOrderPaid(payload: OrderPaidPayload) {
    this.logger.log(`Received order.paid: ${payload.orderCode}`);

    try {
      const message = this.formatMessage(payload);
      await this.bot.telegram.sendMessage(TELEGRAM_CHAT_ID, message, {
        parse_mode: 'MarkdownV2',
      });
      this.logger.log(`Telegram notification sent for ${payload.orderCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram notification for ${payload.orderCode}`,
        error,
      );
      throw error; // nack + requeue
    }
  }

  private formatMessage(data: OrderPaidPayload): string {
    const amount = data.totalAmount.toLocaleString('vi-VN');
    return [
      `💰 *Đơn hàng mới thanh toán thành công*`,
      ``,
      `📋 Mã đơn: \`${data.orderCode}\``,
      `🏃 Sự kiện: ${this.esc(data.eventName)}`,
      `👤 Người mua: ${this.esc(data.buyerName)}`,
      `📧 Email: ${this.esc(data.buyerEmail)}`,
      `📱 SĐT: ${this.esc(data.buyerPhone)}`,
      `🎫 Số VĐV: ${data.athleteCount}`,
      `💵 Tổng tiền: ${amount} VND`,
      `🏦 Thanh toán: ${this.esc(data.paymentMethod)}`,
      `🔖 Mã GD: \`${data.transactionId}\``,
      `🕐 Thời gian: ${this.esc(data.paidAt)}`,
    ].join('\n');
  }

  private esc(text: string): string {
    if (!text) return '';
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
