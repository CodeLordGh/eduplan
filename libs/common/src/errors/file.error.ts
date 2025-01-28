import { createError } from './base.error';

export const createFileSizeError = (message: string, details?: unknown) =>
  createError(message, 'FILE_SIZE_ERROR', 413, details);

export const createFileTypeError = (message: string, details?: unknown) =>
  createError(message, 'FILE_TYPE_ERROR', 415, details);

export const createFileQuotaError = (message: string, details?: unknown) =>
  createError(message, 'FILE_QUOTA_ERROR', 507, details);

export const createFileAccessError = (message: string, details?: unknown) =>
  createError(message, 'FILE_ACCESS_ERROR', 403, details);

export const createFileNotFoundError = (message: string, details?: unknown) =>
  createError(message, 'FILE_NOT_FOUND', 404, details); 