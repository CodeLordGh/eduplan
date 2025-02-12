import type { Role } from '@eduflow/prisma';

// Re-export the Role type from Prisma
// Test change to verify build system
// Another test change
export { Role } from '@eduflow/prisma';

export enum Permission {
  // System-wide permissions
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  VIEW_SYSTEM_LOGS = 'VIEW_SYSTEM_LOGS',

  // School management
  CREATE_SCHOOL = 'CREATE_SCHOOL',
  MANAGE_SCHOOL = 'MANAGE_SCHOOL',
  VIEW_SCHOOL = 'VIEW_SCHOOL',

  // User management
  CREATE_USER = 'CREATE_USER',
  MANAGE_USER = 'MANAGE_USER',
  VIEW_USER = 'VIEW_USER',

  // Academic management
  MANAGE_CLASSES = 'MANAGE_CLASSES',
  MANAGE_GRADES = 'MANAGE_GRADES',
  VIEW_GRADES = 'VIEW_GRADES',

  // Financial management
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',

  // Communication
  SEND_NOTIFICATIONS = 'SEND_NOTIFICATIONS',
  MANAGE_COMMUNICATIONS = 'MANAGE_COMMUNICATIONS',
}

// Business logic for role hierarchy
export const ROLE_HIERARCHY: Record<Role, readonly Role[]> = {
  SYSTEM_ADMIN: [], // Top level, no superiors
  SCHOOL_OWNER: ['SYSTEM_ADMIN'],
  SCHOOL_HEAD: ['SYSTEM_ADMIN', 'SCHOOL_OWNER'],
  SCHOOL_ADMIN: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD'],
  TEACHER: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN'],
  ACCOUNTANT: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN'],
  PARENT: ['SYSTEM_ADMIN'],
  STUDENT: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN', 'TEACHER'],
  CHEF: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN'],
  SECURITY: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN'],
  TRANSPORT_OFFICER: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN'],
  KYC_OFFICER: ['SYSTEM_ADMIN'],
  OTHER: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN'],
};

// Business logic for role permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SYSTEM_ADMIN: Object.values(Permission),
  SCHOOL_OWNER: [
    Permission.MANAGE_SCHOOL,
    Permission.VIEW_SCHOOL,
    Permission.CREATE_USER,
    Permission.MANAGE_USER,
    Permission.VIEW_USER,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.SEND_NOTIFICATIONS,
  ],
  SCHOOL_HEAD: [
    Permission.VIEW_SCHOOL,
    Permission.MANAGE_CLASSES,
    Permission.MANAGE_GRADES,
    Permission.VIEW_GRADES,
    Permission.VIEW_PAYMENTS,
    Permission.SEND_NOTIFICATIONS,
  ],
  SCHOOL_ADMIN: [
    Permission.VIEW_SCHOOL,
    Permission.CREATE_USER,
    Permission.MANAGE_USER,
    Permission.MANAGE_CLASSES,
    Permission.VIEW_GRADES,
    Permission.SEND_NOTIFICATIONS,
  ],
  TEACHER: [Permission.MANAGE_GRADES, Permission.VIEW_GRADES, Permission.SEND_NOTIFICATIONS],
  ACCOUNTANT: [Permission.MANAGE_PAYMENTS, Permission.VIEW_PAYMENTS],
  PARENT: [Permission.VIEW_GRADES, Permission.VIEW_PAYMENTS],
  STUDENT: [Permission.VIEW_GRADES],
  CHEF: [],
  SECURITY: [],
  TRANSPORT_OFFICER: [],
  KYC_OFFICER: [Permission.VIEW_USER, Permission.MANAGE_USER, Permission.VIEW_SYSTEM_LOGS],
  OTHER: [],
};

export type UserRole = Role;
