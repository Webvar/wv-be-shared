"use strict";
// index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = exports.expressPinoFactory = exports.loggerFactory = void 0;
const logger_1 = require("./helpers/logger");
Object.defineProperty(exports, "loggerFactory", { enumerable: true, get: function () { return logger_1.loggerFactory; } });
Object.defineProperty(exports, "expressPinoFactory", { enumerable: true, get: function () { return logger_1.expressPinoFactory; } });
const CustomError_1 = __importDefault(require("./helpers/CustomError"));
exports.CustomError = CustomError_1.default;
