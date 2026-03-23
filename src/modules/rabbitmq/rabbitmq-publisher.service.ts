import { Injectable, Logger, Optional } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { RABBITMQ_EXCHANGE } from './constants/events';

@Injectable()
export class RabbitMQPublisherService {
  private readonly logger = new Logger(RabbitMQPublisherService.name);

  constructor(
    @Optional() private readonly amqpConnection?: AmqpConnection,
  ) {}

  async publish<T>(routingKey: string, payload: T): Promise<void> {
    if (!this.amqpConnection) {
      this.logger.debug(`RabbitMQ not configured, skipping: ${routingKey}`);
      return;
    }

    try {
      await this.amqpConnection.publish(RABBITMQ_EXCHANGE, routingKey, payload);
      this.logger.debug(`Published: ${routingKey}`);
    } catch (err) {
      this.logger.error(`Failed to publish ${routingKey}: ${err.message}`);
    }
  }
}
