import { Connection } from 'amqplib';
import { RabbitMQPublish } from './handlers/RabbitMQPublish.js';
import { RabbitMQConsumer } from './handlers/RabbitMQConsumer.js';
export type RabbitMQChannelOptions = {
    name: string;
    retryChannel: boolean;
    retryChannelTimeout: number;
    maxRetryPublish: number;
    activityTimeout: number;
    confirmChannel: boolean;
};
export declare class RabbitMQChannel {
    private connection;
    private readonly logger;
    private channel;
    private recreateChannelInterval;
    private closeTimeout;
    private options;
    private publishQueue;
    private isProcessingPublishQueue;
    private isProcessingConsume;
    private isClosed;
    private consumer;
    constructor(connection: Connection | null, options?: Partial<RabbitMQChannelOptions>);
    publish(entity: RabbitMQPublish): Promise<void>;
    subscribeConsumer(entity: RabbitMQConsumer): Promise<void>;
    processConsumer(): Promise<void>;
    resetConnection(connection: Connection): void;
    private createChannel;
    private processQueue;
    private waitForChannel;
    private startChannel;
    private startRetryChannel;
    private sendData;
    private prepareData;
    private extractData;
    private static addDefaultOptions;
}
