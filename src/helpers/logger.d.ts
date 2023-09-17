// helpers/logger.d.ts

import { Logger } from 'pino';
import { RequestHandler } from 'express';

export function loggerFactory(fileUrl: string): Logger;
export default loggerFactory;

export function expressPinoFactory(logger: Logger, ignorePaths?: string[]): RequestHandler;
