// helpers/logger.d.ts

import { Logger, SerializerFn } from 'pino';
import { RequestHandler } from 'express';

export function loggerFactory(fileUrl: string): Logger;

export function expressPinoFactory(logger: Logger, ignorePaths?: string[]): RequestHandler;

export const redaction: SerializerFn;
