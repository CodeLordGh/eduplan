import { ErrorDetails } from '@eduflow/types';
import { throwError } from './base.error';

export const createAuthenticationError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'AUTH_ERROR',
    message,
    cause,
    metadata,
  });

export const createInvalidCredentialsError = (
  cause?: unknown,
  metadata?: Record<string, unknown>
): never => createAuthenticationError('Invalid email or password', cause, metadata);

export const createTokenExpiredError = (
  cause?: unknown,
  metadata?: Record<string, unknown>
): never => createAuthenticationError('Token has expired', cause, metadata);

export const createInvalidTokenError = (
  cause?: unknown,
  metadata?: Record<string, unknown>
): never => createAuthenticationError('Invalid token provided', cause, metadata);

export const createUnauthorizedError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'UNAUTHORIZED',
    message,
    cause,
    metadata,
  });

export const createForbiddenError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'FORBIDDEN',
    message,
    cause,
    metadata,
  });

export const createOTPError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'AUTH_ERROR',
    message,
    cause,
    metadata,
  });

export const createOTPExpiredError = (cause?: unknown, metadata?: Record<string, unknown>): never =>
  createOTPError('OTP has expired', cause, metadata);

export const createInvalidOTPError = (cause?: unknown, metadata?: Record<string, unknown>): never =>
  createOTPError('Invalid OTP provided', cause, metadata);

// export const createAppError = createOTPError;  // Alias createOTPError as createAppError
