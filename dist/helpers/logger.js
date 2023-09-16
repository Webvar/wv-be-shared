"use strict";
// helpers/logger.js
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressPinoFactory = void 0;
const path_1 = __importDefault(require("path"));
const pino_noir_1 = __importDefault(require("pino-noir"));
const express_pino_logger_1 = __importDefault(require("express-pino-logger"));
const pino_1 = __importDefault(require("pino"));
const url_1 = require("url");
// To obscure sensitive information from logger
const redaction = (0, pino_noir_1.default)({
    req: express_pino_logger_1.default.stdSerializers.req,
    res: pino_1.default.stdSerializers.res,
    err: pino_1.default.stdSerializers.err,
}, [
    'password', 'key', 'req.headers.authorization', 'req.headers.authentication',
    'authorization', 'access_token', 'token', 'data.access_token',
], '[Redacted]');
/**
 * @param {string} fileUrl File URL usually comes from 'import.meta.url'
 * @returns {import('pino').Logger} Logger
 */
function loggerFactory(fileUrl) {
    const pino = (0, pino_1.default)({
        level: process.env.LOG_LEVEL || 'warn',
        serializers: redaction,
    });
    const callerFile = (0, url_1.fileURLToPath)(fileUrl);
    return pino.child({
        name: path_1.default.basename(callerFile, path_1.default.extname(callerFile)),
        path: path_1.default.basename(path_1.default.dirname(callerFile)),
        env: process.env.ENV,
    });
}
/**
 * Pino middleware factory for express
 * @param {import('pino').Logger} logger Initiated logger
 * @param {Array<String>} ignorePaths Aditional paths to ignore. '/healthcheck' and '/favicon.ico' already included
 * @returns {ExpressMiddleware} express middleware to use with app.use(..)
 */
function expressPinoFactory(logger, ignorePaths = []) {
    return (0, express_pino_logger_1.default)({
        logger,
        serializers: logger[Symbol.for('pino.serializers')],
        autoLogging: {
            ignorePaths: ['/healthcheck', '/favicon.ico', ...ignorePaths],
        },
    });
}
exports.expressPinoFactory = expressPinoFactory;
exports.default = loggerFactory;
