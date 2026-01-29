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

    const chatInfo = {
      chatId: ctx.chat.id,
      chatType: ctx.chat.type,
      chatTitle: 'title' in ctx.chat ? ctx.chat.title : 'Private chat',
    };

    this.logger.debug('Chat info:', chatInfo);
    await ctx.reply('Welcome! Use /help to see available commands.');
  }

  @On('my_chat_member')
  async onMyChatMember(@Ctx() ctx: Context): Promise<void> {
    const update = ctx.update as any;
    const newStatus = update.my_chat_member?.new_chat_member?.status;
    const oldStatus = update.my_chat_member?.old_chat_member?.status;

    if (newStatus === 'member' && oldStatus !== 'member') {
      const groupInfo = {
        groupId: ctx.chat.id,
        groupTitle: 'title' in ctx.chat ? ctx.chat.title : undefined,
        groupType: ctx.chat.type,
        addedBy: ctx.from?.username || ctx.from?.first_name,
      };

      this.logger.log('Bot added to group:', groupInfo);

      await ctx.reply(
        `✅ GROUP_ID: ${ctx.chat.id}\n\nBot is now active in this group!`,
      );
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context): Promise<void> {
    const message = ctx.message as any;
    const text = message?.text;
    const entities = message?.entities;

    const logData = {
      chatId: ctx.chat.id,
      chatType: ctx.chat.type,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      text,
    };

    this.logger.debug('Message received:', logData);

    if (!entities || !this.hasBotMention(entities)) {
      return;
    }

    this.logger.log('Bot mentioned! Sending to target group/topic');

    const mentionMessage = this.botService.formatMentionMessage({
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      chatTitle: 'title' in ctx.chat ? ctx.chat.title : 'Private chat',
      text: text || '',
    });

    await this.botService.sendToTargetGroup(mentionMessage);
  }

  private hasBotMention(entities: Array<{ type: string }>): boolean {
    return entities.some(
      (entity) => entity.type === 'mention' || entity.type === 'text_mention',
    );
  }
}
