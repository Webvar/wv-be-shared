import { Options } from 'amqplib';
export declare enum RabbitMQPublishTargetType {
    QUEUE = "queue",
    EXCHANGE = "exchange"
}
export type RabbitMQPublishOptions = {
    type: RabbitMQPublishTargetType;
    target: string;
    routingKey: string;
    publishOptions?: Options.Publish;
};
export declare const DEFAULT_OPTIONS: RabbitMQPublishOptions;
export declare abstract class RabbitMQPublish {
    retries: number;
    get name(): string;
    protected get options(): Partial<RabbitMQPublishOptions>;
    abstract get provide(): object;
    get fullOptions(): RabbitMQPublishOptions;
}
