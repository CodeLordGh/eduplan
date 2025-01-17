"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const pino_1 = __importDefault(require("pino"));
const createBaseLogger = (service, options = {}) => (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    name: service,
    ...options,
});
const formatError = (error) => error
    ? {
        message: error.message,
        stack: error.stack,
    }
    : undefined;
const createLogFn = (logger, level) => (message, context = {}) => logger[level]({ ...context }, message);
const createErrorLogFn = (logger) => (message, error, context = {}) => logger.error({
    ...context,
    error: formatError(error),
}, message);
const createLogger = (service, options) => {
    const baseLogger = createBaseLogger(service, options);
    return {
        info: createLogFn(baseLogger, 'info'),
        error: createErrorLogFn(baseLogger),
        warn: createLogFn(baseLogger, 'warn'),
        debug: createLogFn(baseLogger, 'debug'),
        trace: createLogFn(baseLogger, 'trace'),
    };
};
exports.createLogger = createLogger;
//# sourceMappingURL=index.js.map