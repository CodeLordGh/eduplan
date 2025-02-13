/**
 * High-level error categories for better organization
 */
export type ErrorCategory =
  | 'AUTH' // Authentication & Authorization errors
  | 'RESOURCE' // Resource-related errors
  | 'VALIDATION' // Input validation errors
  | 'FILE' // File operation errors
  | 'SYSTEM'; // System-level errors

/**
 * Maps categories to their respective error codes
 */
export type ErrorCodeMap = {
  AUTH: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN';
  RESOURCE: 'NOT_FOUND' | 'CONFLICT';
  VALIDATION: 'VALIDATION_ERROR' | 'BAD_REQUEST';
  FILE:
    | 'FILE_SIZE_ERROR'
    | 'FILE_TYPE_ERROR'
    | 'FILE_QUOTA_ERROR'
    | 'FILE_ACCESS_ERROR'
    | 'FILE_NOT_FOUND';
  SYSTEM: 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE';
};

/**
 * All possible error codes in the system
 */
export type ErrorCode =
  | ErrorCodeMap['AUTH']
  | ErrorCodeMap['RESOURCE']
  | ErrorCodeMap['VALIDATION']
  | ErrorCodeMap['FILE']
  | ErrorCodeMap['SYSTEM'];

/**
 * Validation error metadata structure
 */
export type ValidationErrorMetadata = {
  field: string;
  value: unknown;
  constraint: string;
  additionalFields?: Record<string, unknown>;
};

/**
 * File error metadata structure
 */
export type FileErrorMetadata = {
  filename: string;
  size?: number;
  type?: string;
  path?: string;
  quota?: {
    used: number;
    limit: number;
  };
};

/**
 * Authentication error metadata structure
 */
export type AuthErrorMetadata = {
  userId?: string;
  requiredRoles?: string[];
  actualRoles?: string[];
  tokenExpiry?: Date;
};

/**
 * System error metadata structure
 */
export type SystemErrorMetadata = {
  service: string;
  operation: string;
  timestamp: Date;
  requestId?: string;
};

/**
 * Maps error codes to their specific metadata types
 */
export type ErrorMetadata = {
  // Authentication & Authorization
  AUTH_ERROR: AuthErrorMetadata;
  UNAUTHORIZED: AuthErrorMetadata;
  FORBIDDEN: AuthErrorMetadata;

  // Resource Errors
  NOT_FOUND: {
    resourceType: string;
    resourceId: string;
  };
  CONFLICT: {
    resourceType: string;
    conflictReason: string;
    conflictingIds?: string[];
  };

  // Validation & Input
  VALIDATION_ERROR: ValidationErrorMetadata;
  BAD_REQUEST: ValidationErrorMetadata;

  // File Operations
  FILE_SIZE_ERROR: FileErrorMetadata;
  FILE_TYPE_ERROR: FileErrorMetadata;
  FILE_QUOTA_ERROR: FileErrorMetadata;
  FILE_ACCESS_ERROR: FileErrorMetadata;
  FILE_NOT_FOUND: FileErrorMetadata;

  // System Errors
  INTERNAL_SERVER_ERROR: SystemErrorMetadata;
  SERVICE_UNAVAILABLE: SystemErrorMetadata;
};

/**
 * Details required to create an error
 */
export type ErrorDetails = {
  /** The type of error that occurred */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Original error or cause (optional) */
  cause?: unknown;
  /** Type-safe metadata specific to the error code */
  metadata?: ErrorMetadata[keyof ErrorMetadata];
};

/**
 * Standard error structure used throughout the application
 */
export type AppError = {
  /** Name of the error (matches code) */
  name: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
  /** Application error code */
  code: ErrorCode;
  /** Original error or cause (optional) */
  cause?: unknown;
  /** Type-safe metadata specific to the error code */
  metadata?: ErrorMetadata[keyof ErrorMetadata];
};

/**
 * Standard error response format for all APIs
 */
export type ErrorResponse = {
  error: AppError;
};
