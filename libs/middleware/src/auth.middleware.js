"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.checkRole = exports.authenticate = exports.verifyAndAttachUser = exports.extractToken = void 0;
const common_1 = require("@eduflow/common");
const extractToken = (request) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw (0, common_1.createUnauthorizedError)('No token provided');
    }
    return token;
};
exports.extractToken = extractToken;
const verifyAndAttachUser = async (request) => {
    try {
        const user = await request.jwtVerify();
        return Object.assign(request, { user });
    }
    catch (error) {
        throw (0, common_1.createInvalidTokenError)(error instanceof Error ? error.message : 'Invalid token');
    }
};
exports.verifyAndAttachUser = verifyAndAttachUser;
const authenticate = async (request) => (0, exports.verifyAndAttachUser)(request);
exports.authenticate = authenticate;
const checkRole = (allowedRoles) => (user) => {
    if (!allowedRoles.includes(user.role)) {
        throw (0, common_1.createUnauthorizedError)(`User role ${user.role} is not authorized to access this resource`);
    }
};
exports.checkRole = checkRole;
const authorize = (roles) => async (request) => {
    const authenticatedRequest = await (0, exports.authenticate)(request);
    (0, exports.checkRole)(roles)(authenticatedRequest.user);
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map