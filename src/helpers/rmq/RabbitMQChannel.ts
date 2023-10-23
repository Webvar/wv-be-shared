import { Channel, ConfirmChannel, Connection } from 'amqplib';
import { setIntervalAsync, clearIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import loggerFactory from '../logger.js';
import { RabbitMQPublish, RabbitMQPublishTargetType } from './handlers/RabbitMQPublish.js';
import { RabbitMQConsumer } from './handlers/RabbitMQConsumer';

const logger = loggerFactory('file:///rmq/RabbitMQChannel.ts');

export type RabbitMQChannelOptions = {
  name: string;
  retryChannel: boolean;
  retryChannelTimeout: number;
  maxRetryPublish: number;
  initiate: boolean;
  activityTimeout: number;
  confirmChannel: boolean;
};

const DEFAULT_OPTIONS: RabbitMQChannelOptions = {
  name: 'channel',
  initiate: false,
  maxRetryPublish: 3,
  retryChannel: true,
  retryChannelTimeout: 5000,
  activityTimeout: 10000,
  confirmChannel: false,
};

enum RabbitMQChannelPublishState {
  SENT = 'sent',
  BUFFER_FULL = 'buffer_full',
  MESSAGE_CONFIRMED = 'message_confirmed',
  MESSAGE_NOT_CONFIRMED = 'message_not_confirmed',
}

export class RabbitMQChannel {
  private readonly logger;
  private channel: Channel | null = null;
  private recreateChannelInterval: SetIntervalAsyncTimer<[]> | null = null;
  private closeTimeout: NodeJS.Timeout | null = null;
  private options: RabbitMQChannelOptions;
  private publishQueue: RabbitMQPublish[] = [];
  private isProcessingPublishQueue: boolean = false;
  private isProcessingConsume: boolean = false;
  private isClosed: boolean = false;
  private consumer: RabbitMQConsumer | null = null;

  constructor(private connection: Connection, options?: Partial<RabbitMQChannelOptions>) {
    this.options = RabbitMQChannel.addDefaultOptions(options);
    this.logger = logger.child({ class: 'RabbitMQChannel', channel: this.options.name });

    if (this.options.initiate) {
      void this.startChannel();
    }
  }

  async publish(entity: RabbitMQPublish): Promise<void> {
    const lg = this.logger.child({ method: 'publish' });

    lg.debug({ state: 'CHANNEL_PUBLISH', entity: entity.name });

    this.publishQueue.push(entity);

    await this.processQueue();
  }

  async subscribeConsumer(entity: RabbitMQConsumer) {
    this.consumer = entity;
    await this.processConsumer();
  }

  async processConsumer() {
    const lg = this.logger.child({ method: 'processConsumer' });

    if (this.isProcessingConsume) {
      return;
    }

    this.isProcessingConsume = true;

    if (!this.consumer) {
      lg.error({ state: 'PROCESS_CONSUMER_NULL' });
      this.isProcessingConsume = false;
      return;
    }

    await this.waitForChannel();
    if (!this.channel) {
      lg.error({ state: 'PROCESS_CONSUMER_CHANNEL_ERROR', entity: this.consumer });
      this.isProcessingConsume = false;
      return;
    }
    await this.channel.prefetch(this.consumer.fullOptions.prefetch);

    await this.channel.consume(this.consumer.fullOptions.target, async (message) => {
      if(!message) {
        lg.warn({ state: 'PROCESS_CONSUMER_GOT_EMPTY_MESSAGE' });
        return;
      }

      if (!this.channel) {
        lg.error({ state: 'PROCESS_CONSUMER_CHANNEL_ERROR', entity: this.consumer });
        this.isProcessingConsume = false;
        return;
      }

      if (!this.consumer) {
        lg.error({ state: 'PROCESS_CONSUMER_NULL' });
        return;
      }

      lg.debug({ state: 'PROCESS_CONSUMER_GOT_MESSAGE', messageId: message.properties.messageId });

      const data = this.extractData(message.content);

      try {
        lg.debug({ state: 'PROCESS_CONSUMER_MESSAGE_PROCESS', messageId: message.properties.messageId });
        await this.consumer.handler(data, message);
        lg.debug({ state: 'PROCESS_CONSUMER_MESSAGE_PROCESS_SUCCESSFUL', messageId: message.properties.messageId });
        if (this.consumer.fullOptions.autoAck && !this.consumer.fullOptions.consumerOptions?.noAck) {
          this.channel?.ack(message);
        }
      } catch (err) {
        if (this.consumer.fullOptions.autoAck && !this.consumer.fullOptions.consumerOptions?.noAck) {
          this.channel?.nack(message);
        }
        lg.debug({ state: 'PROCESS_CONSUMER_MESSAGE_PROCESS_ERROR', messageId: message.properties.messageId });
      }
    }, this.consumer.fullOptions.consumerOptions);
  }

  resetConnection(connection: Connection) {
    this.channel = null;
    this.isProcessingPublishQueue = false;
    this.isProcessingConsume = false;
    this.connection = connection;
    if (this.options.initiate) {
      void this.startChannel();
    }
  }

  private async createChannel(): Promise<Channel> {
    const lg = this.logger.child({ method: 'createChannel' });

    lg.debug({ status: 'CHANNEL_CREATION' });

    try {
      if (this.options.confirmChannel) {
        return await this.connection.createConfirmChannel();
      } else {
        return await this.connection.createChannel();
      }
    } catch (err) {
      lg.error({ state: 'CHANNEL_CREATION_ERROR', err });

      throw err;
    }
  }

  private async processQueue() {
    const lg = this.logger.child({ method: 'processQueue' });

    if (this.isProcessingPublishQueue) {
      return;
    }

    this.isProcessingPublishQueue = true;

    while (true) {
      lg.debug({ state: 'PROCESS_QUEUE_NEXT_STEP' });
      await this.waitForChannel();
      if (!this.channel) {
        this.isProcessingPublishQueue = false;
        lg.debug({ state: 'PROCESS_QUEUE_WAIT_FOR_CHANNEL' })

        if (this.closeTimeout) {
          lg.debug({ state: 'PROCESS_QUEUE_CLOSE_TIMEOUT_REMOVED' });
          clearTimeout(this.closeTimeout);
          this.closeTimeout = null;
        }

        return;
      }

      const entity = this.publishQueue.shift();

      if (!entity) {
        this.isProcessingPublishQueue = false;
        lg.debug({ state: 'PROCESS_QUEUE_COMPLETED' });
        return;
      }

      if (this.closeTimeout) {
        lg.debug({ state: 'PROCESS_QUEUE_CLOSE_TIMEOUT_REMOVED' });
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }

      lg.debug({ state: 'PROCESS_QUEUE_GOT_ENTITY', entity: entity.name });

      try {
        const state = await this.sendData(entity);
        lg.debug({ state: 'PROCESS_QUEUE_SEND_DATA', entity: entity.name, value: state });
        if (state === RabbitMQChannelPublishState.BUFFER_FULL) {
          entity.retries += 1;

          if (entity.retries < this.options.maxRetryPublish) {
            this.publishQueue.push(entity);
          }
          if (!this.channel) {
            continue;
          }

          this.isProcessingPublishQueue = false;
          this.channel.once('drain', () => {
            this.processQueue();
          });
          return;
        }
      } catch (err) {
        entity.retries += 1;
        if (entity.retries < this.options.maxRetryPublish) {
          this.publishQueue.push(entity);
        }
      }

      if (this.options.activityTimeout !== 0) {
        lg.debug({ state: 'PROCESS_QUEUE_START_CLOSE_TIMEOUT' });
        this.closeTimeout = setTimeout(async () => {
          lg.debug({ state: 'PROCESS_QUEUE_CLOSE_TIMEOUT_TRIGGERED' });
          if (this.channel) {
            this.isClosed = true;
            await this.channel.close();
          }
        }, this.options.activityTimeout);
      }
    }
  }

  private async waitForChannel() {
    const lg = this.logger.child({ method: 'waitForChannel' });

    lg.debug({ state: 'CHANNEL_WAIT' });

    try {
      if (!this.channel) {
        lg.info({ state: 'CHANNEL_WAIT_OPENING' });
        await this.startChannel();
        return true;
      }
      return false;
    } catch (err) {
      lg.error({ state: 'CHANNEL_WAIT_ERROR', err });
      throw err;
    }
  }

  private async startChannel() {
    const lg = this.logger.child({ method: 'startChannel' });

    try {
      lg.debug({ state: 'CHANNEL_START' });
      this.channel = await this.createChannel();
      this.channel.once('close', () => {
        const closeLg = this.logger.child({ method: 'close' });
        this.channel = null;

        this.isProcessingPublishQueue = false;
        this.isProcessingConsume = false;

        if (this.isClosed) {
          closeLg.debug({ state: 'CHANNEL_CLOSED' });
          return;
        }

        closeLg.debug({ state: 'CHANNEL_UNEXPECTEDLY_CLOSED_RETRY' });
        this.startRetryChannel();
        if (this.recreateChannelInterval) {
          clearIntervalAsync(this.recreateChannelInterval);
          this.recreateChannelInterval = null;
        }
      });

      lg.debug({ state: 'CHANNEL_START_SUCCESSFUL' });
    } catch (err) {
      lg.error({ state: 'CHANNEL_START_ERROR', err });

      if (this.options.retryChannel) {
        this.startRetryChannel();
      } else {
        throw err;
      }
    }
  }

  private startRetryChannel() {
    const lg = this.logger.child({ method: 'startRetryChannel' });

    if (this.recreateChannelInterval !== null && this.options.retryChannel) {
      return;
    }

    lg.info({ state: 'CHANNEL_INITIATE_RETRY' });
    this.recreateChannelInterval = setIntervalAsync(async () => {
      lg.info({ state: 'CHANNEL_RETRY', retryChannelTimeout: this.options.retryChannelTimeout });
      await this.startChannel();
      this.processQueue();
      if (this.consumer) {
        this.processConsumer();
      }
      if (this.channel && this.recreateChannelInterval) {
        await clearIntervalAsync(this.recreateChannelInterval);
        this.recreateChannelInterval = null;
      }
    }, this.options.retryChannelTimeout);
  }

  private async sendData(entity: RabbitMQPublish): Promise<RabbitMQChannelPublishState> {
    const lg = this.logger.child({ method: 'sendData' });

    if (!this.channel) {
      lg.error({ state: 'CHANNEL_NOT_INITIALIZED' });
      throw new Error('Channel is not initialized');
    }

    let result = false;
    if (entity.fullOptions.type === RabbitMQPublishTargetType.EXCHANGE) {
      result = this.channel.publish(
        entity.fullOptions.target,
        entity.fullOptions.routingKey,
        this.prepareData(entity),
        entity.fullOptions.publishOptions,
      );
    } else if (entity.fullOptions.type === RabbitMQPublishTargetType.QUEUE) {
      result = this.channel.sendToQueue(
        entity.fullOptions.target,
        this.prepareData(entity),
        entity.fullOptions.publishOptions,
      );
    } else {
      throw new Error('Invalid target type');
    }

    if (!result) {
      return RabbitMQChannelPublishState.BUFFER_FULL;
    }

    if ('waitForConfirms' in this.channel) {
      try {
        const confirmChannel = this.channel as ConfirmChannel;
        await confirmChannel.waitForConfirms();
        lg.debug({ state: 'CHANNEL_MESSAGE_CONFIRMED', entity: entity.name });

        return RabbitMQChannelPublishState.MESSAGE_CONFIRMED;
      } catch (err) {
        lg.debug({ state: 'CHANNEL_MESSAGE_NOT_CONFIRMED', entity: entity.name });
        return RabbitMQChannelPublishState.MESSAGE_NOT_CONFIRMED;
      }
    }

    return RabbitMQChannelPublishState.SENT;
  }

  private prepareData(entity: RabbitMQPublish): Buffer {
    return Buffer.from(JSON.stringify(entity.provide));
  }

  private extractData(data: Buffer): object {
    const json = data.toString('utf-8');

    return JSON.parse(json);
  }

  private static addDefaultOptions(options?: Partial<RabbitMQChannelOptions>): RabbitMQChannelOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }
}