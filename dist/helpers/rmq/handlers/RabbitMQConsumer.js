export const DEFAULT_OPTIONS = {
    target: '',
    autoAck: true,
    prefetch: 1,
};
export class RabbitMQConsumer {
    get name() {
        return this.constructor.name;
    }
    get options() {
        return {};
    }
    get fullOptions() {
        return {
            ...DEFAULT_OPTIONS,
            ...this.options,
        };
    }
}
