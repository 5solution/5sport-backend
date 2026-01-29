import { Test, TestingModule } from '@nestjs/testing';

import { BotController } from './bot.controller';
import { BotSendToChannel } from './bot.sendToChannel';
import { BotService } from './bot.service';
import { vi } from 'vitest';

const mockBotService = {
  sendToTargetGroup: vi.fn(),
  sendToChannel: vi.fn(),
  formatMentionMessage: vi.fn(),
};

const mockBotSendToChannel = {
  sendToChannel: vi.fn(),
};

describe('BotController', () => {
  let controller: BotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BotController],
      providers: [
        {
          provide: BotService,
          useValue: mockBotService,
        },
        {
          provide: BotSendToChannel,
          useValue: mockBotSendToChannel,
        },
      ],
    }).compile();

    controller = module.get<BotController>(BotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
