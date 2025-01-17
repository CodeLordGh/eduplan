"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = exports.validateOTPCode = exports.validatePasswordStrength = exports.loginAttemptSchema = exports.permissionCheckSchema = exports.roleAssignmentSchema = exports.verifyOTPSchema = exports.generateOTPSchema = exports.refreshTokenSchema = exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("@eduflow/types");
// Basic validation rules
const emailSchema = zod_1.z.string().email('Invalid email format');
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
const otpCodeSchema = zod_1.z.string().length(8, 'OTP must be exactly 8 digits').regex(/^\d+$/, 'OTP must contain only digits');
// User schemas
exports.createUserSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordSchema,
    role: zod_1.z.nativeEnum(types_1.UserRole),
    status: zod_1.z.nativeEnum(types_1.UserStatus).optional().default(types_1.UserStatus.PENDING)
});
exports.updateUserSchema = zod_1.z.object({
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: zod_1.z.nativeEnum(types_1.UserRole).optional(),
    status: zod_1.z.nativeEnum(types_1.UserStatus).optional()
});
// Authentication schemas
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string()
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string()
});
// OTP schemas
exports.generateOTPSchema = zod_1.z.object({
    email: emailSchema,
    purpose: zod_1.z.nativeEnum(types_1.OTPPurpose)
});
exports.verifyOTPSchema = zod_1.z.object({
    email: emailSchema,
    code: otpCodeSchema,
    purpose: zod_1.z.nativeEnum(types_1.OTPPurpose)
});
// Role and Permission schemas
exports.roleAssignmentSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    role: zod_1.z.nativeEnum(types_1.UserRole),
    assignedBy: zod_1.z.string().uuid()
});
exports.permissionCheckSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    permission: zod_1.z.nativeEnum(types_1.Permission)
});
// Login attempt schema
exports.loginAttemptSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    success: zod_1.z.boolean(),
    ip: zod_1.z.string(),
    userAgent: zod_1.z.string()
});
// Custom validation functions
const validatePasswordStrength = (password) => {
    try {
        passwordSchema.parse(password);
        return true;
    }
    catch {
        return false;
    }
};
exports.validatePasswordStrength = validatePasswordStrength;
const validateOTPCode = (code) => {
    try {
        otpCodeSchema.parse(code);
        return true;
    }
    catch {
        return false;
    }
};
exports.validateOTPCode = validateOTPCode;
const validateEmail = (email) => {
    try {
        emailSchema.parse(email);
        return true;
    }
    catch {
        return false;
    }
};
exports.validateEmail = validateEmail;
//# sourceMappingURL=index.js.map