import { connect } from 'amqplib';
import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async/fixed';
import loggerFactory from '../logger.js';
import { RabbitMQChannel } from './RabbitMQChannel.js';
const logger = loggerFactory('file:///rmq/RabbitMQ.ts');
const DEFAULT_OPTIONS = {
    url: 'amqp://localhost:5672',
    reconnect: true,
    reconnectTimeout: 5000,
};
export class RabbitMQ {
    get currentConnection() {
        return this.connection;
    }
    waitConnection() {
        return this.connectionEstablished;
    }
    constructor(options) {
        this.logger = logger.child({ class: 'RabbitMQ' });
        this.reconnectInterval = null;
        this.channels = {};
        const lg = this.logger.child({ method: 'constructor' });
        lg.info({ state: 'Set options', options });
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
        });
    }
    async createConnection() {
        const lg = this.logger.child({ method: 'startConnection' });
        try {
            lg.debug({ state: 'CONNECTION_START' });
            const connection = await connect(this.options.url);
            connection.once('close', async (err) => {
                const closeLg = this.logger.child({ method: 'close' });
                closeLg.error({ state: 'CONNECTION_UNEXPECTEDLY_CLOSED_RETRY', err });
                if (this.reconnectInterval) {
                    await clearIntervalAsync(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
                this.startRetryConnection();
            });
            lg.debug({ state: 'CONNECTION_SUCCESSFUL' });
            return connection;
        }
        catch (err) {
            lg.error({ state: 'CONNECTION_ERROR', err });
            this.startRetryConnection();
        }
        return null;
    }
    startRetryConnection() {
        if (this.reconnectInterval !== null && this.options.reconnect) {
            return;
        }
        const lg = this.logger.child({ method: 'startRetryConnection' });
        this.connectionEstablished = new Promise((resolve) => {
            const oldResolve = this.establishConnection;
            this.establishConnection = () => {
                oldResolve();
                resolve();
            };
        });
        lg.info({ state: 'CONNECTION_INITIATE_RETRY' });
        this.reconnectInterval = setIntervalAsync(async () => {
            lg.info({ state: 'CONNECTION_RETRY', reconnectTimeout: this.options.reconnectTimeout });
            this.connection = await this.createConnection();
            if (this.connection) {
                this.establishConnection();
                Object.values(this.channels).forEach((channel) => {
                    channel.resetConnection(this.connection);
                });
                if (this.reconnectInterval) {
                    await clearIntervalAsync(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            }
        }, this.options.reconnectTimeout);
    }
    static addDefaultOptions(options) {
        return {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }
    async publish(entity) {
        const lg = this.logger.child({ method: 'publish' });
        lg.debug({ state: 'PUBLISH' });
        await this.connectionEstablished;
        if (!this.connection) {
            lg.error({ state: 'PUBLISH_ERROR_CONNECTION', entity: entity.name });
            return;
        }
        if (!this.channels[entity.name]) {
            this.channels[entity.name] = new RabbitMQChannel(this.connection, {
                name: entity.name,
            });
            lg.debug({ state: 'PUBLISH_CREATE_CHANNEL', entity: entity.name });
        }
        try {
            await this.channels[entity.name].publish(entity);
            lg.debug({ state: 'PUBLISH_SUCCESSFUL', entity: entity.name });
        }
        catch (err) {
            lg.error({ state: 'PUBLISH_ERROR', err, entity: entity.name });
        }
    }
    async subscribe(entity) {
        const lg = this.logger.child({ method: 'subscribe' });
        lg.debug({ state: 'SUBSCRIBE' });
        await this.connectionEstablished;
        if (!this.connection) {
            lg.error({ state: 'SUBSCRIBE_ERROR_CONNECTION', entity: entity.name });
            return;
        }
        if (!this.channels[entity.name]) {
            this.channels[entity.name] = new RabbitMQChannel(this.connection, {
                name: entity.name,
                activityTimeout: 0,
            });
            lg.debug({ state: 'SUBSCRIBE_CREATE_CHANNEL', entity: entity.name });
        }
        try {
            await this.channels[entity.name].subscribeConsumer(entity);
            lg.debug({ state: 'SUBSCRIBE_SUCCESSFUL', entity: entity.name });
        }
        catch (err) {
            lg.error({ state: 'SUBSCRIBE_ERROR', err, entity: entity.name });
        }
    }
    async assertQueue(queue, options) {
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
            }
            catch (err) {
                lg.error({ state: 'ASSERT_QUEUE_ERROR', err, params });
            }
            await channel.close();
        }
        catch (err) {
            lg.error({ state: 'ASSERT_QUEUE_ERROR_CHANNEL', err, params });
            throw err;
        }
    }
    async assertExchange(exchange, type, options) {
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
            }
            catch (err) {
                lg.error({ state: 'ASSERT_EXCHANGE_ERROR', err, params });
            }
            await channel.close();
        }
        catch (err) {
            lg.error({ state: 'ASSERT_EXCHANGE_ERROR_CHANNEL', err, params });
            throw err;
        }
    }
    async bindQueue(queue, source, pattern) {
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
            }
            catch (err) {
                lg.error({ state: 'BIND_QUEUE_ERROR', err, params });
            }
            await channel.close();
        }
        catch (err) {
            lg.error({ state: 'BIND_QUEUE_ERROR_CHANNEL', err, params });
            throw err;
        }
    }
    async bindExchange(destination, source, pattern) {
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
            }
            catch (err) {
                lg.error({ state: 'BIND_EXCHANGE_ERROR', err, params });
            }
            await channel.close();
        }
        catch (err) {
            lg.error({ state: 'BIND_EXCHANGE_ERROR_CHANNEL', err, params });
            throw err;
        }
    }
}
