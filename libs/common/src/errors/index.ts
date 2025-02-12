import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError, Logger } from '@eduflow/types';
import { createErrorLogger } from '@eduflow/logger';
import { createAppError, createErrorResponse } from './base.error';

// Export error types and utilities
export * from './base.error';
export * from './auth.error';
export * from './file.error';
export * from './utils';

// Export error creation utilities
export { createAppError, createErrorResponse };

// Create a generic error creator
export const createError = (
  message: string,
  code: string,
  statusCode: number,
  originalError?: unknown
): Error & { code: string; statusCode: number } => ({
  name: 'ApplicationError',
  message,
  code,
  statusCode,
  stack: originalError instanceof Error ? originalError.stack : undefined,
});

// Export error handler
export const errorHandler = (
  logger: Logger,
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const errorLogger = createErrorLogger(logger);

  if ((error as AppError).code) {
    const appError = error as AppError;
    // Log the known error
    errorLogger.logError(appError, {
      requestId: request.id,
      path: request.url,
      method: request.method,
    });

    return reply.status(appError.statusCode).send(createErrorResponse(appError));
  }

  // Handle unknown errors
  const appError = createAppError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred',
    cause: error,
  });

  // Log the unknown error
  errorLogger.logError(appError, {
    requestId: request.id,
    path: request.url,
    method: request.method,
    originalError: error,
  });

  return reply.status(appError.statusCode).send(createErrorResponse(appError));
};
