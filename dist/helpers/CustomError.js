"use strict";
// helpers/CustomError.js
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const logger_js_1 = __importDefault(require("../logger.js"));
const logger = (0, logger_js_1.default)(import.meta.url);
/**
 * This CustomError class adds unique code message to the code, and prints it to the customer
 * so, after, the real error could be found on logs by searching this custom unique code
 */
class CustomError extends Error {
    constructor(message, err) {
        super(message);
        const errorCode = (0, uuid_1.v4)();
        logger.error({ errorCode, message, err: (err || this) });
        this.message = `Internal error (${errorCode}), please contact support.`;
    }
}
exports.default = CustomError;
