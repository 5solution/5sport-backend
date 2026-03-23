import { env } from 'src/config';

export const RABBITMQ_EXCHANGE = `5sport.events.${env.env}`;

export const RoutingKey = {
  ORDER_PAID: 'order.paid',
} as const;

export type RoutingKeyValue = (typeof RoutingKey)[keyof typeof RoutingKey];
