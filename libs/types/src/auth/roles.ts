import type { Role } from '@eduflow/prisma'

// Re-export Prisma's Role type
export { Role } from '@eduflow/prisma'

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
  MANAGE_COMMUNICATIONS = 'MANAGE_COMMUNICATIONS'
}

export const ROLE_HIERARCHY = {
  'SYSTEM_ADMIN': [],  // Top level, no superiors
  'SCHOOL_OWNER': ['SYSTEM_ADMIN' as Role],
  'SCHOOL_HEAD': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role],
  'SCHOOL_ADMIN': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role],
  'TEACHER': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role, 'SCHOOL_ADMIN' as Role],
  'ACCOUNTANT': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role, 'SCHOOL_ADMIN' as Role],
  'PARENT': ['SYSTEM_ADMIN' as Role],
  'STUDENT': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role, 'SCHOOL_ADMIN' as Role, 'TEACHER' as Role],
  'CHEF': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role, 'SCHOOL_ADMIN' as Role],
  'SECURITY': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role, 'SCHOOL_ADMIN' as Role],
  'TRANSPORT_OFFICER': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role, 'SCHOOL_ADMIN' as Role],
  'OTHER': ['SYSTEM_ADMIN' as Role, 'SCHOOL_OWNER' as Role, 'SCHOOL_HEAD' as Role, 'SCHOOL_ADMIN' as Role]
} as const as Record<Role, readonly Role[]>;

export const ROLE_PERMISSIONS = {
  'SYSTEM_ADMIN': Object.values(Permission),
  'SCHOOL_OWNER': [
    Permission.MANAGE_SCHOOL,
    Permission.VIEW_SCHOOL,
    Permission.CREATE_USER,
    Permission.MANAGE_USER,
    Permission.VIEW_USER,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.SEND_NOTIFICATIONS
  ],
  'SCHOOL_HEAD': [
    Permission.VIEW_SCHOOL,
    Permission.MANAGE_CLASSES,
    Permission.MANAGE_GRADES,
    Permission.VIEW_GRADES,
    Permission.VIEW_PAYMENTS,
    Permission.SEND_NOTIFICATIONS
  ],
  'SCHOOL_ADMIN': [
    Permission.VIEW_SCHOOL,
    Permission.CREATE_USER,
    Permission.MANAGE_USER,
    Permission.MANAGE_CLASSES,
    Permission.VIEW_GRADES,
    Permission.SEND_NOTIFICATIONS
  ],
  'TEACHER': [
    Permission.MANAGE_GRADES,
    Permission.VIEW_GRADES,
    Permission.SEND_NOTIFICATIONS
  ],
  'ACCOUNTANT': [
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS
  ],
  'PARENT': [
    Permission.VIEW_GRADES,
    Permission.VIEW_PAYMENTS
  ],
  'STUDENT': [
    Permission.VIEW_GRADES
  ],
  'CHEF': [],
  'SECURITY': [],
  'TRANSPORT_OFFICER': [],
  'OTHER': []
} as const as Record<Role, Permission[]>;

export type UserRole = Role;