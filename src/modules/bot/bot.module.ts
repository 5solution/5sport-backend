import { Module } from '@nestjs/common';

import { BotController } from './bot.controller';
import { BotSendToChannel } from './bot.sendToChannel';
import { BotService } from './bot.service';

@Module({
  controllers: [BotController],
  providers: [BotService, BotSendToChannel],
  exports: [BotService, BotSendToChannel],
})
export class BotModule {}
