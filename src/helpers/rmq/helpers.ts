import { RabbitMQ } from "./RabbitMQ";

export type ExchangeType =
  | 'direct'
  | 'topic'
  | 'headers'
  | 'fanout'
  | 'match'
  | string;
export const bindQueue =
  (rmq: RabbitMQ, type: ExchangeType) =>
  async (queue: string, source: string, pattern: string): Promise<void> => {
    await rmq.assertExchange(source, type, { durable: true });
    await rmq.assertQueue(queue, { durable: true });
    await rmq.bindQueue(queue, source, pattern);
  };
export const bindTopic = (rmq: RabbitMQ) => bindQueue(rmq, 'topic');
export const assertBasicExchange = (rmq: RabbitMQ) => async (exchange: string): Promise<void> => {
    await rmq.assertExchange(exchange, 'topic', { durable: true });
}
export const assertBasicQueue = (rmq: RabbitMQ) => async (queue: string): Promise<void> => {
    await rmq.assertQueue(queue, { durable: true });
}
