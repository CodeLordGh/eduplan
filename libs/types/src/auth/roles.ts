export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  SCHOOL_OWNER = 'SCHOOL_OWNER',
  SCHOOL_HEAD = 'SCHOOL_HEAD',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  ACCOUNTANT = 'ACCOUNTANT'
}

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

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [Role.SYSTEM_ADMIN]: [],  // Top level, no superiors
  [Role.SCHOOL_OWNER]: [Role.SYSTEM_ADMIN],
  [Role.SCHOOL_HEAD]: [Role.SYSTEM_ADMIN, Role.SCHOOL_OWNER],
  [Role.SCHOOL_ADMIN]: [Role.SYSTEM_ADMIN, Role.SCHOOL_OWNER, Role.SCHOOL_HEAD],
  [Role.TEACHER]: [Role.SYSTEM_ADMIN, Role.SCHOOL_OWNER, Role.SCHOOL_HEAD, Role.SCHOOL_ADMIN],
  [Role.ACCOUNTANT]: [Role.SYSTEM_ADMIN, Role.SCHOOL_OWNER, Role.SCHOOL_HEAD, Role.SCHOOL_ADMIN],
  [Role.PARENT]: [Role.SYSTEM_ADMIN],
  [Role.STUDENT]: [Role.SYSTEM_ADMIN, Role.SCHOOL_OWNER, Role.SCHOOL_HEAD, Role.SCHOOL_ADMIN, Role.TEACHER]
};

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SYSTEM_ADMIN]: Object.values(Permission),
  [Role.SCHOOL_OWNER]: [
    Permission.MANAGE_SCHOOL,
    Permission.VIEW_SCHOOL,
    Permission.CREATE_USER,
    Permission.MANAGE_USER,
    Permission.VIEW_USER,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.SEND_NOTIFICATIONS
  ],
  [Role.SCHOOL_HEAD]: [
    Permission.VIEW_SCHOOL,
    Permission.MANAGE_CLASSES,
    Permission.MANAGE_GRADES,
    Permission.VIEW_GRADES,
    Permission.VIEW_PAYMENTS,
    Permission.SEND_NOTIFICATIONS
  ],
  [Role.SCHOOL_ADMIN]: [
    Permission.VIEW_SCHOOL,
    Permission.CREATE_USER,
    Permission.MANAGE_USER,
    Permission.MANAGE_CLASSES,
    Permission.VIEW_GRADES,
    Permission.SEND_NOTIFICATIONS
  ],
  [Role.TEACHER]: [
    Permission.MANAGE_GRADES,
    Permission.VIEW_GRADES,
    Permission.SEND_NOTIFICATIONS
  ],
  [Role.ACCOUNTANT]: [
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS
  ],
  [Role.PARENT]: [
    Permission.VIEW_GRADES,
    Permission.VIEW_PAYMENTS
  ],
  [Role.STUDENT]: [
    Permission.VIEW_GRADES
  ]
};

export type UserRole = Role;