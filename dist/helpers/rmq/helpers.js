export const bindQueue = (rmq, type) => async (queue, source, pattern) => {
    await rmq.assertExchange(source, type, { durable: true });
    await rmq.assertQueue(queue, { durable: true });
    await rmq.bindQueue(queue, source, pattern);
};
export const bindTopic = (rmq) => bindQueue(rmq, 'topic');
export const assertBasicExchange = (rmq) => async (exchange) => {
    await rmq.assertExchange(exchange, 'topic', { durable: true });
};
export const assertBasicQueue = (rmq) => async (queue) => {
    await rmq.assertQueue(queue, { durable: true });
};
