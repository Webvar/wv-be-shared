import { Connection, Options } from 'amqplib';
import { RabbitMQPublish } from './handlers/RabbitMQPublish.js';
import { RabbitMQConsumer } from './handlers/RabbitMQConsumer.js';
export type RabbitMQOptions = {
    url: string;
    reconnect: boolean;
    reconnectTimeout: number;
};
export declare class RabbitMQ {
    private readonly logger;
    private connection;
    private connectionEstablished;
    private establishConnection;
    private options;
    private reconnectInterval;
    private channels;
    private consumers;
    get currentConnection(): Connection | null;
    waitConnection(): Promise<void>;
    constructor(options?: Partial<RabbitMQOptions>);
    private createConnection;
    private startRetryConnection;
    private static addDefaultOptions;
    publish(entity: RabbitMQPublish): Promise<void>;
    subscribe(entity: RabbitMQConsumer): Promise<void>;
    assertQueue(queue: string, options?: Options.AssertQueue): Promise<void>;
    assertExchange(exchange: string, type: string, options?: Options.AssertExchange): Promise<void>;
    bindQueue(queue: string, source: string, pattern: string): Promise<void>;
    bindExchange(destination: string, source: string, pattern: string): Promise<void>;
}
