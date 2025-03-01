// Re-export security functions at root level
export { validateAccess, createPolicy, createAbacMiddleware } from './security/abac';

// Re-export error handling
export { errorHandler, createError } from './errors';
export * from './auth';
export * from './user';
export * from './validation';

// Re-export security policies
export * from './security/policies';

// Export user transforms
export * from './user/transforms';

// Export error types and utilities
export {
  BaseError,
  createAppError,
  createErrorResponse,
  throwError,
} from './errors/base.error';

// Export auth error creators
export {
  createAuthenticationError,
  createInvalidCredentialsError,
  createTokenExpiredError,
  createInvalidTokenError,
  createUnauthorizedError,
  createForbiddenError,
  createOTPError,
  createOTPExpiredError,
  createInvalidOTPError,
} from './errors/auth.error';

// Export auth functions
export { hashPassword, verifyPassword, generateJWT } from './auth/utils';

// Export validation functions
export { validateEmail, validatePassword, emailSchema, passwordSchema } from './validation/user';

// Export file error creators
export {
  createFileSizeError,
  createFileTypeError,
  createFileQuotaError,
  createFileAccessError,
  createFileNotFoundError,
} from './errors/file.error';

// Export error utilities
export * from './errors/utils';

export { createCircuitBreaker } from './resilience/circuit-breaker';

// Re-export all error types and creators
export * from './errors';
