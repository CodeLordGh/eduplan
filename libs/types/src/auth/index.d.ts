export declare enum UserRole {
    SYSTEM_ADMIN = "SYSTEM_ADMIN",
    SCHOOL_OWNER = "SCHOOL_OWNER",
    SCHOOL_HEAD = "SCHOOL_HEAD",
    SCHOOL_ADMIN = "SCHOOL_ADMIN",
    TEACHER = "TEACHER",
    PARENT = "PARENT",
    STUDENT = "STUDENT",
    ACCOUNTANT = "ACCOUNTANT"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED",
    DELETED = "DELETED"
}
export declare enum OTPPurpose {
    REGISTRATION = "REGISTRATION",
    PASSWORD_RESET = "PASSWORD_RESET",
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
    STAFF_ONBOARDING = "STAFF_ONBOARDING",
    STUDENT_LINKING = "STUDENT_LINKING"
}
export declare enum OTPStatus {
    PENDING = "PENDING",
    USED = "USED",
    EXPIRED = "EXPIRED"
}
export interface User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface OTP {
    id: string;
    code: string;
    userId: string;
    purpose: OTPPurpose;
    expiresAt: Date;
    status: OTPStatus;
    createdAt: Date;
}
export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface LoginAttempt {
    id: string;
    userId: string;
    success: boolean;
    ip: string;
    userAgent: string;
    createdAt: Date;
}
export declare const ROLE_HIERARCHY: Record<UserRole, UserRole[]>;
export declare enum Permission {
    MANAGE_SYSTEM = "MANAGE_SYSTEM",
    VIEW_SYSTEM_LOGS = "VIEW_SYSTEM_LOGS",
    CREATE_SCHOOL = "CREATE_SCHOOL",
    MANAGE_SCHOOL = "MANAGE_SCHOOL",
    VIEW_SCHOOL = "VIEW_SCHOOL",
    CREATE_USER = "CREATE_USER",
    MANAGE_USER = "MANAGE_USER",
    VIEW_USER = "VIEW_USER",
    MANAGE_CLASSES = "MANAGE_CLASSES",
    MANAGE_GRADES = "MANAGE_GRADES",
    VIEW_GRADES = "VIEW_GRADES",
    MANAGE_PAYMENTS = "MANAGE_PAYMENTS",
    VIEW_PAYMENTS = "VIEW_PAYMENTS",
    SEND_NOTIFICATIONS = "SEND_NOTIFICATIONS",
    MANAGE_COMMUNICATIONS = "MANAGE_COMMUNICATIONS"
}
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
//# sourceMappingURL=index.d.ts.map