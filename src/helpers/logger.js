// helpers/logger.js

import path from 'path';
import noir from 'pino-noir';
import expressPino from 'express-pino-logger';

import pinoFactory from 'pino';
import { fileURLToPath } from 'url';

// To obscure sensitive information from logger
const redaction = noir(
  {
    req: expressPino.stdSerializers.req,
    res: pinoFactory.stdSerializers.res,
    err: pinoFactory.stdSerializers.err,
  },
  [
    'password', 'key', 'req.headers.authorization', 'req.headers.authentication',
    'authorization', 'access_token', 'token', 'data.access_token',
  ],
  '[Redacted]',
);

/**
 * @param {string} fileUrl File URL usually comes from 'import.meta.url'
 * @returns {import('pino').Logger} Logger
 */
export function loggerFactory(fileUrl) {
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

export default loggerFactory;
