import { Options, MessageFields, MessageProperties, Message } from 'amqplib';

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
    return this.constructor.name;
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
