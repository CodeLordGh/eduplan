import { Permission, UserRole } from '@eduflow/types';
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
}
export declare const hashPassword: (password: string) => Promise<string>;
export declare const verifyPassword: (hash: string, password: string) => Promise<boolean>;
export declare const generateJWT: (payload: JWTPayload) => string;
export declare const generateRefreshToken: () => string;
export declare const verifyJWT: (token: string) => JWTPayload;
export declare const generateOTP: () => string;
export declare const encryptToken: (token: string) => string;
export declare const decryptToken: (encryptedToken: string) => string;
export declare const hasPermission: (userPermissions: Permission[], requiredPermission: Permission) => boolean;
export declare const isRoleAuthorized: (userRole: UserRole, requiredRole: UserRole, roleHierarchy: Record<UserRole, UserRole[]>) => boolean;
export declare const getSecurityHeaders: () => Record<string, string>;
//# sourceMappingURL=security.d.ts.map