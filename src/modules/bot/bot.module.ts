import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { env } from 'src/config';
import { session } from 'telegraf';

import { BotController } from './bot.controller';
import { BotSendToChannel } from './bot.sendToChannel';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.start';
import { BOT_NAME } from './constant';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: env.telegramBotToken,
        middlewares: [session()],
      }),
    }),
  ],
  controllers: [BotController],
  providers: [BotService, BotUpdate, BotSendToChannel],
  exports: [BotService, BotSendToChannel],
})
export class BotModule {}
