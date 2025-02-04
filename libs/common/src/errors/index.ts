import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@eduflow/types';
import { createAppError, createErrorResponse } from './base.error';

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

export * from './base.error';
export * from './auth.error';
export * from './file.error'; 