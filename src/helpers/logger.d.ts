// helpers/logger.d.ts

import { Logger } from 'pino';

export function loggerFactory(fileUrl: string): Logger;
export default loggerFactory;
