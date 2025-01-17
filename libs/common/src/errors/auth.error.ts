import { createError } from './base.error';

export const createAuthenticationError = (message: string, details?: unknown) =>
  createError(message, 'AUTH_ERROR', 401, details);

export const createInvalidCredentialsError = (details?: unknown) =>
  createAuthenticationError('Invalid email or password', details);

export const createTokenExpiredError = (details?: unknown) =>
  createAuthenticationError('Token has expired', details);

export const createInvalidTokenError = (details?: unknown) =>
  createAuthenticationError('Invalid token provided', details);

export const createUnauthorizedError = (message: string, details?: unknown) =>
  createError(message, 'UNAUTHORIZED', 403, details);

export const createOTPError = (message: string, details?: unknown) =>
  createError(message, 'OTP_ERROR', 400, details);

export const createOTPExpiredError = (details?: unknown) =>
  createOTPError('OTP has expired', details);

export const createInvalidOTPError = (details?: unknown) =>
  createOTPError('Invalid OTP provided', details); 