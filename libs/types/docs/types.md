# Types Library Documentation

This document provides a comprehensive overview of all types and interfaces exported from the types library.

## Table of Contents
- [Event System Types](#event-system-types)
  - [Core Event Types](#core-event-types)
  - [Event Bus Configuration](#event-bus-configuration)
  - [Event Bus State](#event-bus-state)
  - [Academic Events](#academic-events)
- [Authentication Types](#authentication-types)
  - [ABAC (Attribute Based Access Control)](#abac-attribute-based-access-control)
  - [Roles and Permissions](#roles-and-permissions)
  - [Status Types](#status-types)
- [Academic Types](#academic-types)
  - [Report Cards](#report-cards)
  - [Grades](#grades)
- [Error Types](#error-types)
- [Other Types](#other-types)
- [Logger Types](#logger-types)
- [File Types](#file-types)
- [KYC Types](#kyc-types)
- [Database Types](#database-types)
- [Validation Types](#validation-types)
- [Resilience Types](#resilience-types)
  - [Circuit Breaker Types](#circuit-breaker-types)
  - [Redis Pool Types](#redis-pool-types)
  - [Batch Processing Types](#batch-processing-types)

## Event System Types

Located in `src/events/`, these types define the event system's core functionality.

### Core Event Types

Located in `src/events/handlers.ts`:

- `Event<T>`
  ```typescript
  {
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
  ```

- `EventHandler<T>`
  ```typescript
  type EventHandler<T> = (event: Event<T>) => Promise<void>;
  ```

### Event Bus Configuration

Located in `src/events/config.ts`:

- `EventBusConfig`
  ```typescript
  {
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
  ```

- `PublishOptions`
  ```typescript
  {
    persistent?: boolean;
    priority?: number;
    cache?: boolean;
  }
  ```

- `SubscribeOptions`
  ```typescript
  {
    queueName?: string;
    durable?: boolean;
    useCache?: boolean;
  }
  ```

### Event Bus State

Located in `src/events/state.ts`:

- `EventBusState`
  ```typescript
  {
    config: EventBusConfig;
    handlers: Map<string, EventHandler>;
  }
  ```

- `EventBus`
  ```typescript
  {
    publish: <T>(event: Event<T>, options?: PublishOptions) => Promise<void>;
    subscribe: <T>(eventType: string, handler: EventHandler<T>, options?: SubscribeOptions) => Promise<void>;
    close: () => Promise<void>;
  }
  ```

### Domain Events

Located in `src/events/index.ts`:

#### Auth Events

- `UserCreatedEvent`
  ```typescript
  {
    type: 'USER_CREATED';
    data: {
      userId: string;
      email: string;
      role: Role;
      status: UserStatus;
      createdAt: Date;
    };
  }
  ```

- `UserUpdatedEvent`
  ```typescript
  {
    type: 'USER_UPDATED';
    data: {
      userId: string;
      updates: Partial<User>;
      updatedAt: Date;
    };
  }
  ```

- `UserDeletedEvent`
  ```typescript
  {
    type: 'USER_DELETED';
    data: {
      userId: string;
      deletedAt: Date;
    };
  }
  ```

- `LoginAttemptedEvent`
  ```typescript
  {
    type: 'LOGIN_ATTEMPTED';
    data: {
      userId: string;
      success: boolean;
      ip: string;
      userAgent: string;
      timestamp: Date;
    };
  }
  ```

- `OTPGeneratedEvent`
  ```typescript
  {
    type: 'OTP_GENERATED';
    data: {
      userId: string;
      otpId: string;
      purpose: string;
      expiresAt: Date;
      generatedAt: Date;
    };
  }
  ```

#### KYC Events

- `KYCVerifiedEvent`
  ```typescript
  {
    type: 'KYC_VERIFIED';
    data: {
      userId: string;
      documentType: string;
      verificationId: string;
      verifiedAt: Date;
    };
  }
  ```

- `KYCRejectedEvent`
  ```typescript
  {
    type: 'KYC_REJECTED';
    data: {
      userId: string;
      reason: string;
      rejectedAt: Date;
    };
  }
  ```

- `EmploymentEligibilityUpdatedEvent`
  ```typescript
  {
    type: 'EMPLOYMENT_ELIGIBILITY_UPDATED';
    data: {
      userId: string;
      status: 'ELIGIBLE' | 'INELIGIBLE';
      reason?: string;
      updatedAt: Date;
    };
  }
  ```

#### Event Type Unions

- `AuthEvent`: Union of all authentication-related events
  ```typescript
  type AuthEvent = 
    | UserCreatedEvent
    | UserUpdatedEvent
    | UserDeletedEvent
    | LoginAttemptedEvent
    | OTPGeneratedEvent;
  ```

- `ConsumedAuthEvent`: Union of events consumed from other services
  ```typescript
  type ConsumedAuthEvent =
    | KYCVerifiedEvent
    | KYCRejectedEvent
    | EmploymentEligibilityUpdatedEvent;
  ```

### Academic Events

Located in `src/events/academic.ts`:

#### Academic Year Events

- `ACADEMIC_YEAR_CREATED`
  ```typescript
  {
    schoolId: string;
    academicYearId: string;
    name: string;
    timestamp: Date;
  }
  ```

- `TERM_STARTED`
  ```typescript
  {
    schoolId: string;
    termId: string;
    academicYearId: string;
    timestamp: Date;
  }
  ```

#### Grade Events

- `GRADE_RECORDED`
  ```typescript
  {
    schoolId: string;
    studentId: string;
    subjectId: string;
    teacherId: string;
    termId: string;
    grade: number;
    status: GradeStatus;
    timestamp: Date;
  }
  ```

- `MISSING_GRADES_ALERT`
  ```typescript
  {
    schoolId: string;
    termId: string;
    studentId: string;
    missingSubjects: Array<{
      subjectId: string;
      subjectName: string;
      teacherId: string;
      teacherName: string;
    }>;
    timestamp: Date;
  }
  ```

#### Report Card Events

- `REPORT_CARD_STATUS_UPDATED`
  ```typescript
  {
    schoolId: string;
    reportCardId: string;
    studentId: string;
    termId: string;
    previousStatus: ReportCardStatus;
    newStatus: ReportCardStatus;
    updatedBy: string;
    timestamp: Date;
  }
  ```

- `REPORT_CARD_PUBLISHED`
  ```typescript
  {
    schoolId: string;
    reportCardId: string;
    studentId: string;
    termId: string;
    publishedBy: string;  // Headmaster ID
    availableAt: Date;    // 72 hours after publishing
    timestamp: Date;
  }
  ```

- `REPORT_CARD_AVAILABLE`
  ```typescript
  {
    schoolId: string;
    reportCardId: string;
    studentId: string;
    termId: string;
    parentId: string;
    timestamp: Date;
  }
  ```

- `REPORT_CARD_ACCESSED`
  ```typescript
  {
    schoolId: string;
    reportCardId: string;
    studentId: string;
    accessedBy: string;   // Parent ID
    accessType: 'VIEW' | 'DOWNLOAD';
    timestamp: Date;
  }
  ```

### Event Constants

Located in `src/events/constants.ts`:

- `EVENT_TYPES`: Constant object containing all possible event type strings
  ```typescript
  {
    // Auth Events
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    LOGIN_ATTEMPTED: 'LOGIN_ATTEMPTED',
    OTP_GENERATED: 'OTP_GENERATED',

    // KYC Events
    KYC_SUBMITTED: 'KYC_SUBMITTED',
    KYC_VERIFIED: 'KYC_VERIFIED',
    KYC_REJECTED: 'KYC_REJECTED',
    SCHOOL_VERIFIED: 'SCHOOL_VERIFIED',
    EMPLOYMENT_ELIGIBILITY_UPDATED: 'EMPLOYMENT_ELIGIBILITY_UPDATED',

    // School Events
    SCHOOL_CREATED: 'SCHOOL_CREATED',
    SCHOOL_UPDATED: 'SCHOOL_UPDATED',
    CLASS_CREATED: 'CLASS_CREATED',
    STAFF_ASSIGNED: 'STAFF_ASSIGNED',

    // Academic Events
    GRADE_RECORDED: 'GRADE_RECORDED',
    ASSIGNMENT_CREATED: 'ASSIGNMENT_CREATED',
    PERFORMANCE_UPDATED: 'PERFORMANCE_UPDATED',

    // Payment Events
    PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    INVOICE_GENERATED: 'INVOICE_GENERATED',

    // Notification Events
    NOTIFICATION_SENT: 'NOTIFICATION_SENT',
    NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',

    // Social Events
    POST_CREATED: 'POST_CREATED',
    COMMENT_ADDED: 'COMMENT_ADDED',
    REACTION_ADDED: 'REACTION_ADDED',
    CONNECTION_REQUESTED: 'CONNECTION_REQUESTED',
    CONNECTION_UPDATED: 'CONNECTION_UPDATED',

    // Chat Events
    MESSAGE_SENT: 'MESSAGE_SENT',
    MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
    MESSAGE_READ: 'MESSAGE_READ',
    CHAT_CREATED: 'CHAT_CREATED',
    PARTICIPANT_ADDED: 'PARTICIPANT_ADDED',

    // AI Events
    AI_PREDICTION_GENERATED: 'AI_PREDICTION_GENERATED',
    LEARNING_PATH_CREATED: 'LEARNING_PATH_CREATED',

    // File Events
    FILE_UPLOADED: 'FILE_UPLOADED',
    FILE_DELETED: 'FILE_DELETED'
  }
  ```

- `EventType`: Type representing all possible event type strings
  ```typescript
  type EventType = keyof typeof EVENT_TYPES;
  ```

## Authentication Types

### ABAC (Attribute Based Access Control)

Located in `src/auth/abac.ts`, these types define the attribute-based access control system.

#### Core Types

- `ResourceAction`: `'CREATE' | 'READ' | 'UPDATE' | 'DELETE'`

- `SchoolRole`
  ```typescript
  {
    roles: Role[];
    permissions: Permission[];
    communicationPermissions: string[];
    assignedBy: string;
    createdAt: Date;
  }
  ```

- `KYCOfficerStatus`
  ```typescript
  {
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
  ```

#### User Types

- `UserKYC`
  ```typescript
  {
    status: KYCStatus;
    verifiedAt?: Date;
    documentIds: string[];
    officerStatus?: KYCOfficerStatus;
  }
  ```

- `UserEmployment`
  ```typescript
  {
    status: EmploymentEligibilityStatus;
    verifiedAt?: Date;
    documentIds: string[];
    currentSchools: string[];
  }
  ```

- `UserAccess`
  ```typescript
  {
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
  ```

#### Policy Types

- `PolicyConditions`
  ```typescript
  {
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
  ```

- `AccessPolicy`
  ```typescript
  {
    resource: string;
    action: ResourceAction;
    conditions: PolicyConditions;
  }
  ```

- `ValidationResult`
  ```typescript
  {
    granted: boolean;
    reason?: string;
  }
  ```

### Status Types

Located in `src/auth/status.ts`:

- `KYCStatus`: Status of KYC verification
- `EmploymentEligibilityStatus`: Employment verification status
- `UserStatus`: General user status
- `OTPStatus`: OTP verification status
- `OTPPurpose`: Purpose of OTP generation

## Academic Types

Located in `src/academic/`, these types define academic-related structures.

### Report Cards

- `ReportCardStatus`
  ```typescript
  enum {
    DRAFT
    PENDING_APPROVAL
    APPROVED
    PUBLISHED
    AVAILABLE
  }
  ```

- `ReportCard`
  ```typescript
  {
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
  ```

### Grades

- `GradeStatus`
  ```typescript
  enum {
    DRAFT
    SUBMITTED
    APPROVED
  }
  ```

- `Grade`
  ```typescript
  {
    subjectId: string;
    subjectName: string;
    teacherId: string;
    teacherName: string;
    grade: number;
    remarks?: string;
    status: GradeStatus;
  }
  ```

## Error Types

Located in `src/errors/`, these types define the error handling system.

### Core Types

- `ErrorCategory`: `'AUTH' | 'RESOURCE' | 'VALIDATION' | 'FILE' | 'SYSTEM'`

- `ErrorCode`: Union of all possible error codes

- `AppError`
  ```typescript
  {
    name: string;
    message: string;
    statusCode: number;
    code: ErrorCode;
    cause?: unknown;
    metadata?: ErrorMetadata;
  }
  ```

### Error Metadata Types

- `ValidationErrorMetadata`
  ```typescript
  {
    field: string;
    value: unknown;
    constraint: string;
    additionalFields?: Record<string, unknown>;
  }
  ```

- `FileErrorMetadata`
  ```typescript
  {
    filename: string;
    size?: number;
    type?: string;
    path?: string;
    quota?: {
      used: number;
      limit: number;
    };
  }
  ```

- `AuthErrorMetadata`
  ```typescript
  {
    userId?: string;
    requiredRoles?: string[];
    actualRoles?: string[];
    tokenExpiry?: Date;
  }
  ```

## Usage Notes

1. All types are designed to be used with TypeScript for maximum type safety
2. ABAC types form the foundation of the permission system
3. Error types provide a consistent error handling structure across the application
4. Academic types support the core educational features of the system

## Logger Types

Located in `src/logger/types.ts`:

### Core Types

- `Logger`: Core logging interface
  ```typescript
  interface Logger {
    trace: LogFn;
    debug: LogFn;
    info: LogFn;
    warn: LogFn;
    error: LogFn;
    fatal: LogFn;
    child: (context: Partial<LogContext>) => Logger;
  }
  ```

- `LogFn`: Log function signature
  ```typescript
  type LogFn = (message: string, context?: Partial<LogContext>) => void;
  ```

### Context Types

- `BaseContext`: Base logging context
  ```typescript
  interface BaseContext {
    service: string;
    environment: string;
    timestamp: string;
    correlationId?: string;
  }
  ```

- `LogContext`: Extended logging context
  ```typescript
  type LogContext = BaseContext & {
    [key: string]: unknown;
  };
  ```

- `LoggerOptions`: Logger configuration options
  ```typescript
  interface LoggerOptions {
    service: string;
    environment?: string;
    minLevel?: LogLevel;
    redactPaths?: string[];
  }
  ```

### Log Levels

- `LOG_LEVELS`: Available log levels
  ```typescript
  const LOG_LEVELS = {
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal'
  } as const;
  ```

- `LogLevel`: Log level type
  ```typescript
  type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
  ```

## File Types

Located in `src/file/types.ts`:

### Core Types

- Re-exported from `@eduflow/prisma`:
  ```typescript
  export { 
    FileType,
    FileCategory, 
    FileAccessLevel, 
    StorageProvider 
  } from '@eduflow/prisma';
  ```

### File Metadata Types

- `FileMetadata`
  ```typescript
  {
    filename: string;
    size: number;
    mimeType: string;
    hash: string;
    category: FileCategory;
    accessLevel: FileAccessLevel;
    provider: StorageProvider;
  }
  ```

## KYC Types

Located in `src/kyc/types.ts`:

### Core Types

- `KYCDocumentType`
  ```typescript
  type KYCDocumentType = 
    | 'IDENTITY'
    | 'ADDRESS'
    | 'EDUCATION'
    | 'EMPLOYMENT'
    | 'BACKGROUND_CHECK';
  ```

- `KYCVerificationStatus`
  ```typescript
  type KYCVerificationStatus = 
    | 'PENDING'
    | 'IN_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'EXPIRED';
  ```

### Document Types

- `KYCDocument`
  ```typescript
  {
    id: string;
    type: KYCDocumentType;
    fileId: string;
    metadata: Record<string, unknown>;
    status: KYCVerificationStatus;
    verifiedAt?: Date;
    verifiedBy?: string;
    expiresAt?: Date;
  }
  ```

## Database Types

Located in `src/database/types.ts`:

### Core Types

- Re-exported from `@eduflow/prisma`:
  ```typescript
  export type {
    Prisma,
    PrismaClient
  } from '@eduflow/prisma';
  ```

### Query Types

- `QueryOptions`
  ```typescript
  {
    include?: Record<string, boolean>;
    select?: Record<string, boolean>;
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
  }
  ```

## Validation Types

Located in `src/auth/validation.ts`:

### Authentication Types

- `Email`: Branded type for validated email
- `Password`: Branded type for validated password

- `LoginCredentials`
  ```typescript
  {
    email: Email;
    password: Password;
  }
  ```

- `RegistrationData`
  ```typescript
  {
    email: Email;
    password: Password;
    firstName: string;
    lastName: string;
    role: Role;
    metadata?: Record<string, unknown>;
  }
  ```

## Resilience Types

Located in `src/resilience/`, these types define the resilience patterns used across the system.

### Circuit Breaker Types

Located in `src/resilience/circuit-breaker.ts`:

- `CircuitBreakerOptions`
  ```typescript
  {
    timeout: number;        // Operation timeout in ms
    errorThreshold: number; // Failures before opening
    resetTimeout: number;   // Time before reset attempt
    monitorInterval?: number; // Health check interval
  }
  ```

- `CircuitBreakerState`
  ```typescript
  {
    failures: number;
    lastFailure: number | null;
    status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  }
  ```

### Redis Pool Types

Located in `src/resilience/redis-pool.ts`:

- `RedisPoolOptions`
  ```typescript
  {
    nodes: Array<{
      host: string;
      port: number;
    }>;
    maxConnections: number;
    minConnections?: number;
    acquireTimeout?: number;
    idleTimeout?: number;
  }
  ```

- `RedisPoolMetrics`
  ```typescript
  {
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    totalAcquired: number;
    totalReleased: number;
    errors: {
      connection: number;
      timeout: number;
      other: number;
    };
  }
  ```

### Batch Processing Types

Located in `src/resilience/batch-processor.ts`:

- `BatchProcessorOptions`
  ```typescript
  {
    batchSize: number;     // Messages per batch
    flushInterval: number; // Flush interval in ms
    maxRetries?: number;   // Max retry attempts
    retryDelay?: number;   // Base retry delay in ms
  }
  ```

- `BatchItem<T>`
  ```typescript
  {
    exchange: string;
    routingKey: string;
    content: T;
    headers?: Record<string, unknown>;
  }
  ```

- `BatchMetrics`
  ```typescript
  {
    currentBatchSize: number;
    averageBatchSize: number;
    totalProcessed: number;
    retries: {
      total: number;
      successful: number;
      failed: number;
    };
    latency: {
      min: number;
      max: number;
      average: number;
    };
  }
  ```

### Integration Types

- `ResilienceConfig`
  ```typescript
  {
    circuitBreaker?: CircuitBreakerOptions;
    redisPool?: RedisPoolOptions;
    batchProcessor?: BatchProcessorOptions;
  }
  ```

- `ResilienceMetrics`
  ```typescript
  {
    circuitBreaker?: CircuitBreakerState;
    redisPool?: RedisPoolMetrics;
    batchProcessor?: BatchMetrics;
  }
  ```

### Usage Notes

1. Circuit Breaker Types:
   - Used to prevent cascading failures
   - Configurable thresholds and timeouts
   - State monitoring and metrics

2. Redis Pool Types:
   - Connection pooling configuration
   - Load balancing across nodes
   - Performance monitoring

3. Batch Processing Types:
   - Message batching configuration
   - Retry policies
   - Performance metrics

For implementation details, see:
- [Circuit Breaker Implementation](../../common/docs/resilience.md#circuit-breaker)
- [Redis Pool Implementation](../../common/docs/resilience.md#redis-pool)
- [Batch Processing Implementation](../../common/docs/resilience.md#batch-processing)
