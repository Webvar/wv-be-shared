import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async/fixed';
import loggerFactory from '../logger.js';
import { RabbitMQPublishTargetType } from './handlers/RabbitMQPublish.js';
const logger = loggerFactory('file:///rmq/RabbitMQChannel.ts');
const DEFAULT_OPTIONS = {
    name: 'channel',
    initiate: false,
    maxRetryPublish: 3,
    retryChannel: true,
    retryChannelTimeout: 5000,
    activityTimeout: 10000,
    confirmChannel: false,
};
var RabbitMQChannelPublishState;
(function (RabbitMQChannelPublishState) {
    RabbitMQChannelPublishState["SENT"] = "sent";
    RabbitMQChannelPublishState["BUFFER_FULL"] = "buffer_full";
    RabbitMQChannelPublishState["MESSAGE_CONFIRMED"] = "message_confirmed";
    RabbitMQChannelPublishState["MESSAGE_NOT_CONFIRMED"] = "message_not_confirmed";
})(RabbitMQChannelPublishState || (RabbitMQChannelPublishState = {}));
export class RabbitMQChannel {
    constructor(connection, options) {
        this.connection = connection;
        this.channel = null;
        this.recreateChannelInterval = null;
        this.closeTimeout = null;
        this.publishQueue = [];
        this.isProcessingPublishQueue = false;
        this.isProcessingConsume = false;
        this.isClosed = false;
        this.consumer = null;
        this.options = RabbitMQChannel.addDefaultOptions(options);
        this.logger = logger.child({ class: 'RabbitMQChannel', channel: this.options.name });
        if (this.options.initiate) {
            void this.startChannel();
        }
    }
    async publish(entity) {
        const lg = this.logger.child({ method: 'publish' });
        lg.debug({ state: 'CHANNEL_PUBLISH', entity: entity.name });
        this.publishQueue.push(entity);
        await this.processQueue();
    }
    async subscribeConsumer(entity) {
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
            var _a, _b, _c, _d;
            if (!message) {
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
                if (this.consumer.fullOptions.autoAck && !((_a = this.consumer.fullOptions.consumerOptions) === null || _a === void 0 ? void 0 : _a.noAck)) {
                    (_b = this.channel) === null || _b === void 0 ? void 0 : _b.ack(message);
                }
            }
            catch (err) {
                if (this.consumer.fullOptions.autoAck && !((_c = this.consumer.fullOptions.consumerOptions) === null || _c === void 0 ? void 0 : _c.noAck)) {
                    (_d = this.channel) === null || _d === void 0 ? void 0 : _d.nack(message);
                }
                lg.debug({ state: 'PROCESS_CONSUMER_MESSAGE_PROCESS_ERROR', messageId: message.properties.messageId });
            }
        }, this.consumer.fullOptions.consumerOptions);
    }
    resetConnection(connection) {
        this.channel = null;
        this.isProcessingPublishQueue = false;
        this.isProcessingConsume = false;
        this.connection = connection;
        if (this.options.initiate) {
            void this.startChannel();
        }
    }
    async createChannel() {
        const lg = this.logger.child({ method: 'createChannel' });
        lg.debug({ status: 'CHANNEL_CREATION' });
        try {
            if (this.options.confirmChannel) {
                return await this.connection.createConfirmChannel();
            }
            else {
                return await this.connection.createChannel();
            }
        }
        catch (err) {
            lg.error({ state: 'CHANNEL_CREATION_ERROR', err });
            throw err;
        }
    }
    async processQueue() {
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
                lg.debug({ state: 'PROCESS_QUEUE_WAIT_FOR_CHANNEL' });
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
            }
            catch (err) {
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
    async waitForChannel() {
        const lg = this.logger.child({ method: 'waitForChannel' });
        lg.debug({ state: 'CHANNEL_WAIT' });
        try {
            if (!this.channel) {
                lg.info({ state: 'CHANNEL_WAIT_OPENING' });
                await this.startChannel();
                return true;
            }
            return false;
        }
        catch (err) {
            lg.error({ state: 'CHANNEL_WAIT_ERROR', err });
            throw err;
        }
    }
    async startChannel() {
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
        }
        catch (err) {
            lg.error({ state: 'CHANNEL_START_ERROR', err });
            if (this.options.retryChannel) {
                this.startRetryChannel();
            }
            else {
                throw err;
            }
        }
    }
    startRetryChannel() {
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
    async sendData(entity) {
        const lg = this.logger.child({ method: 'sendData' });
        if (!this.channel) {
            lg.error({ state: 'CHANNEL_NOT_INITIALIZED' });
            throw new Error('Channel is not initialized');
        }
        let result = false;
        if (entity.fullOptions.type === RabbitMQPublishTargetType.EXCHANGE) {
            result = this.channel.publish(entity.fullOptions.target, entity.fullOptions.routingKey, this.prepareData(entity), entity.fullOptions.publishOptions);
        }
        else if (entity.fullOptions.type === RabbitMQPublishTargetType.QUEUE) {
            result = this.channel.sendToQueue(entity.fullOptions.target, this.prepareData(entity), entity.fullOptions.publishOptions);
        }
        else {
            throw new Error('Invalid target type');
        }
        if (!result) {
            return RabbitMQChannelPublishState.BUFFER_FULL;
        }
        if ('waitForConfirms' in this.channel) {
            try {
                const confirmChannel = this.channel;
                await confirmChannel.waitForConfirms();
                lg.debug({ state: 'CHANNEL_MESSAGE_CONFIRMED', entity: entity.name });
                return RabbitMQChannelPublishState.MESSAGE_CONFIRMED;
            }
            catch (err) {
                lg.debug({ state: 'CHANNEL_MESSAGE_NOT_CONFIRMED', entity: entity.name });
                return RabbitMQChannelPublishState.MESSAGE_NOT_CONFIRMED;
            }
        }
        return RabbitMQChannelPublishState.SENT;
    }
    prepareData(entity) {
        return Buffer.from(JSON.stringify(entity.provide));
    }
    extractData(data) {
        const json = data.toString('utf-8');
        return JSON.parse(json);
    }
    static addDefaultOptions(options) {
        return {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }
}
