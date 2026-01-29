import { Test, TestingModule } from '@nestjs/testing';

import { BotService } from './bot.service';
import { BOT_NAME } from './constant';
import { vi } from 'vitest';

const mockTelegraf = {
  telegram: {
    sendMessage: vi.fn(),
  },
};

describe('BotService', () => {
  let service: BotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotService,
        {
          provide: `${BOT_NAME}Bot`,
          useValue: mockTelegraf,
        },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
