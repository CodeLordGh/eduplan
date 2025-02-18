// Re-export security functions at root level
export { validateAccess, createPolicy, createAbacMiddleware } from './security/abac';

// Re-export other modules
export * from './errors';
export * from './auth';
export * from './user';
export * from './validation';

// Re-export security policies
export * from './security/policies';

// Export user transforms
export * from './user/transforms';

// Export error types
export * from './errors/base.error';

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
