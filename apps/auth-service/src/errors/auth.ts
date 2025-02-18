import { ERROR_CODES } from '@eduflow/constants';
import { AppError, ErrorCode, ErrorCategory, ValidationErrorMetadata, AuthErrorMetadata, SystemErrorMetadata } from '@eduflow/types';

// Standard error codes from ErrorCodeMap
export type AuthErrorCode = ErrorCode;

export type AuthErrors =
  | ValidationError
  | DatabaseError
  | DuplicateEmailError
  | InvalidCredentialsError
  | UserNotFoundError
  | EmailError;

export interface ValidationError extends AppError {
  category: 'VALIDATION';
  code: 'VALIDATION_ERROR';
  metadata: ValidationErrorMetadata;
}

export interface DatabaseError extends AppError {
  category: 'SYSTEM';
  code: 'INTERNAL_SERVER_ERROR';
  metadata?: SystemErrorMetadata;
}

export interface EmailError extends AppError {
  category: 'SYSTEM';
  code: 'SERVICE_UNAVAILABLE';
  metadata?: SystemErrorMetadata;
}

export interface DuplicateEmailError extends AppError {
  category: 'RESOURCE';
  code: 'CONFLICT';
  metadata: {
    resourceType: 'user';
    conflictReason: 'email_exists';
  };
}

export interface InvalidCredentialsError extends AppError {
  category: 'AUTH';
  code: 'UNAUTHORIZED';
  metadata?: AuthErrorMetadata;
}

export interface UserNotFoundError extends AppError {
  category: 'RESOURCE';
  code: 'NOT_FOUND';
  metadata: {
    resourceType: 'user';
    resourceId: string;
  };
}

export const isValidationError = (error: unknown): error is ValidationError =>
  typeof error === 'object' &&
  error !== null &&
  'category' in error &&
  'code' in error &&
  error.category === 'VALIDATION' &&
  error.code === 'VALIDATION_ERROR';

export const createValidationError = (
  message: string,
  metadata: ValidationErrorMetadata
): ValidationError => ({
  name: 'ValidationError',
  category: 'VALIDATION',
  code: 'VALIDATION_ERROR',
  message,
  metadata,
  statusCode: 400
});

export const createDatabaseError = (error: Error): DatabaseError => ({
  name: 'DatabaseError',
  category: 'SYSTEM',
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Database operation failed',
  cause: error,
  metadata: {
    service: 'auth-service',
    operation: 'database',
    timestamp: new Date(),
    requestId: error.name // You might want to get this from a context
  },
  statusCode: 500
});

export const createEmailError = (error?: Error): EmailError => ({
  name: 'EmailError',
  category: 'SYSTEM',
  code: 'SERVICE_UNAVAILABLE',
  message: 'Failed to send email',
  cause: error,
  metadata: {
    service: 'auth-service',
    operation: 'email',
    timestamp: new Date()
  },
  statusCode: 503
});

export const createDuplicateEmailError = (): DuplicateEmailError => ({
  name: 'DuplicateEmailError',
  category: 'RESOURCE',
  code: 'CONFLICT',
  message: 'Email already exists',
  metadata: {
    resourceType: 'user',
    conflictReason: 'email_exists'
  },
  statusCode: 409
});

export const createInvalidCredentialsError = (userId?: string): InvalidCredentialsError => ({
  name: 'InvalidCredentialsError',
  category: 'AUTH',
  code: 'UNAUTHORIZED',
  message: 'Invalid credentials',
  metadata: userId ? {
    userId,
    requiredRoles: [],
    actualRoles: []
  } : undefined,
  statusCode: 401
});

export const createUserNotFoundError = (userId: string): UserNotFoundError => ({
  name: 'UserNotFoundError',
  category: 'RESOURCE',
  code: 'NOT_FOUND',
  message: 'User not found',
  metadata: {
    resourceType: 'user',
    resourceId: userId
  },
  statusCode: 404
});
