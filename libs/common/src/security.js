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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityHeaders = exports.isRoleAuthorized = exports.hasPermission = exports.decryptToken = exports.encryptToken = exports.generateOTP = exports.verifyJWT = exports.generateRefreshToken = exports.generateJWT = exports.verifyPassword = exports.hashPassword = void 0;
const argon2 = __importStar(require("argon2"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const function_1 = require("fp-ts/function");
// Environment configuration
const getConfig = () => ({
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    encryptionKey: process.env.ENCRYPTION_KEY || ''
});
// Password Hashing
const hashPassword = (password) => argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
});
exports.hashPassword = hashPassword;
const verifyPassword = (hash, password) => argon2.verify(hash, password);
exports.verifyPassword = verifyPassword;
// JWT Handling
const generateJWT = (payload) => jwt.sign(payload, getConfig().jwtSecret, {
    expiresIn: getConfig().jwtExpiresIn
});
exports.generateJWT = generateJWT;
const generateRefreshToken = () => (0, crypto_1.randomBytes)(40).toString('hex');
exports.generateRefreshToken = generateRefreshToken;
const verifyJWT = (token) => jwt.verify(token, getConfig().jwtSecret);
exports.verifyJWT = verifyJWT;
// OTP Generation
const generateOTP = () => (0, function_1.pipe)((0, crypto_1.randomBytes)(4), (bytes) => bytes.readUInt32BE(0), (num) => num.toString(), (str) => str.padStart(8, '0'), (str) => str.slice(-8));
exports.generateOTP = generateOTP;
// Token Encryption
const generateIV = () => (0, crypto_1.randomBytes)(16);
const getEncryptionKey = () => Buffer.from(getConfig().encryptionKey, 'hex');
const encryptToken = (token) => {
    const iv = generateIV();
    const key = getEncryptionKey();
    const cipher = (0, crypto_1.createCipheriv)('aes-256-cbc', key, iv);
    return (0, function_1.pipe)(cipher.update(token, 'utf8', 'hex'), (encrypted) => encrypted + cipher.final('hex'), (encrypted) => `${iv.toString('hex')}:${encrypted}`);
};
exports.encryptToken = encryptToken;
const decryptToken = (encryptedToken) => {
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();
    const decipher = (0, crypto_1.createDecipheriv)('aes-256-cbc', key, iv);
    return (0, function_1.pipe)(decipher.update(encrypted, 'hex', 'utf8'), (decrypted) => decrypted + decipher.final('utf8'));
};
exports.decryptToken = decryptToken;
// Role and Permission Validation
const hasPermission = (userPermissions, requiredPermission) => userPermissions.includes(requiredPermission);
exports.hasPermission = hasPermission;
const isRoleAuthorized = (userRole, requiredRole, roleHierarchy) => userRole === requiredRole || roleHierarchy[requiredRole].includes(userRole);
exports.isRoleAuthorized = isRoleAuthorized;
// Security Headers
const getSecurityHeaders = () => ({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
});
exports.getSecurityHeaders = getSecurityHeaders;
//# sourceMappingURL=security.js.map