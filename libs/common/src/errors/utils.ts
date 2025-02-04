import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { FastifyRequest } from 'fastify';
import { AppError, ErrorCode, ErrorMetadata, ErrorCategory } from '@eduflow/types';
import { createAppError } from './base.error';

// Error category utilities
const errorUtils = {
  isCategory: (error: AppError, category: ErrorCategory): boolean => {
    const categoryMap: Record<ErrorCategory, ErrorCode[]> = {
      AUTH: ['AUTH_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'],
      RESOURCE: ['NOT_FOUND', 'CONFLICT'],
      VALIDATION: ['VALIDATION_ERROR', 'BAD_REQUEST'],
      FILE: ['FILE_SIZE_ERROR', 'FILE_TYPE_ERROR', 'FILE_QUOTA_ERROR', 'FILE_ACCESS_ERROR', 'FILE_NOT_FOUND'],
      SYSTEM: ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE']
    };
    return categoryMap[category]?.includes(error.code) ?? false;
  },
  hasMetadata: <C extends ErrorCode>(error: AppError, code: C): error is AppError & { metadata: ErrorMetadata[C] } => 
    error.code === code && error.metadata !== undefined
};

/**
 * Combines multiple errors into a single error
 */
export const combineErrors = (errors: AppError[]): AppError => 
  createAppError({
    code: 'VALIDATION_ERROR',
    message: 'Multiple errors occurred',
    metadata: {
      field: 'multiple',
      value: undefined,
      constraint: 'multiple',
      additionalFields: {
        errors: errors.map(e => ({
          code: e.code,
          message: e.message,
          metadata: e.metadata
        }))
      }
    }
  });

/**
 * Adds request context to error logging without modifying the error structure
 */
export const withRequestContext = (request: FastifyRequest) =>
  (error: AppError): AppError => {
    // Log the request context
    console.error('Request Context:', {
      path: request.url,
      method: request.method,
      requestId: request.id,
      timestamp: new Date()
    });
    return error;
  };

/**
 * Enriches an error with additional metadata
 */
export const enrichError = <C extends ErrorCode>(
  metadata: Partial<ErrorMetadata[C]>
) => (error: AppError & { code: C }): AppError => ({
  ...error,
  metadata: {
    ...error.metadata,
    ...metadata
  }
});

/**
 * Maps one error type to another
 */
export const mapError = <T>(
  mapper: (error: AppError) => AppError
) => (te: TE.TaskEither<AppError, T>): TE.TaskEither<AppError, T> =>
  pipe(
    te,
    TE.mapLeft(mapper)
  );

/**
 * Provides a fallback value for TaskEither
 */
export const withFallback = <T>(fallback: T) => 
  (te: TE.TaskEither<Error, T>): TE.TaskEither<never, T> =>
    pipe(
      te,
      TE.fold(
        () => TE.right(fallback),
        value => TE.right(value)
      )
    );

/**
 * Logs an error and continues with the error chain
 */
export const loggedError = <T>(operation: string) => 
  (error: AppError): TE.TaskEither<AppError, T> =>
    pipe(
      TE.tryCatch(
        async () => {
          console.error('Operation failed:', {
            operation,
            error: {
              code: error.code,
              message: error.message,
              metadata: error.metadata
            }
          });
          return error;
        },
        () => error
      ),
      TE.chain(() => TE.left(error))
    );

/**
 * Type-safe error recovery based on error category
 */
export const recoverFromCategory = <T>(
  category: ErrorCategory,
  recovery: (error: AppError) => TE.TaskEither<AppError, T>
) => (te: TE.TaskEither<AppError, T>): TE.TaskEither<AppError, T> =>
  pipe(
    te,
    TE.orElse(error =>
      errorUtils.isCategory(error, category)
        ? recovery(error)
        : TE.left(error)
    )
  );

/**
 * Ensures an Option resolves to a value or returns a NotFound error
 */
export const ensureFound = <T>(resourceType: string, resourceId: string) =>
  (option: O.Option<T>): E.Either<AppError, T> =>
    pipe(
      option,
      E.fromOption(() => createAppError({
        code: 'NOT_FOUND',
        message: `${resourceType} not found`,
        metadata: {
          resourceType,
          resourceId
        }
      }))
    );

/**
 * Type-safe error metadata accessor
 */
export const getErrorMetadata = <C extends ErrorCode>(
  error: AppError,
  code: C
): O.Option<ErrorMetadata[C]> =>
  errorUtils.hasMetadata(error, code)
    ? O.some(error.metadata)
    : O.none;

/**
 * Validation error helper
 */
export const createFieldValidationError = (
  field: string,
  value: unknown,
  constraint: string,
  additionalFields?: Record<string, unknown>
): AppError =>
  createAppError({
    code: 'VALIDATION_ERROR',
    message: `Validation failed for field: ${field}`,
    metadata: {
      field,
      value,
      constraint,
      additionalFields
    }
  }); 