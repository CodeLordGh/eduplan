import { throwError } from './base.error';

export const createFileSizeError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'FILE_SIZE_ERROR',
    message,
    cause,
    metadata,
  });

export const createFileTypeError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'FILE_TYPE_ERROR',
    message,
    cause,
    metadata,
  });

export const createFileQuotaError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'FILE_QUOTA_ERROR',
    message,
    cause,
    metadata,
  });

export const createFileAccessError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'FILE_ACCESS_ERROR',
    message,
    cause,
    metadata,
  });

export const createFileNotFoundError = (
  message: string,
  cause?: unknown,
  metadata?: Record<string, unknown>
): never =>
  throwError({
    code: 'FILE_NOT_FOUND',
    message,
    cause,
    metadata,
  });
