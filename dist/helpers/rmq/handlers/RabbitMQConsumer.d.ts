import { Options, Message } from 'amqplib';
export type RabbitMQConsumerOptions = {
    target: string;
    consumerOptions?: Options.Consume;
    autoAck: boolean;
    prefetch: number;
};
export declare const DEFAULT_OPTIONS: RabbitMQConsumerOptions;
export declare abstract class RabbitMQConsumer {
    get name(): string;
    protected get options(): Partial<RabbitMQConsumerOptions>;
    abstract handler(data: object, message: Message): Promise<void>;
    get fullOptions(): RabbitMQConsumerOptions;
}
