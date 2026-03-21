import { DynamicModule, Module } from '@nestjs/common';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { RABBITMQ_EXCHANGE } from './constants/events';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';

@Module({})
export class RabbitMQModule {
  static forRoot(): DynamicModule {
    const rabbitmqUrl = process.env.RABBITMQ_URL;

    const baseModule = {
      module: RabbitMQModule,
      providers: [RabbitMQPublisherService],
      exports: [RabbitMQPublisherService],
      global: true,
    };

    if (!rabbitmqUrl) {
      return baseModule;
    }

    return {
      ...baseModule,
      imports: [
        GolevelupRabbitMQModule.forRoot({
          exchanges: [{ name: RABBITMQ_EXCHANGE, type: 'topic' }],
          uri: rabbitmqUrl,
          connectionInitOptions: { wait: false },
        }),
      ],
    };
  }
}
