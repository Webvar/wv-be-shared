import { Connection, connect, Options } from 'amqplib';
import { setIntervalAsync, clearIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/fixed';

import loggerFactory from '../logger.js';
import { RabbitMQChannel } from './RabbitMQChannel.js';
import { RabbitMQPublish } from './handlers/RabbitMQPublish.js';
import { RabbitMQConsumer } from './handlers/RabbitMQConsumer';

const logger = loggerFactory('file:///rmq/RabbitMQ.ts');

export type RabbitMQOptions = {
  url: string;
  reconnect: boolean;
  reconnectTimeout: number;
};

const DEFAULT_OPTIONS: RabbitMQOptions = {
  url: 'amqp://localhost:5672',
  reconnect: true,
  reconnectTimeout: 5000,
};

export class RabbitMQ {
  private readonly logger = logger.child({ class: 'RabbitMQ' });
  private connection: Connection | null;
  private connectionEstablished: Promise<void>;
  private establishConnection: () => void;
  private options: RabbitMQOptions;
  private reconnectInterval: SetIntervalAsyncTimer<[]> | null = null;
  private channels: Record<string, RabbitMQChannel> = {};
  private consumers: Record<string, RabbitMQConsumer> = {};

  get currentConnection() {
    return this.connection;
  }

  waitConnection(): Promise<void> {
    return this.connectionEstablished;
  }

  constructor(options?: Partial<RabbitMQOptions>) {
    const lg = this.logger.child({ method: 'constructor' });
    lg.info({ state: 'SET_OPTIONS', options });
    this.options = RabbitMQ.addDefaultOptions(options);
    this.connection = null;
    this.establishConnection = () => {
    };
    this.connectionEstablished = new Promise((resolve) => {
      lg.info({ state: 'CONNECTION_ESTABLISHED' });
      this.establishConnection = resolve;
    });
    this.createConnection()
      .then((connection) => {
        lg.info({ state: 'CONNECTION_CREATED' });
        this.connection = connection;
        this.establishConnection();
        lg.info({ state: 'CONNECTION_INITIATED' });
      })
      .catch((err) => {
        lg.error({ state: 'CONNECTION_ERROR', err });
        this.startRetryConnection();
      }
    );
  }

  private async createConnection(): Promise<Connection | null> {
    const lg = this.logger.child({ method: 'startConnection' });
    try {
      lg.debug({ state: 'CONNECTION_START' });
      const connection = await connect(this.options.url);
      connection.once('close', async (err) => {
        const closeLg = this.logger.child({ method: 'close' });

        closeLg.error({ state: 'CONNECTION_UNEXPECTEDLY_CLOSED_RETRY', err });
        if (this.reconnectInterval) {
          await clearIntervalAsync(this.reconnectInterval)
          this.reconnectInterval = null;
        }
        this.startRetryConnection();
      });
      lg.debug({ state: 'CONNECTION_SUCCESSFUL' });

      return connection;
    } catch (err) {
      lg.error({ state: 'CONNECTION_ERROR', err });
      this.startRetryConnection();
    }

    return null;
  }

  private startRetryConnection() {
    if (this.reconnectInterval !== null && this.options.reconnect) {
      return;
    }

    const lg = this.logger.child({ method: 'startRetryConnection' });

    this.connectionEstablished = new Promise((resolve) => {
      const oldResolve = this.establishConnection;
      this.establishConnection = () => {
        oldResolve();
        resolve();
      }
    });

    lg.info({ state: 'CONNECTION_INITIATE_RETRY' });
    this.reconnectInterval = setIntervalAsync(async () => {
      lg.info({ state: 'CONNECTION_RETRY', reconnectTimeout: this.options.reconnectTimeout });
      this.connection = await this.createConnection();
      if (this.connection) {
        this.establishConnection();
        Object.values(this.channels).forEach((channel) => {
          channel.resetConnection(this.connection!);
        });

        Object.values(this.consumers).forEach(async (consumer) => {
        lg.info({ state: 'REBIND_CONSUMER', consumer: consumer.name });
        await this.subscribe(consumer);
      });

        if (this.reconnectInterval) {
          await clearIntervalAsync(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      }
    }, this.options.reconnectTimeout);
  }

  private static addDefaultOptions(options?: Partial<RabbitMQOptions>): RabbitMQOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  async publish(entity: RabbitMQPublish) {
    const lg = this.logger.child({ method: 'publish' });

    lg.debug({ state: 'PUBLISH' });

    if (!this.channels[entity.name]) {
      this.channels[entity.name] = new RabbitMQChannel(this.connection, {
        name: entity.name,
      });
      lg.info({ state: 'PUBLISH_CHANNEL_INITIALIZED', entity: entity.name });
    }

    await this.connectionEstablished;
    if (!this.connection) {
      lg.error({ state: 'PUBLISH_ERROR_CONNECTION', entity: entity.name });
      return;
    }

    lg.info({ state: 'PUBLISH_START', entity: entity.name });

    try {
      await this.channels[entity.name].publish(entity);
      lg.info({ state: 'PUBLISH_SUCCESSFUL', entity: entity.name });
    } catch (err) {
      lg.error({ state: 'PUBLISH_ERROR', err, entity: entity.name });
    }
  }

  async subscribe(entity: RabbitMQConsumer) {
    const lg = this.logger.child({ method: 'subscribe' });

    lg.debug({ state: 'SUBSCRIBE' });

    if (!this.channels[entity.name]) {
      this.channels[entity.name] = new RabbitMQChannel(this.connection, {
        name: entity.name,
        activityTimeout: 0,
      });
      lg.debug({ state: 'SUBSCRIBE_ENTITY_INITIALIZED', entity: entity.name });
    }

    await this.connectionEstablished;
    if (!this.connection) {
      lg.error({ state: 'SUBSCRIBE_ERROR_CONNECTION', entity: entity.name });
      return;
    }

    this.consumers[entity.name] = entity;

    lg.info({ state: 'SUBSCRIBE_CONSUMER', entity: entity.name });

    try {
      await this.channels[entity.name].subscribeConsumer(entity);
      lg.info({ state: 'SUBSCRIBE_SUCCESSFUL', entity: entity.name });
    } catch (err) {
      lg.error({ state: 'SUBSCRIBE_ERROR', err, entity: entity.name });
    }
  }

  async assertQueue(queue: string, options?: Options.AssertQueue) {
    const lg = this.logger.child({ method: 'assertQueue' });

    await this.connectionEstablished;
    if (!this.connection) {
      lg.error({ state: 'ASSERT_QUEUE_ERROR_CONNECTION' });
      return;
    }

    const params = { queue, options };
    try {
      const channel = await this.connection.createChannel();

      lg.debug({ state: 'ASSERT_QUEUE', params });
      try {
        await channel.assertQueue(queue, options);
        lg.info({ state: 'ASSERT_QUEUE_SUCCESSFUL', params });
      } catch (err) {
        lg.error({ state: 'ASSERT_QUEUE_ERROR', err, params });
      }
      await channel.close();
    } catch (err) {
      lg.error({ state: 'ASSERT_QUEUE_ERROR_CHANNEL', err, params });
      throw err;
    }
  }

  async assertExchange(exchange: string, type: string, options?: Options.AssertExchange) {
    const lg = this.logger.child({ method: 'assertExchange' });

    await this.connectionEstablished;
    if (!this.connection) {
      lg.error({ state: 'ASSERT_EXCHANGE_ERROR_CONNECTION' });
      return;
    }

    const params = { exchange, type, options };
    try {
      const channel = await this.connection.createChannel();

      lg.debug({ state: 'ASSERT_EXCHANGE', params });
      try {
        await channel.assertExchange(exchange, type, options);
        lg.info({ state: 'ASSERT_EXCHANGE_SUCCESSFUL', params });
      } catch (err) {
        lg.error({ state: 'ASSERT_EXCHANGE_ERROR', err, params });
      }
      await channel.close();
    } catch (err) {
      lg.error({ state: 'ASSERT_EXCHANGE_ERROR_CHANNEL', err, params });
      throw err;
    }
  }

  async bindQueue(queue: string, source: string, pattern: string) {
    const lg = this.logger.child({ method: 'bindQueue' });

    await this.connectionEstablished;
    if (!this.connection) {
      lg.error({ state: 'BIND_QUEUE_ERROR_CONNECTION' });
      return;
    }

    const params = { queue, source, pattern };
    try {
      const channel = await this.connection.createChannel();

      lg.debug({ state: 'BIND_QUEUE', params });
      try {
        await channel.bindQueue(queue, source, pattern);
        lg.info({ state: 'BIND_QUEUE_SUCCESSFUL', params });
      } catch (err) {
        lg.error({ state: 'BIND_QUEUE_ERROR', err, params });
      }
      await channel.close();
    } catch (err) {
      lg.error({ state: 'BIND_QUEUE_ERROR_CHANNEL', err, params });
      throw err;
    }
  }

  async bindExchange(destination: string, source: string, pattern: string) {
    const lg = this.logger.child({ method: 'bindExchange' });

    await this.connectionEstablished;
    if (!this.connection) {
      lg.error({ state: 'BIND_EXCHANGE_ERROR_CONNECTION' });
      return;
    }

    const params = { destination, source, pattern };
    try {
      const channel = await this.connection.createChannel();

      lg.debug({ state: 'BIND_EXCHANGE', params });
      try {
        await channel.bindExchange(destination, source, pattern);
        lg.info({ state: 'BIND_EXCHANGE_SUCCESSFUL', params });
      } catch (err) {
        lg.error({ state: 'BIND_EXCHANGE_ERROR', err, params });
      }
      await channel.close();
    } catch (err) {
      lg.error({ state: 'BIND_EXCHANGE_ERROR_CHANNEL', err, params });
      throw err;
    }
  }
}
