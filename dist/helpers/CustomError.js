// helpers/CustomError.js
import { v4 as uuid } from 'uuid';
import loggerFactory from '../logger.js';
const logger = loggerFactory(import.meta.url);
/**
 * This CustomError class adds unique code message to the code, and prints it to the customer
 * so, after, the real error could be found on logs by searching this custom unique code
 */
class CustomError extends Error {
    constructor(message, err) {
        super(message);
        const errorCode = uuid();
        logger.error({ errorCode, message, err: (err || this) });
        this.message = `Internal error (${errorCode}), please contact support.`;
    }
}
export default CustomError;
