import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { BaseError } from './base.error';

export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (error instanceof BaseError) {
    return reply.status(error.statusCode || 500).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  }

  return reply.status(500).send({
    error: 'InternalServerError',
    message: error.message,
    statusCode: 500,
  });
};

export * from './base.error'; 