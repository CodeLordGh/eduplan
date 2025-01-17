"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    // Success Responses
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    // Redirection
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    TEMPORARY_REDIRECT: 307,
    PERMANENT_REDIRECT: 308,
    // Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    CONFLICT: 409,
    GONE: 410,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    // Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};
//# sourceMappingURL=http-status.js.map