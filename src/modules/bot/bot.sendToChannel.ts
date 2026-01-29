import { Injectable, Logger } from '@nestjs/common';

import { BotService } from './bot.service';
import { TELEGRAM_CHANNEL_ID } from './constant';

@Injectable()
export class BotSendToChannel {
  private readonly logger = new Logger(BotSendToChannel.name);

  constructor(private readonly botService: BotService) {}

  async sendToChannel(message: string): Promise<void> {
    this.logger.log(`Sending message to channel: ${TELEGRAM_CHANNEL_ID}`);
    await this.botService.sendToChannel(TELEGRAM_CHANNEL_ID, message);
  }
}
