import { Options } from 'amqplib';

export enum RabbitMQPublishTargetType {
  QUEUE = 'queue',
  EXCHANGE = 'exchange',
}

export type RabbitMQPublishOptions = {
  type: RabbitMQPublishTargetType;
  target: string;
  routingKey: string;
  publishOptions?: Options.Publish;
};

export const DEFAULT_OPTIONS: RabbitMQPublishOptions = {
  type: RabbitMQPublishTargetType.EXCHANGE,
  target: '',
  routingKey: '',
};

export abstract class RabbitMQPublish {
  retries: number = 0;

  get name(): string {
    throw Error("Publisher getter should be overwritten with static string");
  }

  protected get options(): Partial<RabbitMQPublishOptions> {
    return {};
  }

  abstract get provide(): object;

  get fullOptions(): RabbitMQPublishOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...this.options,
    };
  }
}
