import { ERROR_CODES } from '@eduflow/constants';

export interface AuthError {
  code: keyof typeof ERROR_CODES;
  message: string;
  details?: unknown;
}

export interface EmailError extends AuthError {
  code: typeof ERROR_CODES.EMAIL_ERROR;
  message: string;
  cause?: Error;
}

export type AuthErrors =
  | ValidationError
  | DatabaseError
  | DuplicateEmailError
  | InvalidCredentialsError
  | UserNotFoundError
  | EmailError;

interface ValidationError extends AuthError {
  code: typeof ERROR_CODES.VALIDATION_ERROR;
  message: string;
  details?: unknown;
}

interface DatabaseError extends AuthError {
  code: typeof ERROR_CODES.DATABASE_ERROR;
  message: string;
  cause?: Error;
}

interface DuplicateEmailError extends AuthError {
  code: typeof ERROR_CODES.DUPLICATE_EMAIL;
  message: string;
}

interface InvalidCredentialsError extends AuthError {
  code: typeof ERROR_CODES.INVALID_CREDENTIALS;
  message: string;
}

interface UserNotFoundError extends AuthError {
  code: typeof ERROR_CODES.USER_NOT_FOUND;
  message: string;
}

export const createValidationError = (message: string, details?: unknown): ValidationError => ({
  code: ERROR_CODES.VALIDATION_ERROR,
  message,
  details,
});

export const createDatabaseError = (error: Error): DatabaseError => ({
  code: ERROR_CODES.DATABASE_ERROR,
  message: 'Database operation failed',
  cause: error,
});

export const createDuplicateEmailError = (): DuplicateEmailError => ({
  code: ERROR_CODES.DUPLICATE_EMAIL,
  message: 'Email already exists',
});

export const createInvalidCredentialsError = (): InvalidCredentialsError => ({
  code: ERROR_CODES.INVALID_CREDENTIALS,
  message: 'Invalid credentials',
});

export const createUserNotFoundError = (): UserNotFoundError => ({
  code: ERROR_CODES.USER_NOT_FOUND,
  message: 'User not found',
});

export const createEmailError = (error?: Error): EmailError => ({
  code: ERROR_CODES.EMAIL_ERROR,
  message: 'Failed to send email',
  cause: error,
});
