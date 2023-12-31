// helpers/CustomError.js

import { v4 as uuid } from 'uuid';
import loggerFactory from './logger.js';

// TODO: jest test can't recognize import.meta.url
// const logger = loggerFactory(import.meta.url);
const logger = loggerFactory('file:///helpers/CustomError.js');

/**
 * This CustomError class adds unique code message to the code, and prints it to the customer
 * so, after, the real error could be found on logs by searching this custom unique code
 */
class CustomError extends Error {
 /**
   * Creates an instance of CustomError.
   * @param {string} message - The error message.
   * @param {Error} [err] - The original error object.
   */
  constructor(message, err = undefined) {
    super(message);
    const errorCode = uuid();
    logger.error({ errorCode, message, err: (err || this) });
    this.message = `Internal error (${errorCode}), please contact support.`;
  }
}

export default CustomError;
