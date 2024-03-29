import { Options, Message } from 'amqplib';

export type RabbitMQConsumerOptions = {
  target: string;
  consumerOptions?: Options.Consume,
  autoAck: boolean
  prefetch: number;
};

export const DEFAULT_OPTIONS: RabbitMQConsumerOptions = {
  target: '',
  autoAck: true,
  prefetch: 1,
};

export abstract class RabbitMQConsumer {
  get name(): string {
    throw Error("Consumer getter should be overwritten with static string");
  }

  protected get options(): Partial<RabbitMQConsumerOptions> {
    return {};
  }

  abstract handler(data: object, message: Message): Promise<void>

  get fullOptions(): RabbitMQConsumerOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...this.options,
    };
  }
}
