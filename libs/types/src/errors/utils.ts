import { ErrorCategory, ErrorCode, ErrorCodeMap, AppError, ErrorMetadata } from './types';

/**
 * Maps error codes to their HTTP status codes
 */
export const HTTP_STATUS_CODES: Record<ErrorCode, number> = {
  // Authentication & Authorization
  AUTH_ERROR: 401,
  UNAUTHORIZED: 403,
  FORBIDDEN: 403,
  
  // Resource Errors
  NOT_FOUND: 404,
  CONFLICT: 409,
  
  // Validation & Input
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  
  // File Operations
  FILE_SIZE_ERROR: 413,
  FILE_TYPE_ERROR: 415,
  FILE_QUOTA_ERROR: 507,
  FILE_ACCESS_ERROR: 403,
  FILE_NOT_FOUND: 404,
  
  // System Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error utilities for type-safe error handling
 */
export const errorUtils = {
  /**
   * Type guard to check if an error is of a specific category
   */
  isCategory: <C extends ErrorCategory>(
    error: AppError,
    category: C
  ): error is AppError & { code: ErrorCodeMap[C] } => {
    const categoryMap: Record<ErrorCategory, ErrorCode[]> = {
      AUTH: ['AUTH_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'],
      RESOURCE: ['NOT_FOUND', 'CONFLICT'],
      VALIDATION: ['VALIDATION_ERROR', 'BAD_REQUEST'],
      FILE: ['FILE_SIZE_ERROR', 'FILE_TYPE_ERROR', 'FILE_QUOTA_ERROR', 'FILE_ACCESS_ERROR', 'FILE_NOT_FOUND'],
      SYSTEM: ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE']
    };
    return categoryMap[category].includes(error.code);
  },

  /**
   * Type guard to check if metadata matches the error code
   */
  hasMetadata: <C extends ErrorCode>(
    error: AppError,
    code: C
  ): error is AppError & { code: C; metadata: ErrorMetadata[C] } =>
    error.code === code && error.metadata !== undefined,

  /**
   * Gets the HTTP status code for an error code
   */
  getStatusCode: (code: ErrorCode): number => HTTP_STATUS_CODES[code],

  /**
   * Gets the category for an error code
   */
  getCategory: (code: ErrorCode): ErrorCategory => {
    if (['AUTH_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'].includes(code)) return 'AUTH';
    if (['NOT_FOUND', 'CONFLICT'].includes(code)) return 'RESOURCE';
    if (['VALIDATION_ERROR', 'BAD_REQUEST'].includes(code)) return 'VALIDATION';
    if (['FILE_SIZE_ERROR', 'FILE_TYPE_ERROR', 'FILE_QUOTA_ERROR', 'FILE_ACCESS_ERROR', 'FILE_NOT_FOUND'].includes(code)) return 'FILE';
    return 'SYSTEM';
  }
}; 