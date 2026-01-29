import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { BOT_NAME, TARGET_GROUP_ID, TARGET_TOPIC_ID } from './constant';

export interface MentionInfo {
  username?: string;
  firstName?: string;
  chatTitle: string;
  text: string;
}

@Injectable()
export class BotService {
  constructor(@InjectBot(BOT_NAME) private readonly bot: Telegraf) {}

  async sendToTargetGroup(message: string): Promise<void> {
    await this.bot.telegram.sendMessage(TARGET_GROUP_ID, message, {
      message_thread_id: TARGET_TOPIC_ID,
    });
  }

  async sendToChannel(channelId: string, message: string): Promise<void> {
    await this.bot.telegram.sendMessage(channelId, message);
  }

  formatMentionMessage(info: MentionInfo): string {
    return `
🔔 Bot Mentioned!
From: ${info.username || info.firstName}
Chat: ${info.chatTitle}
Message: ${info.text}
    `.trim();
  }
}
