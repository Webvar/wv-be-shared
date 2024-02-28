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
        throw Error("Publisher getter should be overwritten with static string");
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
