import { z } from 'zod';
import { UserRole, UserStatus, OTPPurpose, Permission } from '@eduflow/types';
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    status: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof UserStatus>>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
}, {
    email: string;
    password: string;
    role: UserRole;
    status?: UserStatus | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof UserStatus>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    password?: string | undefined;
    role?: UserRole | undefined;
    status?: UserStatus | undefined;
}, {
    email?: string | undefined;
    password?: string | undefined;
    role?: UserRole | undefined;
    status?: UserStatus | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const generateOTPSchema: z.ZodObject<{
    email: z.ZodString;
    purpose: z.ZodNativeEnum<typeof OTPPurpose>;
}, "strip", z.ZodTypeAny, {
    email: string;
    purpose: OTPPurpose;
}, {
    email: string;
    purpose: OTPPurpose;
}>;
export declare const verifyOTPSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
    purpose: z.ZodNativeEnum<typeof OTPPurpose>;
}, "strip", z.ZodTypeAny, {
    code: string;
    email: string;
    purpose: OTPPurpose;
}, {
    code: string;
    email: string;
    purpose: OTPPurpose;
}>;
export declare const roleAssignmentSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    assignedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: UserRole;
    userId: string;
    assignedBy: string;
}, {
    role: UserRole;
    userId: string;
    assignedBy: string;
}>;
export declare const permissionCheckSchema: z.ZodObject<{
    userId: z.ZodString;
    permission: z.ZodNativeEnum<typeof Permission>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    permission: Permission;
}, {
    userId: string;
    permission: Permission;
}>;
export declare const loginAttemptSchema: z.ZodObject<{
    userId: z.ZodString;
    success: z.ZodBoolean;
    ip: z.ZodString;
    userAgent: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    success: boolean;
    ip: string;
    userAgent: string;
}, {
    userId: string;
    success: boolean;
    ip: string;
    userAgent: string;
}>;
export declare const validatePasswordStrength: (password: string) => boolean;
export declare const validateOTPCode: (code: string) => boolean;
export declare const validateEmail: (email: string) => boolean;
//# sourceMappingURL=index.d.ts.map