import { Role, Permission } from '@eduflow/types';

// Role and Permission Validation
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean => userPermissions.includes(requiredPermission);

export const isRoleAuthorized = (
  userRole: Role,
  requiredRole: Role,
  roleHierarchy: Record<Role, Role[]>
): boolean => userRole === requiredRole || roleHierarchy[requiredRole].includes(userRole);

// Security Headers
export const getSecurityHeaders = (): Record<string, string> => ({
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
});
