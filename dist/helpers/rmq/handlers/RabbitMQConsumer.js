export const DEFAULT_OPTIONS = {
    target: '',
    autoAck: true,
    prefetch: 1,
};
export class RabbitMQConsumer {
    get name() {
        throw Error("Consumer getter should be overwritten with static string");
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
