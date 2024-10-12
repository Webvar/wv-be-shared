import { RabbitMQ } from "./RabbitMQ.js";
export type ExchangeType = 'direct' | 'topic' | 'headers' | 'fanout' | 'match' | string;
export declare const bindQueue: (rmq: RabbitMQ, type: ExchangeType) => (queue: string, source: string, pattern: string) => Promise<void>;
export declare const bindTopic: (rmq: RabbitMQ) => (queue: string, source: string, pattern: string) => Promise<void>;
export declare const assertBasicExchange: (rmq: RabbitMQ) => (exchange: string) => Promise<void>;
export declare const assertBasicQueue: (rmq: RabbitMQ) => (queue: string) => Promise<void>;
