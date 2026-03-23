import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { RabbitMQConsumerModule } from './modules/rabbitmq/rabbitmq-consumer.module';

async function bootstrap() {
  const logger = new Logger('Consumer');
  const app = await NestFactory.createApplicationContext(RabbitMQConsumerModule);

  logger.log('Order paid consumer is running...');

  const shutdown = async () => {
    logger.log('Shutting down consumer...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
