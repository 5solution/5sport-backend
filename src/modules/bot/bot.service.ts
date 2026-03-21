import { Injectable } from '@nestjs/common';
import { Telegram } from 'telegraf';

import { env } from 'src/config';

import { TARGET_GROUP_ID, TARGET_TOPIC_ID } from './constant';

@Injectable()
export class BotService {
  private readonly telegram = new Telegram(env.telegramBotToken);

  async sendToTargetGroup(message: string): Promise<void> {
    await this.telegram.sendMessage(TARGET_GROUP_ID, message, {
      message_thread_id: TARGET_TOPIC_ID,
    });
  }

  async sendToChannel(channelId: string, message: string): Promise<void> {
    await this.telegram.sendMessage(channelId, message);
  }

}
