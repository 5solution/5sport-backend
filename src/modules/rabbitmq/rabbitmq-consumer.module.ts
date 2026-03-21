import { Module } from '@nestjs/common';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGE } from './constants/events';
import { OrderPaidConsumer } from './order-paid.consumer';
import { env } from 'src/config';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    GolevelupRabbitMQModule.forRoot({
      exchanges: [{ name: RABBITMQ_EXCHANGE, type: 'topic' }],
      uri: env.rabbitmqUrl,
      connectionInitOptions: { wait: true },
    }),
    BotModule,
  ],
  providers: [OrderPaidConsumer],
})
export class RabbitMQConsumerModule {}
