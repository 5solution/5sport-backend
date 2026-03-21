import { Logger } from '@nestjs/common';
import { Update, Start, Ctx, Help, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { BotService } from './bot.service';

@Update()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(private readonly botService: BotService) {
    this.logger.log('BotUpdate initialized');
  }

  @Help()
  async help(@Ctx() ctx: Context): Promise<void> {
    const message = `
🔍 Help:
- /start - Start interaction with the bot
- /help - Show this help message
    `.trim();
    await ctx.reply(message);
  }

  @Start()
  async start(@Ctx() ctx: Context): Promise<void> {
    this.logger.log(`User started the bot: ${ctx.from?.id}`);

    await ctx.reply('Welcome! Use /help to see available commands.');
  }
}
