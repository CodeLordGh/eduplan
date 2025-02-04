import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@eduflow/types';
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
  stack: originalError instanceof Error ? originalError.stack : undefined
});

// Export error handler
export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if ((error as AppError).code) {
    return reply.status((error as AppError).statusCode).send(
      createErrorResponse(error as AppError)
    );
  }

  // Handle unknown errors
  const appError = createAppError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred',
    cause: error
  });

  return reply.status(appError.statusCode).send(createErrorResponse(appError));
};

// export * from './base';
// export * from './app';
// export * from './validation'; 