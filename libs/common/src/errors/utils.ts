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
      FILE: [
        'FILE_SIZE_ERROR',
        'FILE_TYPE_ERROR',
        'FILE_QUOTA_ERROR',
        'FILE_ACCESS_ERROR',
        'FILE_NOT_FOUND',
      ],
      SYSTEM: ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE'],
    };
    return categoryMap[category]?.includes(error.code) ?? false;
  },
  hasMetadata: <C extends ErrorCode>(
    error: AppError,
    code: C
  ): error is AppError & { metadata: ErrorMetadata[C] } =>
    error.code === code && error.metadata !== undefined,
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
        errors: errors.map((e) => ({
          code: e.code,
          message: e.message,
          metadata: e.metadata,
        })),
      },
    },
  });

/**
 * Enhanced request context logging with correlation
 */
export const withRequestContext =
  (request: FastifyRequest) =>
  (error: AppError): AppError => {
    const correlationId = request.id || request.headers['x-request-id'];
    const timestamp = new Date().toISOString();

    // Create a structured log entry for better correlation
    console.error('Error Context:', {
      error: {
        code: error.code,
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
      },
      request: {
        id: correlationId,
        path: request.url,
        method: request.method,
        timestamp,
        headers: {
          'user-agent': request.headers['user-agent'],
          accept: request.headers.accept,
          'content-type': request.headers['content-type'],
        },
      },
      // Safely access user ID if available
      user: (request as any).user?.id,
      service: process.env.SERVICE_NAME || 'unknown',
      environment: process.env.NODE_ENV || 'development',
    });

    // Add correlation ID to error logs for distributed tracing
    if (correlationId) {
      console.error(`[Correlation ID: ${correlationId}] Error occurred in request processing`);
    }

    return error;
  };

/**
 * Enriches an error with additional metadata
 */
export const enrichError =
  <C extends ErrorCode>(metadata: Partial<ErrorMetadata[C]>) =>
  (error: AppError & { code: C }): AppError => ({
    ...error,
    metadata: {
      ...error.metadata,
      ...metadata,
    },
  });

/**
 * Maps one error type to another
 */
export const mapError =
  <T>(mapper: (error: AppError) => AppError) =>
  (te: TE.TaskEither<AppError, T>): TE.TaskEither<AppError, T> =>
    pipe(te, TE.mapLeft(mapper));

/**
 * Provides a fallback value for TaskEither
 */
export const withFallback =
  <T>(fallback: T) =>
  (te: TE.TaskEither<Error, T>): TE.TaskEither<never, T> =>
    pipe(
      te,
      TE.fold(
        () => TE.right(fallback),
        (value) => TE.right(value)
      )
    );

/**
 * Creates a logged error with request context
 */
export const createLoggedError =
  (request: FastifyRequest) =>
  <T>(operation: string) =>
  (error: AppError): TE.TaskEither<AppError, T> =>
    pipe(
      TE.tryCatch(
        async () => {
          const correlationId = request.id || request.headers['x-request-id'];
          const timestamp = new Date().toISOString();

          console.error('Operation Failed:', {
            operation,
            correlationId,
            timestamp,
            error: {
              code: error.code,
              message: error.message,
              metadata: error.metadata,
            },
            request: {
              path: request.url,
              method: request.method,
              service: process.env.SERVICE_NAME,
            },
          });
          return error;
        },
        () => error
      ),
      TE.chain(() => TE.left(error))
    );

/**
 * Logs an error and continues with the error chain
 */
export const loggedError =
  <T>(operation: string) =>
  (error: AppError): TE.TaskEither<AppError, T> =>
    pipe(
      TE.tryCatch(
        async () => {
          console.error('Operation Failed:', {
            operation,
            timestamp: new Date().toISOString(),
            error: {
              code: error.code,
              message: error.message,
              metadata: error.metadata,
            },
            service: process.env.SERVICE_NAME || 'unknown',
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
export const recoverFromCategory =
  <T>(category: ErrorCategory, recovery: (error: AppError) => TE.TaskEither<AppError, T>) =>
  (te: TE.TaskEither<AppError, T>): TE.TaskEither<AppError, T> =>
    pipe(
      te,
      TE.orElse((error) =>
        errorUtils.isCategory(error, category) ? recovery(error) : TE.left(error)
      )
    );

/**
 * Ensures an Option resolves to a value or returns a NotFound error
 */
export const ensureFound =
  <T>(resourceType: string, resourceId: string) =>
  (option: O.Option<T>): E.Either<AppError, T> =>
    pipe(
      option,
      E.fromOption(() =>
        createAppError({
          code: 'NOT_FOUND',
          message: `${resourceType} not found`,
          metadata: {
            resourceType,
            resourceId,
          },
        })
      )
    );

/**
 * Type-safe error metadata accessor
 */
export const getErrorMetadata = <C extends ErrorCode>(
  error: AppError,
  code: C
): O.Option<ErrorMetadata[C]> =>
  errorUtils.hasMetadata(error, code) ? O.some(error.metadata) : O.none;

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
      additionalFields,
    },
  });
