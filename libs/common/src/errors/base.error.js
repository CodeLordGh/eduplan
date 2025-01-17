"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = exports.isError = exports.createError = void 0;
const createError = (message, code, statusCode = 500, details) => {
    const error = new Error(message);
    error.toJSON = () => ({
        error: {
            message,
            code,
            statusCode,
            details,
            stack: error.stack
        }
    });
    return error;
};
exports.createError = createError;
const isError = (error) => {
    return error instanceof Error;
};
exports.isError = isError;
const getErrorMessage = (error) => {
    if ((0, exports.isError)(error)) {
        return error.message;
    }
    return 'Unknown error occurred';
};
exports.getErrorMessage = getErrorMessage;
//# sourceMappingURL=base.error.js.map