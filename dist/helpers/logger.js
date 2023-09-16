// helpers/logger.js
import path from 'path';
import noir from 'pino-noir';
import expressPino from 'express-pino-logger';
import pinoFactory from 'pino';
import { fileURLToPath } from 'url';
// To obscure sensitive information from logger
const redaction = noir({
    req: expressPino.stdSerializers.req,
    res: pinoFactory.stdSerializers.res,
    err: pinoFactory.stdSerializers.err,
}, [
    'password', 'key', 'req.headers.authorization', 'req.headers.authentication',
    'authorization', 'access_token', 'token', 'data.access_token',
], '[Redacted]');
/**
 * @param {string} fileUrl File URL usually comes from 'import.meta.url'
 * @returns {import('pino').Logger} Logger
 */
function loggerFactory(fileUrl) {
    const pino = pinoFactory({
        level: process.env.LOG_LEVEL || 'warn',
        serializers: redaction,
    });
    const callerFile = fileURLToPath(fileUrl);
    return pino.child({
        name: path.basename(callerFile, path.extname(callerFile)),
        path: path.basename(path.dirname(callerFile)),
        env: process.env.ENV,
    });
}
/**
 * Pino middleware factory for express
 * @param {import('pino').Logger} logger Initiated logger
 * @param {Array<String>} ignorePaths Aditional paths to ignore. '/healthcheck' and '/favicon.ico' already included
 * @returns {ExpressMiddleware} express middleware to use with app.use(..)
 */
export function expressPinoFactory(logger, ignorePaths = []) {
    return expressPino({
        logger,
        serializers: logger[Symbol.for('pino.serializers')],
        autoLogging: {
            ignorePaths: ['/healthcheck', '/favicon.ico', ...ignorePaths],
        },
    });
}
export default loggerFactory;
