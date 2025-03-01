import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { BaseError } from '@eduflow/common';
import { AppError } from '@eduflow/types';

export const errorHandler = (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
  request.log.error(error);

  // If it's already a BaseError, use its status code and name
  if (error instanceof BaseError) {
    const appError = error as AppError;
    const response: any = {
      statusCode: appError.statusCode || 500,
      error: error.name,
      message: error.message,
    };

    // Only add cause if it exists and is not undefined
    if ('cause' in error && error.cause !== undefined) {
      response.cause = error.cause;
    }

    return reply.status(appError.statusCode || 500).send(response);
  }

  // Handle validation errors from Fastify
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message,
      validation: error.validation,
    });
  }

  // Handle file size errors
  if (error.message.includes('size')) {
    return reply.status(413).send({
      statusCode: 413,
      error: 'Payload Too Large',
      message: error.message,
    });
  }

  // Handle file type errors
  if (error.message.includes('mime type') || error.message.includes('file type')) {
    return reply.status(415).send({
      statusCode: 415,
      error: 'Unsupported Media Type',
      message: error.message,
    });
  }

  // Handle quota errors
  if (error.message.includes('quota')) {
    return reply.status(507).send({
      statusCode: 507,
      error: 'Insufficient Storage',
      message: error.message,
    });
  }

  // Handle access errors
  if (error.message.includes('access') || error.message.includes('permission')) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: error.message,
    });
  }

  // Handle not found errors
  if (error.message.includes('not found')) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: error.message,
    });
  }

  // Default error response
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An internal server error occurred',
  });
};
