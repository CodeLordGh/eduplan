"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.BaseError = void 0;
class BaseError extends Error {
    constructor(name, message, cause, statusCode = 500) {
        super(message);
        this.name = name;
        this.cause = cause;
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.BaseError = BaseError;
const createError = (message, name, statusCode = 500, cause) => new BaseError(name, message, cause, statusCode);
exports.createError = createError;
//# sourceMappingURL=base.error.js.map