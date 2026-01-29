import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { BotSendToChannel } from './bot.sendToChannel';
import { BotService } from './bot.service';

class SendMessageDto {
  message: string;
}

@Controller('bot')
export class BotController {
  constructor(
    private readonly botService: BotService,
    private readonly botSendToChannel: BotSendToChannel,
  ) {}

  @Post('send-to-group')
  @HttpCode(HttpStatus.OK)
  async sendToGroup(
    @Body() dto: SendMessageDto,
  ): Promise<{ success: boolean }> {
    await this.botService.sendToTargetGroup(dto.message);
    return { success: true };
  }

  @Post('send-to-channel')
  @HttpCode(HttpStatus.OK)
  async sendToChannel(
    @Body() dto: SendMessageDto,
  ): Promise<{ success: boolean }> {
    await this.botSendToChannel.sendToChannel(dto.message);
    return { success: true };
  }
}
