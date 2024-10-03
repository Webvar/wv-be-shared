import * as amqplib from 'amqplib';
import { EventEmitter } from 'events';

import { RabbitMQ, RabbitMQOptions } from '../../../src/helpers/rmq/RabbitMQ';
import { RabbitMQPublish, RabbitMQPublishTargetType } from '../../../src/helpers/rmq/handlers/RabbitMQPublish';
import { RabbitMQConsumer } from '../../../src/helpers/rmq/handlers/RabbitMQConsumer';

jest.mock('amqplib');

const mockAmqplibConnect = amqplib.connect as jest.MockedFunction<typeof amqplib.connect>;

describe('RabbitMQ', () => {
  beforeEach(() => {
    mockAmqplibConnect.mockReset();
  });

  it('should initiate connection when instance created', async () => {
    const options: Partial<RabbitMQOptions> = {
      url: 'amqp://localhost:1111',
    };

    const mockConnection = new EventEmitter();

    mockAmqplibConnect.mockResolvedValue(mockConnection as amqplib.Connection);

    const rmq = new RabbitMQ(options);

    await rmq.waitConnection();

    const connection = rmq.currentConnection;

    expect(connection).not.toBeNull();
    expect(mockAmqplibConnect.mock.lastCall![0]).toBe(options.url);
    expect(mockAmqplibConnect.mock.calls.length).toBe(1);
  });

  it('should reconnect when connection is closed', async () => {
    const options: Partial<RabbitMQOptions> = {
      url: 'amqp://localhost:1111',
      reconnectTimeout: 0,
    };

    const mockConnection = new EventEmitter();

    mockAmqplibConnect.mockResolvedValue(mockConnection as amqplib.Connection);

    const rmq = new RabbitMQ(options);

    await rmq.waitConnection();

    mockConnection.emit('close');

    await rmq.waitConnection();

    const connection = rmq.currentConnection;

    expect(connection).not.toBeNull();
    expect(mockAmqplibConnect.mock.lastCall![0]).toBe(options.url);
    expect(mockAmqplibConnect.mock.calls.length).toBe(2);
  });

  it('should send message with correct params when call publish', async () => {
    const options: Partial<RabbitMQOptions> = {
      url: 'amqp://localhost:1111',
      reconnectTimeout: 0,
    };

    const mockPublisher = new class extends RabbitMQPublish {
      get name(): string {
        return 'test_publisher';
      }

      protected get options() {
        return {
          type: RabbitMQPublishTargetType.QUEUE,
          target: 'test_queue',
        };
      }

      get provide(): object {
        return {
          data: 123,
        };
      }
    };

    const mockChannel = new class extends EventEmitter {
      sendToQueue = jest.fn();
    };

    const mockConnection = new class extends EventEmitter {
      createChannel = jest.fn();
    };

    mockConnection.createChannel.mockResolvedValue(mockChannel);

    mockAmqplibConnect.mockResolvedValue(mockConnection as unknown as amqplib.Connection);

    const rmq = new RabbitMQ(options);

    await rmq.waitConnection(); // Ensure connection is fully established before publishing
    await rmq.publish(mockPublisher);

    expect(mockConnection.createChannel.mock.calls.length).toBe(1);
    expect(mockChannel.sendToQueue.mock.calls.length).toBe(1); 
    expect(mockChannel.sendToQueue.mock.lastCall[0]).toBe('test_queue'); 
    expect(mockChannel.sendToQueue.mock.lastCall[1].toString('utf-8')).toBe(JSON.stringify({
      data: 123,
    }));
  });

  it('should call consumer handler with correct params when got message', async () => {
    const options: Partial<RabbitMQOptions> = {
      url: 'amqp://localhost:1111',
      reconnectTimeout: 0,
    };

    const message = {
      properties: {
        messageId: 'test',
      },
      content: Buffer.from('1337'),
    };

    const mockConsumerHandler = jest.fn();
    mockConsumerHandler.mockResolvedValue(null);

    const mockConsumer = new class extends RabbitMQConsumer {
      get name(): string {
        return 'test_consumer';
      }

      protected get options() {
        return {
          prefetch: 10,
        };
      }

      async handler(data: object, message: amqplib.Message): Promise<void> {
        mockConsumerHandler(data, message);
      }
    };

    const mockChannel = new class extends EventEmitter {
      consume = jest.fn();
      prefetch = jest.fn();
      ack = jest.fn();
      nack = jest.fn();
    };

    const mockConnection = new class extends EventEmitter {
      createChannel = jest.fn();
    };

    mockConnection.createChannel.mockResolvedValue(mockChannel);

    mockAmqplibConnect.mockResolvedValue(mockConnection as unknown as amqplib.Connection);

    const rmq = new RabbitMQ(options);

    await rmq.waitConnection();
    await rmq.subscribe(mockConsumer);

    const handleMessage = mockChannel.consume.mock.lastCall[1];

    await handleMessage(message);

    expect(mockConnection.createChannel.mock.calls.length).toBe(1);
    expect(mockChannel.prefetch.mock.calls.length).toBe(1);
    expect(mockChannel.prefetch.mock.lastCall[0]).toBe(mockConsumer.fullOptions.prefetch);
    expect(mockConsumerHandler.mock.calls.length).toBe(1);
    expect(mockConsumerHandler.mock.lastCall[0]).toBe(1337);
    expect(mockConsumerHandler.mock.lastCall[1]).toBe(message);
    expect(mockChannel.ack.mock.calls.length).toBe(1);
    expect(mockChannel.nack.mock.calls.length).toBe(0); 
  });
});
