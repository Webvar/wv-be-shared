/**
 * Pino middleware factory for express
 * @param {import('pino').Logger} logger Initiated logger
 * @param {Array<String>} ignorePaths Aditional paths to ignore. '/healthcheck' and '/favicon.ico' already included
 * @returns {ExpressMiddleware} express middleware to use with app.use(..)
 */
export function expressPinoFactory(logger: import('pino').Logger, ignorePaths?: Array<string>): ExpressMiddleware;
export default loggerFactory;
/**
 * @param {string} fileUrl File URL usually comes from 'import.meta.url'
 * @returns {import('pino').Logger} Logger
 */
declare function loggerFactory(fileUrl: string): import('pino').Logger;
