# Types Library Documentation

This document provides a comprehensive overview of all types and interfaces exported from the types library.

## Table of Contents

- [Authentication Types](#authentication-types)
- [KYC Types](#kyc-types)
- [Academic Types](#academic-types)
- [Database Types](#database-types)
- [File Types](#file-types)
- [Error Types](#error-types)
- [User Types](#user-types)
- [Logger Types](#logger-types)
- [Event System Types](#event-system-types)
- [Validation Types](#validation-types)

## Authentication Types

### ABAC (Attribute Based Access Control)

```typescript
export interface UserAttributes {
  id: string;
  email: string;
  status: string;
  globalRoles: Role[];
  schoolRoles: Record<string, ExtendedRole>;
  academicProfile?: AcademicContext;
  kyc: {
    status: KYCStatus;
    officerStatus?: {
      permissions: {
        canVerifyIdentity: boolean;
        canVerifyDocuments: boolean;
        canVerifyEmployment: boolean;
      };
      assignedBy: string;
      assignedAt: Date;
    };
  };
  employment: {
    status: EmploymentEligibilityStatus;
    verifiedAt?: Date;
    verifiedBy?: string;
  };
  access: {
    lastLogin?: Date;
    failedAttempts: number;
    lockedUntil?: Date;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  };
  context: UserContext;
  subscriptions?: Subscription[];
}

export interface AccessPolicy {
  resource: string;
  action: ResourceAction;
  conditions: PolicyConditions;
}

export interface ValidationResult {
  granted: boolean;
  reason?: string;
}

export interface PolicyConditions {
  anyOf?: {
    roles?: Role[];
    permissions?: Permission[];
  };
  allOf?: {
    roles?: Role[];
    permissions?: Permission[];
  };
  school?: SchoolConditions;
  environment?: EnvironmentConditions;
  verification?: VerificationConditions;
  custom?: CustomEvaluator[];
}

export type ResourceAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'PROCESS';

export interface SchoolRole {
  roles: Role[];
  permissions: Permission[];
  communicationPermissions: string[];
  assignedBy: string;
  createdAt: Date;
}

export interface KYCOfficerStatus {
  isOfficer: boolean;
  permissions: {
    teacherDocuments: boolean;
    parentDocuments: boolean;
    schoolOwnerDocuments: boolean;
    approvalAuthority: boolean;
    gracePeriodManagement: boolean;
  };
  specializations: string[];
  workload: number;
}

export interface UserKYC {
  status: KYCStatus;
  verifiedAt?: Date;
  documentIds: string[];
  officerStatus?: KYCOfficerStatus;
}

export interface UserEmployment {
  status: EmploymentEligibilityStatus;
  verifiedAt?: Date;
  documentIds: string[];
  currentSchools: string[];
}

export interface TimeRestrictions {
  allowedDays: string[];
  allowedHours: string[];
  timezone: string;
}

export interface UserAccess {
  socialEnabled: boolean;
  hubAccess: {
    type: 'HUB' | 'B_HUB';
    permissions: string[];
  };
  restrictions: {
    ipWhitelist?: string[];
    allowedCountries?: string[];
    allowedDevices?: string[];
    timeRestrictions?: TimeRestrictions;
  };
  gracePeriod?: {
    type: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
}

export interface UserContext {
  currentSchoolId?: string;
  currentRole?: Role;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

### Roles and Status

```typescript
export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  SCHOOL_OWNER = 'SCHOOL_OWNER',
  SCHOOL_HEAD = 'SCHOOL_HEAD',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  ACCOUNTANT = 'ACCOUNTANT',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  CHEF = 'CHEF',
  SECURITY = 'SECURITY',
  TRANSPORT_OFFICER = 'TRANSPORT_OFFICER',
  KYC_OFFICER = 'KYC_OFFICER',
  OTHER = 'OTHER'
}

export enum Permission {
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  VIEW_SYSTEM_LOGS = 'VIEW_SYSTEM_LOGS',
  CREATE_SCHOOL = 'CREATE_SCHOOL',
  MANAGE_SCHOOL = 'MANAGE_SCHOOL',
  VIEW_SCHOOL = 'VIEW_SCHOOL',
  CREATE_USER = 'CREATE_USER',
  MANAGE_USER = 'MANAGE_USER',
  VIEW_USER = 'VIEW_USER',
  MANAGE_CLASSES = 'MANAGE_CLASSES',
  MANAGE_GRADES = 'MANAGE_GRADES',
  VIEW_GRADES = 'VIEW_GRADES',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',
  SEND_NOTIFICATIONS = 'SEND_NOTIFICATIONS',
  MANAGE_COMMUNICATIONS = 'MANAGE_COMMUNICATIONS'
}

export enum KYCStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum EmploymentEligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum OTPStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED'
}

export enum OTPPurpose {
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  VERIFY_PHONE = 'VERIFY_PHONE'
}
```

## Logger Types

```typescript
export const LOG_LEVELS = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export interface Logger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  child: (context: Partial<LogContext>) => Logger;
}

export interface LoggerOptions {
  service: string;
  environment?: string;
  minLevel?: LogLevel;
  redactPaths?: string[];
}

export interface LogContext extends BaseContext {
  [key: string]: unknown;
}

export type LogFn = (message: string, context?: Partial<LogContext>) => void;

export interface BaseContext {
  service: string;
  environment: string;
  timestamp: string;
  correlationId?: string;
}

export interface RequestLogger extends Logger {
  request: (req: unknown, context?: Partial<RequestContext>) => void;
  response: (res: unknown, context?: Partial<RequestContext>) => void;
}

export interface ErrorContext extends BaseContext {
  error: Error;
  stack?: string;
  code?: string;
}

export interface OperationContext extends BaseContext {
  operation: string;
  duration: number;
  result: string;
}

export interface ServiceContext extends BaseContext {
  service: string;
  method: string;
  params?: unknown;
}

export interface RequestContext extends BaseContext {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
  duration?: number;
  statusCode?: number;
}
```

## Event System Types

```typescript
// Event Configuration Types
export interface EventBusConfig {
  serviceName: string;
  rabbitmq: {
    url: string;
    exchange: string;
    deadLetterExchange: string;
    retryCount: number;
    retryDelay: number;
  };
  redis: {
    url: string;
    keyPrefix: string;
    eventTTL: number;
  };
}

// Event State Types
export interface EventBusState {
  config: EventBusConfig;
  handlers: Map<string, EventHandler>;
}

// Event Handler Types
export interface Event<T> {
  type: string;
  data: T;
  metadata: {
    version: string;
    source: string;
    correlationId: string;
    timestamp: string;
    schemaVersion: string;
  };
}

export type EventHandler<T> = (event: Event<T>) => Promise<void>;

// Event Constants
export const EVENT_TYPES = {
  // Auth Events
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  LOGIN_ATTEMPTED: 'LOGIN_ATTEMPTED',
  OTP_GENERATED: 'OTP_GENERATED',
  // ... other event types
} as const;

export type EventType = keyof typeof EVENT_TYPES;
```

## Academic Types

```typescript
export interface ReportCard {
  id: string;
  schoolId: string;
  studentId: string;
  termId: string;
  academicYearId: string;
  grades: Grade[];
  attendance: Attendance;
  remarks: ReportCardRemarks;
  status: ReportCardStatus;
  publishedAt?: Date;
  availableAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReportCardStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  AVAILABLE = 'AVAILABLE'
}

export interface Grade {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  grade: number;
  remarks?: string;
  status: GradeStatus;
}

export enum GradeStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED'
}

### Academic Context and Extended Roles

```typescript
export interface AcademicContext {
  subjects?: string[];
  grades?: string[];
  departments?: string[];
  programs?: string[];
}

export interface ContextualPermissions extends AcademicContext {
  customPermissions?: string[];
}

export interface ExtendedRole {
  baseRole: Role;
  academicRoles?: string[];
  contextualPermissions?: ContextualPermissions;
  assignedAt: Date;
  assignedBy: string;
  validUntil?: Date;
}

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
  OTHER: ['SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN']
};

export const DEFAULT_ACADEMIC_ROLES: Partial<Record<Role, string[]>> = {
  TEACHER: ['CLASS_TEACHER', 'SUBJECT_TEACHER'],
  SCHOOL_HEAD: ['PRINCIPAL', 'PROGRAM_COORDINATOR'],
  SCHOOL_ADMIN: ['DEPARTMENT_HEAD', 'GRADE_HEAD']
};
```

## Database Types

```typescript
export type { Prisma, PrismaClient } from '@eduflow/prisma';

export interface QueryOptions {
  include?: Record<string, boolean>;
  select?: Record<string, boolean>;
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
}
```

## File Types

```typescript
export enum FileType {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER'
}

export enum FileCategory {
  KYC = 'KYC',
  ACADEMIC = 'ACADEMIC',
  EMPLOYMENT = 'EMPLOYMENT',
  PROFILE = 'PROFILE',
  OTHER = 'OTHER'
}

export enum FileAccessLevel {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED'
}

export enum StorageProvider {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  GCS = 'GCS'
}

export interface FileMetadata {
  filename: string;
  size: number;
  mimeType: string;
  hash: string;
  category: FileCategory;
  accessLevel: FileAccessLevel;
  provider: StorageProvider;
}
```

## Error Types

```typescript
export type ErrorCategory = 'AUTH' | 'RESOURCE' | 'VALIDATION' | 'FILE' | 'SYSTEM';

export interface AppError extends Error {
  name: string;
  message: string;
  statusCode: number;
  code: ErrorCode;
  cause?: unknown;
  metadata?: ErrorMetadata;
}

export interface ValidationErrorMetadata {
  field: string;
  value: unknown;
  constraint: string;
  additionalFields?: Record<string, unknown>;
}

export interface FileErrorMetadata {
  filename: string;
  size?: number;
  type?: string;
  path?: string;
  quota?: {
    used: number;
    limit: number;
  };
}

export interface AuthErrorMetadata {
  userId?: string;
  requiredRoles?: string[];
  actualRoles?: string[];
  tokenExpiry?: Date;
}
```

## Validation Types

```typescript
export interface Email extends String {
  readonly __brand: unique symbol;
}

export interface Password extends String {
  readonly __brand: unique symbol;
}

export interface LoginCredentials {
  email: Email;
  password: Password;
}

export interface RegistrationData {
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
  role: Role;
  metadata?: Record<string, unknown>;
}
```
w