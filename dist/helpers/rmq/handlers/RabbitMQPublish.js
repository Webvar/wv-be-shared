export var RabbitMQPublishTargetType;
(function (RabbitMQPublishTargetType) {
    RabbitMQPublishTargetType["QUEUE"] = "queue";
    RabbitMQPublishTargetType["EXCHANGE"] = "exchange";
})(RabbitMQPublishTargetType || (RabbitMQPublishTargetType = {}));
export const DEFAULT_OPTIONS = {
    type: RabbitMQPublishTargetType.EXCHANGE,
    target: '',
    routingKey: '',
};
export class RabbitMQPublish {
    constructor() {
        this.retries = 0;
    }
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
