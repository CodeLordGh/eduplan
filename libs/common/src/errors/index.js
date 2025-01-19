"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const base_error_1 = require("./base.error");
const errorHandler = (error, request, reply) => {
    if (error instanceof base_error_1.BaseError) {
        return reply.status(error.statusCode || 500).send({
            error: error.name,
            message: error.message,
            statusCode: error.statusCode || 500,
        });
    }
    return reply.status(500).send({
        error: 'InternalServerError',
        message: error.message,
        statusCode: 500,
    });
};
exports.errorHandler = errorHandler;
__exportStar(require("./base.error"), exports);
//# sourceMappingURL=index.js.map