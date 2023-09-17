export default CustomError;
/**
 * This CustomError class adds unique code message to the code, and prints it to the customer
 * so, after, the real error could be found on logs by searching this custom unique code
 */
declare class CustomError extends Error {
    /**
      * Creates an instance of CustomError.
      * @param {string} message - The error message.
      * @param {Error} [err] - The original error object.
      */
    constructor(message: string, err?: Error | undefined);
}
